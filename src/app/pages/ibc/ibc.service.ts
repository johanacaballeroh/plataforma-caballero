import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '@/app/core/supabase/supabase.client';
import { IbcDocument, IbcEvent, IbcListParams, IbcOption, IbcRegistryRow, IbcServiceCycle, ReceiveIbcPayload, RecordIbcEventPayload, ibcCsvCell } from './ibc.models';

@Injectable({ providedIn: 'root' })
export class IbcService {
    private readonly client = inject(SupabaseClientService).client;

    private pattern(value: string): string {
        return `%${value.trim().replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`;
    }

    private servicesQuery(params: IbcListParams, head = false) {
        let query = this.client.from('v_ibc_services').select('*', { count: 'exact', head });

        if (params.search?.trim()) {
            const value = JSON.stringify(this.pattern(params.search));

            query = query.or(['container_code', 'original_number', 'company_name', 'chemical_name', 'gre_entry', 'purchase_order'].map((field) => `${field}.ilike.${value}`).join(','));
        }

        if (params.status === 'open') query = query.neq('status', 'delivered');
        else if (params.status) query = query.eq('status', params.status);
        if (params.companyId) query = query.eq('company_id', params.companyId);
        if (params.chemicalId) query = query.eq('chemical_id', params.chemicalId);
        if (params.containerId) query = query.eq('container_id', params.containerId);
        if (params.dateFrom) query = query.gte('received_at', `${params.dateFrom}T00:00:00-05:00`);
        if (params.dateTo) query = query.lte('received_at', `${params.dateTo}T23:59:59.999999-05:00`);

        const allowed = ['container_code', 'original_number', 'company_name', 'chemical_name', 'received_at', 'status', 'delivered_at', 'wash_count', 'gre_entry', 'purchase_order'];
        const field = allowed.includes(params.sortField) ? params.sortField : 'received_at';

        return query.order(field, { ascending: params.sortOrder === 1 }).order('id');
    }

    async listServices(params: IbcListParams) {
        const { data, count, error } = await this.servicesQuery(params).range(params.first, params.first + params.rows - 1);

        if (error) throw error;

        return { rows: (data ?? []) as IbcServiceCycle[], total: count ?? 0 };
    }

    async getService(id: string): Promise<IbcServiceCycle> {
        const { data, error } = await this.client.from('v_ibc_services').select('*').eq('id', id).single();

        if (error) throw error;

        return data as IbcServiceCycle;
    }

    async listRegistry(chemical: boolean, params: IbcListParams) {
        let query = this.client.from(chemical ? 'ibc_chemicals' : 'v_ibc_containers').select('*', { count: 'exact' });

        if (params.search?.trim()) {
            const value = JSON.stringify(this.pattern(params.search));

            query = chemical ? query.ilike('name', this.pattern(params.search)) : query.or(`code.ilike.${value},original_number.ilike.${value}`);
        }

        if (params.status) query = query.eq('status', params.status);

        const allowed = chemical ? ['name', 'status', 'created_at'] : ['code', 'original_number', 'status', 'created_at', 'wash_count', 'cycle_count'];
        const sort = allowed.includes(params.sortField) ? params.sortField : 'created_at';
        const { data, count, error } = await query.order(sort, { ascending: params.sortOrder === 1 }).order('id').range(params.first, params.first + params.rows - 1);

        if (error) throw error;

        return { rows: (data ?? []) as IbcRegistryRow[], total: count ?? 0 };
    }

    async getRegistry(chemical: boolean, id: string): Promise<IbcRegistryRow> {
        const { data, error } = await this.client.from(chemical ? 'ibc_chemicals' : 'v_ibc_containers').select('*').eq('id', id).single();

        if (error) throw error;

        return data as IbcRegistryRow;
    }

    async saveRegistry(chemical: boolean, id: string | null, fields: { identity: string; description: string; status: string }): Promise<void> {
        const payload: Record<string, string> = chemical ? { name: fields.identity.trim(), description: fields.description.trim(), status: fields.status } : { original_number: fields.identity.trim(), notes: fields.description.trim(), status: fields.status };
        const table = this.client.from(chemical ? 'ibc_chemicals' : 'ibc_containers');
        const { error, data } = await (id ? table.update(payload).eq('id', id) : table.insert(payload)).select('id');

        if (error) throw error;
        if (!data?.length) throw new Error('No se pudo guardar. Revisa tus permisos y el estado del registro.');
    }

    // Opciones remotas: busca en servidor; evita cargar catalogos completos.
    async options(kind: 'companies' | 'chemicals' | 'containers', search = ''): Promise<IbcOption[]> {
        const table = kind === 'companies' ? 'companies' : kind === 'chemicals' ? 'ibc_chemicals' : 'ibc_containers';
        const field = kind === 'companies' ? 'business_name' : kind === 'chemicals' ? 'name' : 'original_number';
        const columns = kind === 'companies' ? 'id,business_name,ruc' : kind === 'chemicals' ? 'id,name' : 'id,code,original_number';
        let query = this.client.from(table).select(columns).eq('status', 'active');

        if (search.trim()) {
            const value = JSON.stringify(this.pattern(search));

            query = kind === 'companies' ? query.or(`business_name.ilike.${value},ruc.ilike.${value}`) : kind === 'containers' ? query.or(`code.ilike.${value},original_number.ilike.${value}`) : query.ilike(field, this.pattern(search));
        }

        const { data, error } = await query.order(field).limit(50);

        if (error) throw error;

        return (data as unknown as Record<string, string>[]).map((row) => ({ id: row['id'], label: kind === 'companies' ? `${row['business_name']} · ${row['ruc']}` : kind === 'chemicals' ? row['name'] : `${row['code']} · N.° ${row['original_number']}` }));
    }

