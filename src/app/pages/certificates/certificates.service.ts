import { Injectable, inject } from '@angular/core';
import { AuthService } from '@/app/core/auth/auth.service';
import { SupabaseClientService } from '@/app/core/supabase/supabase.client';

export type CertificateStatus = 'active' | 'inactive';

export interface CertificateOption {
    id: string;
    name: string;
    status?: string;
}

export interface CompanyOption extends CertificateOption {
    ruc: string;
    company_type: string;
    fiscal_address: string | null;
}

export interface CompanyAddressOption {
    id: string;
    company_id: string;
    name: string;
    address: string;
}

export interface GenerationTypeOption extends CertificateOption {
    description: string | null;
    show_final_destination_company: boolean;
    show_destination_place: boolean;
}

export interface TemplateVersionOption {
    id: string;
    certificate_generation_type_id: string;
    version_number: number;
    name: string;
    storage_bucket: string;
    storage_path: string;
    is_active: boolean;
}

export interface ItemOption extends CertificateOption {
    code: string;
    unit_name: string;
    category_name: string;
    item_type_name: string;
    basel_code: string | null;
}

export interface CertificateFormOptions {
    companies: CompanyOption[];
    generationTypes: GenerationTypeOption[];
    templateVersions: TemplateVersionOption[];
    companyAddresses: CompanyAddressOption[];
    items: ItemOption[];
    quantityTypes: CertificateOption[];
    documentTypes: CertificateOption[];
}

export interface ManagedCertificate {
    id: string;
    certificate_number: string;
    generation_type_id: string;
    template_version_id: string | null;
    issue_date: string;
    operation_date: string;
    guide_number: string;
    generation_source: string | null;
    generator_address: string | null;
    generator_company_id: string;
    transporter_company_id: string | null;
    transporter_address: string | null;
    final_destination_company_id: string | null;
    destination_place: string | null;
    observations: string | null;
    status: CertificateStatus;
    issued_at: string | null;
    created_by: string | null;
    updated_by: string | null;
    created_at: string;
    updated_at: string;
    generation_type: { name: string; show_final_destination_company: boolean; show_destination_place: boolean } | null;
    template_version: { name: string; version_number: number } | null;
    generator_company: { business_name: string; ruc: string } | null;
    transporter_company: { business_name: string; ruc: string } | null;
    final_destination_company: { business_name: string; ruc: string } | null;
    items_count: number;
    documents_count: number;
    files_count: number;
}

export interface CertificateItem {
    id: string;
    certificate_id: string;
    item_id: string;
    quantity_type_id: string | null;
    quantity: number | null;
    weight: number | null;
    price: number | null;
    description: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
    item: ItemOption | null;
    quantity_type: CertificateOption | null;
}

export interface CertificateDocument {
    id: string;
    certificate_id: string;
    document_type_id: string;
    file_name: string;
    storage_bucket: string;
    storage_path: string;
    mime_type: string | null;
    size_bytes: number | null;
    uploaded_by: string | null;
    created_at: string;
    document_type: CertificateOption | null;
}

export interface CertificateFile {
    id: string;
    certificate_id: string;
    template_version_id: string | null;
    file_name: string;
    storage_bucket: string;
    storage_path: string;
    version_number: number;
    is_current: boolean;
    generated_by: string | null;
    generated_at: string;
    template_version: { name: string; version_number: number } | null;
}

export interface CertificateListFilters {
    series?: string | null;
    number?: string | null;
    status?: CertificateStatus | null;
    generatorCompanyId?: string | null;
}

export interface CertificateListParams {
    first: number;
    rows: number;
    sortField: string;
    sortOrder: 1 | -1;
    filters: CertificateListFilters;
}

export interface CertificateListResult {
    certificates: ManagedCertificate[];
    total: number;
}

export interface SaveCertificatePayload {
    generation_type_id: string;
    issue_date: string;
    operation_date: string;
    guide_number: string;
    generation_source: string | null;
    generator_address: string | null;
    generator_company_id: string;
    transporter_company_id: string | null;
    transporter_address: string | null;
    final_destination_company_id: string | null;
    destination_place: string | null;
    observations: string | null;
    status: CertificateStatus;
}

