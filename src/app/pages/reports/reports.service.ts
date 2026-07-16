import { Injectable, inject } from '@angular/core';
import { AuthService } from '@/app/core/auth/auth.service';
import { SupabaseClientService } from '@/app/core/supabase/supabase.client';

export type CertificateReportStatus = 'active' | 'inactive';

export interface CertificateReportRow {
    fecha: string | null;
    numero_ticket: string | null;
    cliente: string | null;
    ruc: string | null;
    placa: string | null;
    fuente_generacion: string | null;
    direccion_llegada: string | null;
    tipo: string | null;
    cantidad: number | null;
    unidad_medida: string | null;
    peso: number | null;
    codigo_basilea: string | null;
    estado_certificado: CertificateReportStatus | null;
    generator_company_id: string | null;
}

export interface ReportCompanyOption {
    id: string;
    name: string;
    ruc: string;
}

export interface CertificateReportFilters {
    search?: string | null;
    dateFrom?: string | null;
    dateTo?: string | null;
    generatorCompanyId?: string | null;
    status?: CertificateReportStatus | null;
    baselCode?: string | null;
}

export interface CertificateReportListParams {
    first: number;
    rows: number;
    sortField: string;
    sortOrder: 1 | -1;
    filters: CertificateReportFilters;
}

export interface CertificateReportListResult {
    rows: CertificateReportRow[];
    total: number;
}

export interface CertificateReportExportResult {
    rows: CertificateReportRow[];
    fileName: string;
}

export interface ReportExportLog {
    id: string;
    report_type: string;
    filters: CertificateReportFilters | Record<string, unknown>;
    file_name: string | null;
    storage_bucket: string | null;
    storage_path: string | null;
    generated_by: string | null;
    generated_at: string;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
    private readonly supabase = inject(SupabaseClientService).client;
    private readonly auth = inject(AuthService);
    private readonly sortableFields = new Set([
        'fecha',
        'numero_ticket',
        'cliente',
        'ruc',
        'placa',
        'fuente_generacion',
        'direccion_llegada',
        'tipo',
        'cantidad',
        'unidad_medida',
        'peso',
        'codigo_basilea',
        'estado_certificado'
    ]);

    async listCertificateReport(params: CertificateReportListParams): Promise<CertificateReportListResult> {
        let query = this.buildCertificateReportQuery(params.filters, { count: 'exact' });

        const sortField = this.sortableFields.has(params.sortField) ? params.sortField : 'fecha';

        query = query.order(sortField, { ascending: params.sortOrder === 1, nullsFirst: false }).range(params.first, params.first + params.rows - 1);

        const { data, error, count } = await query.returns<CertificateReportRow[]>();

        if (error) {
            throw error;
        }

        return {
            rows: data ?? [],
            total: count ?? 0
        };
    }

    async exportCertificateReport(filters: CertificateReportFilters, sortField = 'fecha', sortOrder: 1 | -1 = -1): Promise<CertificateReportExportResult> {
        const safeSortField = this.sortableFields.has(sortField) ? sortField : 'fecha';
        const fileName = `reporte-certificados-${this.timestampForFileName()}.xls`;

        const { data, error } = await this.buildCertificateReportQuery(filters)
            .order(safeSortField, { ascending: sortOrder === 1, nullsFirst: false })
            .limit(5000)
            .returns<CertificateReportRow[]>();

        if (error) {
            throw error;
        }

        await this.registerExport(fileName, filters);

        return {
            rows: data ?? [],
            fileName
        };
    }

    async listGeneratorCompanies(): Promise<ReportCompanyOption[]> {
        const { data, error } = await this.supabase
            .from('companies')
            .select('id, business_name, ruc')
            .in('company_type', ['generator', 'both'])
            .eq('status', 'active')
            .order('business_name')
            .returns<{ id: string; business_name: string; ruc: string }[]>();

        if (error) {
            throw error;
        }

        return (data ?? []).map((company) => ({
            id: company.id,
            name: company.business_name,
            ruc: company.ruc
        }));
    }

    async listRecentExports(limit = 10): Promise<ReportExportLog[]> {
        const { data, error } = await this.supabase
            .from('report_exports')
            .select('id, report_type, filters, file_name, storage_bucket, storage_path, generated_by, generated_at')
            .eq('report_type', 'certificate_report')
            .order('generated_at', { ascending: false })
            .limit(limit)
            .returns<ReportExportLog[]>();

        if (error) {
            throw error;
        }

        return data ?? [];
    }

    private buildCertificateReportQuery(filters: CertificateReportFilters, options?: { count: 'exact' }) {
        let query = this.supabase
            .from('v_certificate_report')
            .select(
                'fecha, numero_ticket, cliente, ruc, placa, fuente_generacion, direccion_llegada, tipo, cantidad, unidad_medida, peso, codigo_basilea, estado_certificado, generator_company_id',
                options
            );

        const search = filters.search?.trim();

        if (search) {
            const pattern = `%${this.escapeLikeValue(search)}%`;

            query = query.or(
                [
                    `numero_ticket.ilike.${pattern}`,
                    `cliente.ilike.${pattern}`,
                    `ruc.ilike.${pattern}`,
                    `placa.ilike.${pattern}`,
                    `fuente_generacion.ilike.${pattern}`,
                    `direccion_llegada.ilike.${pattern}`,
                    `tipo.ilike.${pattern}`,
                    `codigo_basilea.ilike.${pattern}`
                ].join(',')
            );
        }

        if (filters.dateFrom) {
            query = query.gte('fecha', filters.dateFrom);
        }

        if (filters.dateTo) {
            query = query.lte('fecha', filters.dateTo);
        }

        if (filters.generatorCompanyId) {
            query = query.eq('generator_company_id', filters.generatorCompanyId);
        }

        if (filters.status) {
            query = query.eq('estado_certificado', filters.status);
        }

        const baselCode = filters.baselCode?.trim();

        if (baselCode) {
            query = query.ilike('codigo_basilea', `%${this.escapeLikeValue(baselCode)}%`);
        }

        return query;
    }

    private async registerExport(fileName: string, filters: CertificateReportFilters): Promise<void> {
        const { error } = await this.supabase.from('report_exports').insert({
            report_type: 'certificate_report',
            filters,
            file_name: fileName,
            storage_bucket: null,
            storage_path: null,
            generated_by: this.auth.user()?.id ?? null
        });

        if (error) {
            throw error;
        }
    }

    private escapeLikeValue(value: string): string {
        return value.replaceAll('%', '\\%').replaceAll(',', '\\,');
    }

    private timestampForFileName(): string {
        const now = new Date();
        const pad = (value: number): string => String(value).padStart(2, '0');

        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    }
}