    async receive(payload: ReceiveIbcPayload): Promise<string> {
        const { data, error } = await this.client.rpc('ibc_receive', {
            p_container_id: payload.containerId, p_original_number: payload.originalNumber.trim(), p_company_id: payload.companyId,
            p_chemical_id: payload.chemicalId, p_received_at: payload.receivedAt.toISOString(), p_gre_entry: payload.greEntry,
            p_purchase_order: payload.purchaseOrder, p_notes: payload.notes
        });

        if (error) throw error;

        return data as string;
    }

    async updateCycle(id: string, payload: { company_id: string; chemical_id: string; gre_entry: string; purchase_order: string; notes: string }): Promise<void> {
        const { data, error } = await this.client.from('ibc_service_cycles').update(payload).eq('id', id).select('id');

        if (error) throw error;
        if (!data?.length) throw new Error('El servicio está cerrado o no tienes permiso para editarlo.');
    }

    async events(cycleId: string): Promise<IbcEvent[]> {
        const { data, error } = await this.client.from('ibc_service_events').select('*').eq('cycle_id', cycleId).order('sequence', { ascending: false });

        if (error) throw error;

        const events = (data ?? []) as IbcEvent[];
        const actorIds = [...new Set(events.map((event) => event.created_by).filter(Boolean))];

        if (!actorIds.length) return events;

        const { data: profiles } = await this.client.from('profiles').select('id, full_name').in('id', actorIds);
        const actorNames = new Map(profiles?.map((profile) => [profile.id, profile.full_name]));

        return events.map((event) => ({ ...event, actor_name: actorNames.get(event.created_by) }));
    }

    async recordEvent(payload: RecordIbcEventPayload): Promise<void> {
        const { error } = await this.client.from('ibc_service_events').insert({
            cycle_id: payload.cycleId, kind: payload.kind, happened_at: payload.happenedAt.toISOString(),
            result: payload.kind === 'test' ? payload.result : null, notes: payload.notes,
            recipient_company_id: payload.kind === 'deliver' ? payload.recipientCompanyId : null,
            gre_exit: payload.kind === 'deliver' ? payload.greExit : null
        });

        if (error) throw error;
    }

    async documents(cycleId: string): Promise<IbcDocument[]> {
        const { data, error } = await this.client.from('ibc_documents').select('*').eq('cycle_id', cycleId).order('created_at', { ascending: false });

        if (error) throw error;

        return (data ?? []) as IbcDocument[];
    }

    async uploadDocument(cycleId: string, kind: IbcDocument['document_kind'], file: File): Promise<void> {
        if (!['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size <= 0 || file.size > 20971520) throw new Error('Selecciona un PDF o imagen PNG/JPEG/WebP de hasta 20 MB.');

        const path = `${cycleId}/${crypto.randomUUID()}/${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const bucket = this.client.storage.from('ibc-documents');
        const { error: uploadError } = await bucket.upload(path, file, { upsert: false, contentType: file.type });

        if (uploadError) throw uploadError;

        const { error } = await this.client.from('ibc_documents').insert({ cycle_id: cycleId, document_kind: kind, file_name: file.name, storage_path: path, mime_type: file.type, size_bytes: file.size });

        if (error) {
            const { error: cleanupError } = await bucket.remove([path]);

            if (cleanupError) console.error('No se pudo limpiar un archivo sin metadata.', cleanupError.message);
            throw error;
        }
    }

    async downloadDocument(document: IbcDocument): Promise<void> {
        const { data, error } = await this.client.storage.from(document.storage_bucket).download(document.storage_path);

        if (error) throw error;
        this.download(data, document.file_name);
    }

    async summary(params: IbcListParams): Promise<Record<string, number>> {
        const statuses = ['received', 'awaiting_test', 'retained', 'ready_for_delivery', 'delivered'];
        const counts = await Promise.all(statuses.map(async (status) => {
            const { count, error } = await this.servicesQuery({ ...params, status }, true);

            if (error) throw error;

            return [status, count ?? 0] as const;
        }));

        return Object.fromEntries(counts);
    }

    async exportCsv(params: IbcListParams): Promise<void> {
        const header = ['Código', 'Número original', 'Empresa', 'Químico', 'Ingreso', 'GRE ingreso', 'OC', 'Estado', 'Lavados registrados', 'Rotación de origen', 'Entrega'];
        const rows: string[] = [header.map(ibcCsvCell).join(';')];
        let first = 0;

        for (;;) {
            const page = await this.listServices({ ...params, first, rows: 500 });

            for (const row of page.rows) rows.push([row.container_code, row.original_number, row.company_name, row.chemical_name, row.received_at, row.gre_entry, row.purchase_order, row.status, row.wash_count, row.legacy_rotation, row.delivered_at].map(ibcCsvCell).join(';'));
            first += page.rows.length;
            if (first >= page.total) break;
            if (!page.rows.length) throw new Error('No se pudo completar la exportación. Inténtalo nuevamente.');
        }

        const fileName = `reporte-ibc-${new Date().toISOString().slice(0, 10)}.csv`;
        const { error } = await this.client.from('report_exports').insert({ report_type: 'ibc_services', filters: params, file_name: fileName, generated_by: (await this.client.auth.getUser()).data.user?.id });

        if (error) throw error;
        this.download(new Blob(['\uFEFF', rows.join('\r\n')], { type: 'text/csv;charset=utf-8' }), fileName);
    }

    private download(blob: Blob, name: string): void {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = name;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}