export interface SaveCertificateItemPayload {
    item_id: string;
    quantity_type_id: string | null;
    quantity: number | null;
    weight: number | null;
    price: number | null;
    description: string | null;
    sort_order: number;
}

interface CertificateRow {
    id: string;
    certificate_number: string;
    generation_type_id: string;
    template_version_id: string | null;
    issue_date: string;
    operation_date: string;
    guide_number: string;
    generation_source: string | null;
    generator_address: string | null;
    generator_company_id: string;
    transporter_company_id: string | null;
    transporter_address: string | null;
    final_destination_company_id: string | null;
    destination_place: string | null;
    observations: string | null;
    status: CertificateStatus;
    issued_at: string | null;
    created_by: string | null;
    updated_by: string | null;
    created_at: string;
    updated_at: string;
    generation_type: { name: string; show_final_destination_company: boolean; show_destination_place: boolean } | null;
    template_version: { name: string; version_number: number } | null;
    generator_company: { business_name: string; ruc: string } | null;
    transporter_company: { business_name: string; ruc: string } | null;
    final_destination_company: { business_name: string; ruc: string } | null;
}

const CERTIFICATE_SELECT = `
id,
certificate_number,
generation_type_id,
template_version_id,
issue_date,
operation_date,
guide_number,
generation_source,
generator_address,
generator_company_id,
transporter_company_id,
transporter_address,
final_destination_company_id,
destination_place,
observations,
status,
issued_at,
created_by,
updated_by,
created_at,
updated_at,
generation_type:certificate_generation_types(name, show_final_destination_company, show_destination_place),
template_version:certificate_template_versions(name, version_number),
generator_company:companies!certificates_generator_company_id_fkey(business_name, ruc),
transporter_company:companies!certificates_transporter_company_id_fkey(business_name, ruc),
final_destination_company:companies!certificates_final_destination_company_id_fkey(business_name, ruc)
`;

@Injectable({ providedIn: 'root' })
export class CertificatesService {
    private readonly supabase = inject(SupabaseClientService).client;
    private readonly auth = inject(AuthService);
    private readonly sortableFields = new Set(['certificate_number', 'issue_date', 'operation_date', 'guide_number', 'generation_source', 'status', 'created_at', 'updated_at']);

    async listCertificates(params: CertificateListParams): Promise<CertificateListResult> {
        let query = this.supabase.from('certificates').select(CERTIFICATE_SELECT, { count: 'exact' });

        const series = params.filters.series?.trim();
        if (series) {
            query = query.ilike('certificate_number', `${series.replaceAll('%', '\\%').replaceAll(',', '\\,')}%`);
        }

        const number = params.filters.number?.trim();
        if (number) {
            const pattern = `%${number.replaceAll('%', '\\%').replaceAll(',', '\\,')}%`;
            query = query.or(`certificate_number.ilike.${pattern},guide_number.ilike.${pattern}`);
        }

        if (params.filters.status) {
            query = query.eq('status', params.filters.status);
        }

        if (params.filters.generatorCompanyId) {
            query = query.eq('generator_company_id', params.filters.generatorCompanyId);
        }

        const sortField = this.sortableFields.has(params.sortField) ? params.sortField : 'created_at';
        query = query.order(sortField, { ascending: params.sortOrder === 1 }).range(params.first, params.first + params.rows - 1);

        const { data, error, count } = await query.returns<CertificateRow[]>();

        if (error) {
            throw error;
        }

        const ids = (data ?? []).map((certificate) => certificate.id);
        const [itemCounts, documentCounts, fileCounts] = await Promise.all([this.countByCertificate('certificate_items', ids), this.countByCertificate('certificate_documents', ids), this.countByCertificate('certificate_files', ids)]);

        return {
            certificates: (data ?? []).map((row) => this.mapCertificate(row, itemCounts.get(row.id) ?? 0, documentCounts.get(row.id) ?? 0, fileCounts.get(row.id) ?? 0)),
            total: count ?? 0
        };
    }

    async getCertificate(certificateId: string): Promise<ManagedCertificate> {
        const { data, error } = await this.supabase.from('certificates').select(CERTIFICATE_SELECT).eq('id', certificateId).single().returns<CertificateRow>();

        if (error) {
            throw error;
        }

        const [itemCounts, documentCounts, fileCounts] = await Promise.all([this.countByCertificate('certificate_items', [certificateId]), this.countByCertificate('certificate_documents', [certificateId]), this.countByCertificate('certificate_files', [certificateId])]);
        return this.mapCertificate(data, itemCounts.get(certificateId) ?? 0, documentCounts.get(certificateId) ?? 0, fileCounts.get(certificateId) ?? 0);
    }

    async createCertificate(payload: SaveCertificatePayload): Promise<ManagedCertificate> {
        const userId = this.auth.user()?.id ?? null;
        const certificateNumber = await this.generateCertificateNumber(payload.issue_date);
        const templateVersionId = await this.getActiveTemplateVersionId(payload.generation_type_id);
        const { data, error } = await this.supabase
            .from('certificates')
            .insert({ ...this.mapCertificatePayload(payload, templateVersionId), certificate_number: certificateNumber, created_by: userId, updated_by: userId })
            .select('id')
            .single()
            .returns<{ id: string }>();

        if (error) {
            throw error;
        }

        return this.getCertificate(data.id);
    }

    async updateCertificate(certificateId: string, payload: SaveCertificatePayload): Promise<ManagedCertificate> {
        const templateVersionId = await this.getActiveTemplateVersionId(payload.generation_type_id);
        const { error } = await this.supabase.from('certificates').update({ ...this.mapCertificatePayload(payload, templateVersionId), updated_by: this.auth.user()?.id ?? null }).eq('id', certificateId);

        if (error) {
            throw error;
        }

        return this.getCertificate(certificateId);
    }

    async issueCertificate(certificate: ManagedCertificate): Promise<void> {
        if (certificate.status === 'active') {
            return;
        }

        const { error } = await this.supabase
            .from('certificates')
            .update({ status: 'active', issued_at: new Date().toISOString(), updated_by: this.auth.user()?.id ?? null })
            .eq('id', certificate.id);

        if (error) {
            throw error;
        }
    }

    async updateStatus(certificateId: string, status: CertificateStatus): Promise<void> {
        const { error } = await this.supabase.from('certificates').update({ status, updated_by: this.auth.user()?.id ?? null }).eq('id', certificateId);

        if (error) {
            throw error;
        }
    }

    async deleteCertificate(certificate: ManagedCertificate): Promise<void> {
        const { error } = await this.supabase.from('certificates').delete().eq('id', certificate.id);

        if (error) {
            throw error;
        }
    }

    async listItems(certificateId: string): Promise<CertificateItem[]> {
        const { data, error } = await this.supabase
            .from('certificate_items')
            .select(
                `
id,
certificate_id,
item_id,
quantity_type_id,
quantity,
weight,
price,
description,
sort_order,
created_at,
updated_at,
item:items(id, code, name, status, unit:units(name), category:categories(name), item_type:item_types(name), basel_code:basel_codes(code)),
quantity_type:quantity_types(id, name, status)
`
            )
            .eq('certificate_id', certificateId)
            .order('sort_order', { ascending: true })
            .returns<any[]>();

        if (error) {
            throw error;
        }

        return (data ?? []).map((row) => ({
            id: row.id,
            certificate_id: row.certificate_id,
            item_id: row.item_id,
            quantity_type_id: row.quantity_type_id,
            quantity: row.quantity === null ? null : Number(row.quantity),
            weight: row.weight === null ? null : Number(row.weight),
            price: row.price === null ? null : Number(row.price),
            description: row.description,
            sort_order: row.sort_order,
            created_at: row.created_at,
            updated_at: row.updated_at,
            item: row.item ? this.mapItemOption(row.item) : null,
            quantity_type: row.quantity_type ? { id: row.quantity_type.id, name: row.quantity_type.name, status: row.quantity_type.status } : null
        }));
    }

    async createItem(certificateId: string, payload: SaveCertificateItemPayload): Promise<void> {
        const { error } = await this.supabase.from('certificate_items').insert({ ...this.mapItemPayload(payload), certificate_id: certificateId });

        if (error) {
            throw error;
        }
    }

    async updateItem(certificateItemId: string, payload: SaveCertificateItemPayload): Promise<void> {
        const { error } = await this.supabase.from('certificate_items').update(this.mapItemPayload(payload)).eq('id', certificateItemId);

        if (error) {
            throw error;
        }
    }

    async deleteItem(certificateItemId: string): Promise<void> {
        const { error } = await this.supabase.from('certificate_items').delete().eq('id', certificateItemId);

        if (error) {
            throw error;
        }
    }

    async listDocuments(certificateId: string): Promise<CertificateDocument[]> {
        const { data, error } = await this.supabase
            .from('certificate_documents')
            .select('id, certificate_id, document_type_id, file_name, storage_bucket, storage_path, mime_type, size_bytes, uploaded_by, created_at, document_type:document_types(id, name, status)')
            .eq('certificate_id', certificateId)
            .order('created_at', { ascending: false })
            .returns<any[]>();

        if (error) {
            throw error;
        }

        return (data ?? []).map((row) => ({
            ...row,
            document_type: row.document_type ? { id: row.document_type.id, name: row.document_type.name, status: row.document_type.status } : null
        }));
    }

    async uploadDocument(certificateId: string, documentTypeId: string, file: File): Promise<void> {
        const bucket = 'certificate-documents';
        const storagePath = `${certificateId}/${crypto.randomUUID()}-${this.sanitizeFileName(file.name)}`;
        const { error: uploadError } = await this.supabase.storage.from(bucket).upload(storagePath, file, { contentType: file.type || undefined, upsert: false });

        if (uploadError) {
            throw uploadError;
        }

        const { error } = await this.supabase.from('certificate_documents').insert({
            certificate_id: certificateId,
            document_type_id: documentTypeId,
            file_name: file.name,
            storage_bucket: bucket,
            storage_path: storagePath,
            mime_type: file.type || null,
            size_bytes: file.size,
            uploaded_by: this.auth.user()?.id ?? null
        });

        if (error) {
            await this.supabase.storage.from(bucket).remove([storagePath]);
            throw error;
        }
    }

    async deleteDocument(document: CertificateDocument): Promise<void> {
        const { error } = await this.supabase.from('certificate_documents').delete().eq('id', document.id);

        if (error) {
            throw error;
        }

        await this.supabase.storage.from(document.storage_bucket).remove([document.storage_path]);
    }

    async listFiles(certificateId: string): Promise<CertificateFile[]> {
        const { data, error } = await this.supabase
            .from('certificate_files')
            .select('id, certificate_id, template_version_id, file_name, storage_bucket, storage_path, version_number, is_current, generated_by, generated_at, template_version:certificate_template_versions(name, version_number)')
            .eq('certificate_id', certificateId)
            .order('version_number', { ascending: false })
            .returns<CertificateFile[]>();

        if (error) {
            throw error;
        }

        return data ?? [];
    }

    async createSignedUrl(bucket: string, storagePath: string): Promise<string> {
        const { data, error } = await this.supabase.storage.from(bucket).createSignedUrl(storagePath, 60 * 5);

        if (error) {
            throw error;
        }

        return data.signedUrl;
    }

    async getFormOptions(): Promise<CertificateFormOptions> {
        const [companies, generationTypes, templateVersions, companyAddresses, items, quantityTypes, documentTypes] = await Promise.all([
            this.listCompanies(),
            this.listGenerationTypes(),
            this.listTemplateVersions(),
            this.listCompanyAddresses(),
            this.listItemOptions(),
            this.listSimpleOptions('quantity_types'),
            this.listSimpleOptions('document_types')
        ]);

        return { companies, generationTypes, templateVersions, companyAddresses, items, quantityTypes, documentTypes };
    }

    private async listCompanies(): Promise<CompanyOption[]> {
        const { data, error } = await this.supabase.from('companies').select('id, business_name, ruc, company_type, fiscal_address, status').eq('status', 'active').order('business_name').returns<any[]>();

        if (error) {
            throw error;
        }

        return (data ?? []).map((row) => ({ id: row.id, name: row.business_name, ruc: row.ruc, company_type: row.company_type, fiscal_address: row.fiscal_address, status: row.status }));
    }

    private async listCompanyAddresses(): Promise<CompanyAddressOption[]> {
        const [companiesResult, branchesResult] = await Promise.all([
            this.supabase.from('companies').select('id, fiscal_address').eq('status', 'active').returns<{ id: string; fiscal_address: string | null }[]>(),
            this.supabase.from('company_branches').select('id, company_id, name, address, branch_type').eq('status', 'active').order('created_at', { ascending: true }).returns<{ id: string; company_id: string; name: string | null; address: string; branch_type: string }[]>()
        ]);

        if (companiesResult.error) {
            throw companiesResult.error;
        }

        if (branchesResult.error) {
            throw branchesResult.error;
        }

        const fiscalAddresses: CompanyAddressOption[] = (companiesResult.data ?? [])
            .filter((company) => !!company.fiscal_address)
            .map((company) => ({
                id: `${company.id}:fiscal`,
                company_id: company.id,
                name: 'Direccion de la Empresa',
                address: company.fiscal_address ?? ''
            }));

        const branches: CompanyAddressOption[] = (branchesResult.data ?? []).map((branch) => ({
            id: branch.id,
            company_id: branch.company_id,
            name: branch.name || this.branchTypeLabel(branch.branch_type),
            address: branch.address
        }));

        return [...fiscalAddresses, ...branches];
    }

    private async listGenerationTypes(): Promise<GenerationTypeOption[]> {
        const { data, error } = await this.supabase
            .from('certificate_generation_types')
            .select('id, name, description, show_final_destination_company, show_destination_place, status')
            .eq('status', 'active')
            .order('name')
            .returns<GenerationTypeOption[]>();

        if (error) {
            throw error;
        }

        return data ?? [];
    }

    private async listTemplateVersions(): Promise<TemplateVersionOption[]> {
        const { data, error } = await this.supabase
            .from('certificate_template_versions')
            .select('id, certificate_generation_type_id, version_number, name, storage_bucket, storage_path, is_active')
            .eq('is_active', true)
            .order('version_number', { ascending: false })
            .returns<TemplateVersionOption[]>();

        if (error) {
            throw error;
        }

        return data ?? [];
    }

    private async listItemOptions(): Promise<ItemOption[]> {
        const { data, error } = await this.supabase
            .from('items')
            .select('id, code, name, status, unit:units(name), category:categories(name), item_type:item_types(name), basel_code:basel_codes(code)')
            .eq('status', 'active')
            .order('code')
            .returns<any[]>();

        if (error) {
            throw error;
        }

        return (data ?? []).map((row) => this.mapItemOption(row));
    }

    private async listSimpleOptions(table: 'quantity_types' | 'document_types'): Promise<CertificateOption[]> {
        const { data, error } = await this.supabase.from(table).select('id, name, status').eq('status', 'active').order('name').returns<CertificateOption[]>();

        if (error) {
            throw error;
        }

        return data ?? [];
    }

    private async countByCertificate(table: 'certificate_items' | 'certificate_documents' | 'certificate_files', certificateIds: string[]): Promise<Map<string, number>> {
        const counts = new Map<string, number>();

        if (!certificateIds.length) {
            return counts;
        }

        const { data, error } = await this.supabase.from(table).select('certificate_id').in('certificate_id', certificateIds).returns<{ certificate_id: string }[]>();

        if (error) {
            return counts;
        }

        for (const row of data ?? []) {
            counts.set(row.certificate_id, (counts.get(row.certificate_id) ?? 0) + 1);
        }

        return counts;
    }

    async previewNextCertificateNumber(issueDate: string): Promise<string> {
        return this.generateCertificateNumber(issueDate);
    }

    private async generateCertificateNumber(issueDate: string): Promise<string> {
        const year = new Date(`${issueDate}T00:00:00`).getFullYear();
        const from = `${year}-01-01`;
        const to = `${year}-12-31`;
        const { data, error } = await this.supabase.from('certificates').select('certificate_number').gte('issue_date', from).lte('issue_date', to).returns<{ certificate_number: string }[]>();

        if (error) {
            throw error;
        }

        const next =
            (data ?? []).reduce((max, row) => {
                const sequence = this.extractCertificateSequence(row.certificate_number, year);
                return sequence === null ? max : Math.max(max, sequence);
            }, 0) + 1;

        return `${year} - ${String(next).padStart(4, '0')}`;
    }

    private extractCertificateSequence(certificateNumber: string, year: number): number | null {
        const normalized = certificateNumber.trim();
        const currentFormat = normalized.match(/^(\d{4})\s*-\s*(\d+)$/);
        if (currentFormat && Number(currentFormat[1]) === year) {
            return Number(currentFormat[2]);
        }

        const legacyFormat = normalized.match(new RegExp(`(?:^|\\D)${year}\\D+(\\d+)$`));
        return legacyFormat ? Number(legacyFormat[1]) : null;
    }

    private async getActiveTemplateVersionId(generationTypeId: string): Promise<string | null> {
        const { data, error } = await this.supabase
            .from('certificate_template_versions')
            .select('id')
            .eq('certificate_generation_type_id', generationTypeId)
            .eq('is_active', true)
            .maybeSingle()
            .returns<{ id: string }>();

        if (error) {
            throw error;
        }

        return data?.id ?? null;
    }

    private mapCertificatePayload(payload: SaveCertificatePayload, templateVersionId: string | null): Omit<CertificateRow, 'id' | 'certificate_number' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at' | 'issued_at' | 'generation_type' | 'template_version' | 'generator_company' | 'transporter_company' | 'final_destination_company'> {
        return {
            generation_type_id: payload.generation_type_id,
            template_version_id: templateVersionId,
            issue_date: payload.issue_date,
            operation_date: payload.operation_date,
            guide_number: payload.guide_number.trim(),
            generation_source: payload.generation_source?.trim() || null,
            generator_address: payload.generator_address?.trim() || null,
            generator_company_id: payload.generator_company_id,
            transporter_company_id: payload.transporter_company_id || null,
            transporter_address: payload.transporter_address?.trim() || null,
            final_destination_company_id: payload.final_destination_company_id || null,
            destination_place: payload.destination_place?.trim() || null,
            observations: payload.observations?.trim() || null,
            status: payload.status
        };
    }

    private mapItemPayload(payload: SaveCertificateItemPayload): SaveCertificateItemPayload {
        return {
            item_id: payload.item_id,
            quantity_type_id: payload.quantity_type_id || null,
            quantity: payload.quantity,
            weight: payload.weight,
            price: payload.price,
            description: payload.description?.trim() || null,
            sort_order: payload.sort_order
        };
    }

    private mapItemOption(row: any): ItemOption {
        return {
            id: row.id,
            code: row.code,
            name: row.name,
            status: row.status,
            unit_name: row.unit?.name ?? 'Sin unidad',
            category_name: row.category?.name ?? 'Sin categoria',
            item_type_name: row.item_type?.name ?? 'Sin tipo',
            basel_code: row.basel_code?.code ?? null
        };
    }

    private mapCertificate(row: CertificateRow, itemsCount: number, documentsCount: number, filesCount: number): ManagedCertificate {
        return {
            ...row,
            items_count: itemsCount,
            documents_count: documentsCount,
            files_count: filesCount
        };
    }

    private branchTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            deposit: 'Deposito',
            fiscal_address: 'Direccion fiscal',
            office: 'Oficina',
            branch: 'Sucursal'
        };

        return labels[type] ?? 'Direccion';
    }

    private sanitizeFileName(fileName: string): string {
        return fileName
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9._-]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .toLowerCase();
    }
}
