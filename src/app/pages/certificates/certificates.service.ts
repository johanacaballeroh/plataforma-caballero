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
    generation_type: { name: string; description: string | null; show_final_destination_company: boolean; show_destination_place: boolean } | null;
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
    file?: File;
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

export interface CertificateDraftDocument {
    document_type_id: string;
    file: File;
}

interface CertificateTemplateForPdf {
    id: string;
    certificate_generation_type_id: string;
    name: string;
    version_number: number;
    storage_bucket: string;
    storage_path: string;
    is_active: boolean;
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
    generation_type: { name: string; description: string | null; show_final_destination_company: boolean; show_destination_place: boolean } | null;
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
generation_type:certificate_generation_types(name, description, show_final_destination_company, show_destination_place),
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
        const { data, error } = await this.supabase.from('certificate_documents').delete().eq('id', document.id).select('id').maybeSingle().returns<{ id: string }>();

        if (error) {
            throw error;
        }

        if (!data) {
            throw new Error('No se elimino el documento. Revisa permisos RLS para editar certificados.');
        }

        const { error: storageError } = await this.supabase.storage.from(document.storage_bucket).remove([document.storage_path]);

        if (storageError) {
            throw storageError;
        }
    }

    async getCertificatePdf(certificateId: string): Promise<CertificateFile | null> {
        const { data, error } = await this.supabase
            .from('certificate_files')
            .select('id, certificate_id, template_version_id, file_name, storage_bucket, storage_path, version_number, is_current, generated_by, generated_at, template_version:certificate_template_versions(name, version_number)')
            .eq('certificate_id', certificateId)
            .maybeSingle()
            .returns<CertificateFile>();

        if (error) {
            throw error;
        }

        return data ?? null;
    }

    async generateAndStoreCertificatePdf(certificateId: string): Promise<CertificateFile> {
        const [certificate, items] = await Promise.all([this.getCertificate(certificateId), this.listItems(certificateId)]);
        const { template, pdf: templatePdf } = await this.resolveTemplatePdfForCertificate(certificate);
        const effectiveCertificate = template.id === certificate.template_version_id ? certificate : { ...certificate, template_version_id: template.id };
        const bucket = 'generated-certificates';
        const fileName = `${this.sanitizeFileName(effectiveCertificate.certificate_number)}.pdf`;
        const storagePath = `${effectiveCertificate.id}/${fileName}`;
        const pdf = await this.buildCertificatePdf(effectiveCertificate, items, templatePdf);

        const { error: uploadError } = await this.supabase.storage.from(bucket).upload(storagePath, pdf, { contentType: 'application/pdf', upsert: true });

        if (uploadError) {
            throw uploadError;
        }

        if (template.id !== certificate.template_version_id) {
            const { error } = await this.supabase.from('certificates').update({ template_version_id: template.id }).eq('id', certificate.id);
            if (error) {
                throw error;
            }
        }

        const existing = await this.getCertificatePdf(effectiveCertificate.id);
        const payload = {
            certificate_id: effectiveCertificate.id,
            template_version_id: template.id,
            file_name: fileName,
            storage_bucket: bucket,
            storage_path: storagePath,
            version_number: 1,
            is_current: true,
            generated_by: this.auth.user()?.id ?? null,
            generated_at: new Date().toISOString()
        };

        if (existing) {
            const { error } = await this.supabase.from('certificate_files').update(payload).eq('id', existing.id);
            if (error) {
                throw error;
            }
        } else {
            const { error } = await this.supabase.from('certificate_files').insert(payload);
            if (error) {
                throw error;
            }
        }

        const generated = await this.getCertificatePdf(effectiveCertificate.id);
        if (!generated) {
            throw new Error('No se pudo registrar el PDF generado.');
        }

        return generated;
    }

    async createSignedUrl(bucket: string, storagePath: string): Promise<string> {
        const { data, error } = await this.supabase.storage.from(bucket).createSignedUrl(storagePath, 60 * 5);

        if (error) {
            throw error;
        }

        return data.signedUrl;
    }

    private async resolveTemplatePdfForCertificate(certificate: ManagedCertificate): Promise<{ template: CertificateTemplateForPdf; pdf: ArrayBuffer }> {
        const templates = await this.listTemplateVersionsForPdf(certificate.generation_type_id, certificate.template_version_id);
        let lastMissingPath: string | null = null;

        for (const template of templates) {
            const pdf = await this.tryDownloadTemplatePdf(template);
            if (pdf) {
                return { template, pdf };
            }

            lastMissingPath = `${template.storage_bucket}/${template.storage_path}`;
        }

        if (lastMissingPath) {
            throw new Error(`No se encontro ninguna plantilla PDF disponible en Storage. Ultima ruta revisada: ${lastMissingPath}`);
        }

        throw new Error('Este tipo de generacion no tiene una plantilla PDF activa.');
    }

    private async listTemplateVersionsForPdf(generationTypeId: string, preferredTemplateVersionId: string | null): Promise<CertificateTemplateForPdf[]> {
        const { data, error } = await this.supabase
            .from('certificate_template_versions')
            .select('id, certificate_generation_type_id, name, version_number, storage_bucket, storage_path, is_active')
            .eq('certificate_generation_type_id', generationTypeId)
            .order('is_active', { ascending: false })
            .order('version_number', { ascending: false })
            .returns<CertificateTemplateForPdf[]>();

        if (error) {
            throw error;
        }

        const templates = data ?? [];
        if (!preferredTemplateVersionId) {
            return templates;
        }

        return [...templates].sort((left, right) => {
            if (left.id === preferredTemplateVersionId) {
                return -1;
            }

            if (right.id === preferredTemplateVersionId) {
                return 1;
            }

            if (left.is_active !== right.is_active) {
                return left.is_active ? -1 : 1;
            }

            return right.version_number - left.version_number;
        });
    }

    private async tryDownloadTemplatePdf(template: CertificateTemplateForPdf): Promise<ArrayBuffer | null> {
        const { data, error } = await this.supabase.storage.from(template.storage_bucket).download(template.storage_path);

        if (!error && data) {
            return data.arrayBuffer();
        }

        if (this.isStorageObjectMissing(error)) {
            return null;
        }

        throw error;
    }

    private isStorageObjectMissing(error: unknown): boolean {
        if (!error || typeof error !== 'object') {
            return false;
        }

        const storageError = error as { statusCode?: string | number; status?: string | number; error?: string; message?: string };
        return storageError.statusCode === 404 || storageError.statusCode === '404' || storageError.status === 404 || storageError.status === '404' || storageError.error === 'not_found' || storageError.message === 'Object not found';
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
            .order('version_number', { ascending: false })
            .limit(1)
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

    private async buildCertificatePdf(certificate: ManagedCertificate, items: CertificateItem[], templatePdf: ArrayBuffer): Promise<Blob> {
        const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
        const pdfDoc = await PDFDocument.load(templatePdf);
        const page = pdfDoc.getPage(0);
        const { width, height } = page.getSize();
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const textColor = rgb(0.12, 0.16, 0.2);
        const blueColor = rgb(0.16, 0.5, 0.78);
        const borderColor = rgb(0.15, 0.15, 0.15);

        const y = (fromTop: number): number => height - fromTop;
        const drawText = (x: number, fromTop: number, value: string, size = 10, bold = false, color = textColor, normalize = true): void => {
            const font = bold ? boldFont : regularFont;
            const text = normalize ? this.normalizePdfText(value) : value;
            page.drawText(text, { x, y: y(fromTop), size, font, color });
        };
        const drawCenteredText = (fromTop: number, value: string, size = 12, bold = false, color = textColor): void => {
            const font = bold ? boldFont : regularFont;
            const text = this.normalizePdfText(value);
            const textWidth = font.widthOfTextAtSize(text, size);
            page.drawText(text, { x: Math.max(45, (width - textWidth) / 2), y: y(fromTop), size, font, color });
        };
        const drawLine = (x1: number, top1: number, x2: number, top2: number): void => {
            page.drawLine({ start: { x: x1, y: y(top1) }, end: { x: x2, y: y(top2) }, thickness: 0.7, color: borderColor });
        };
        const drawRect = (x: number, top: number, w: number, h: number): void => {
            page.drawRectangle({ x, y: y(top + h), width: w, height: h, borderColor, borderWidth: 0.7 });
        };
        const drawCellText = (x: number, top: number, w: number, value: string, maxLength: number, centered = false, bold = false): void => {
            const font = bold ? boldFont : regularFont;
            const text = this.truncatePdfText(value, maxLength);
            const size = 7.5;
            const textWidth = font.widthOfTextAtSize(text, size);
            const textX = centered ? x + Math.max(4, (w - textWidth) / 2) : x + 5;
            page.drawText(text, { x: textX, y: y(top + 15), size, font, color: textColor });
        };

        drawText(width - 150, 42, `N\u00ba ${this.normalizePdfText(certificate.certificate_number)}`, 14, true, blueColor, false);

        const title = (certificate.generation_type?.name || 'Certificado').toUpperCase();
        this.wrapPdfText(title, 54)
            .slice(0, 2)
            .forEach((line, index) => drawCenteredText(116 + index * 20, line, 15, true, rgb(0, 0, 0)));

        const legalDeclaration = certificate.generation_type?.description?.trim() ?? '';
        this.wrapPdfText(legalDeclaration, 88)
            .slice(0, 4)
            .forEach((line, index) => drawText(70, 190 + index * 17, line, 9.5));

        const tableLeft = 45;
        const tableTop = 315;
        const rowHeight = 24;
        const tableWidth = width - tableLeft * 2;
        const columns = [42, 82, tableWidth - 356, 70, 45, 55, 62];
        const headers = ['ITEM', 'NRO GRE', 'NOMBRE Y/O DESCRIPCION DEL RESIDUO', 'CANTIDAD', 'U.M.', 'PESO', 'CODIGO B'];

        const drawTableRow = (top: number, values: string[], isHeader = false): void => {
            drawRect(tableLeft, top, tableWidth, rowHeight);
            let columnX = tableLeft;

            columns.forEach((columnWidth, index) => {
                if (index > 0) {
                    drawLine(columnX, top, columnX, top + rowHeight);
                }
                const maxLength = index === 2 ? 42 : 16;
                drawCellText(columnX, top, columnWidth, values[index] ?? '', maxLength, index !== 2, isHeader || index === 0);
                columnX += columnWidth;
            });
        };

        drawTableRow(tableTop, headers, true);

        items.forEach((item, rowIndex) => {
            const values = [
                String(rowIndex + 1),
                certificate.guide_number,
                item.description || item.item?.name || '',
                item.quantity === null ? item.quantity_type?.name || '-' : this.formatPdfNumber(item.quantity),
                item.item?.unit_name || '-',
                item.weight === null ? '-' : this.formatPdfNumber(item.weight),
                item.item?.basel_code || '-'
            ];

            drawTableRow(tableTop + rowHeight * (rowIndex + 1), values);
        });

        const detailTop = tableTop + rowHeight * (items.length + 1) + 46;
        const detailLines = [
            ['Generador:', certificate.generator_company?.business_name || '-'],
            ['Ubicacion:', certificate.generator_address || '-'],
            ['Transportista:', certificate.transporter_company?.business_name || '-'],
            ['Fecha de ingreso:', this.formatPdfDate(certificate.operation_date)]
        ];

        if (certificate.generation_type?.show_final_destination_company) {
            detailLines.push(['Destino final:', certificate.final_destination_company?.business_name || '-']);
        }

        if (certificate.generation_type?.show_destination_place) {
            detailLines.push(['Lugar destino:', certificate.destination_place || '-']);
        }

        detailLines.forEach(([label, value], index) => {
            const top = detailTop + index * 24;
            drawText(70, top, label, 10.5, true);
            drawText(175, top, this.truncatePdfText(value, 70), 10.5);
        });

        if (certificate.observations) {
            drawText(70, detailTop + detailLines.length * 24 + 8, 'Observaciones:', 10.5, true);
            this.wrapPdfText(certificate.observations, 76)
                .slice(0, 3)
                .forEach((line, index) => drawText(175, detailTop + detailLines.length * 24 + 8 + index * 16, line, 9.5));
        }

        const pdfBytes = await pdfDoc.save();
        const pdfBuffer = new ArrayBuffer(pdfBytes.byteLength);
        new Uint8Array(pdfBuffer).set(pdfBytes);

        return new Blob([pdfBuffer], { type: 'application/pdf' });
    }

    private buildCertificatePdfLegacy(certificate: ManagedCertificate, items: CertificateItem[]): Blob {
        const width = 595.28;
        const height = 841.89;
        const content: string[] = [];

        const text = (x: number, y: number, value: string, size = 10, bold = false, color = '0 0 0'): void => {
            content.push(`${color} rg BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${this.escapePdfText(value)}) Tj ET`);
        };
        const line = (x1: number, y1: number, x2: number, y2: number): void => {
            content.push(`0 0 0 RG ${x1} ${y1} m ${x2} ${y2} l S`);
        };
        const rect = (x: number, y: number, w: number, h: number): void => {
            content.push(`0 0 0 RG ${x} ${y} ${w} ${h} re S`);
        };

        text(455, 795, `Nº ${certificate.certificate_number}`, 14, true, '0.16 0.50 0.78');
        text(85, 735, this.normalizePdfText(certificate.generation_type?.name || 'Certificado').toUpperCase(), 16, true);

        const intro =
            'Mediante el presente documento la empresa CABALLERO SOLUCIONES AMBIENTALES S.A.C. certifica haber realizado la valorizacion correspondiente dentro de su infraestructura autorizada a los siguientes residuos. Dando cumplimiento a la normativa legal vigente de nuestro pais.';
        this.wrapPdfText(intro, 80).forEach((lineText, index) => text(70, 690 - index * 18, lineText, 10));

        const tableTop = 590;
        const rowHeight = 24;
        const headers = ['ITEM', 'N° GRE', 'NOMBRE Y/O DESCRIPCION DEL RESIDUO', 'CANTIDAD', 'U.M.', 'PESO', 'CODIGO B'];
        const columns = [50, 75, 95, 210, 65, 45, 55];
        let x = 45;

        rect(45, tableTop, 550, rowHeight);
        headers.forEach((header, index) => {
            if (index > 0) {
                line(x, tableTop, x, tableTop + rowHeight);
            }
            text(x + 5, tableTop + 8, header, 8, true);
            x += columns[index];
        });

        items.forEach((item, rowIndex) => {
            const y = tableTop - rowHeight * (rowIndex + 1);
            const values = [
                String(rowIndex + 1),
                certificate.guide_number,
                this.normalizePdfText(item.description || item.item?.name || ''),
                item.quantity === null ? item.quantity_type?.name || '-' : this.formatPdfNumber(item.quantity),
                item.item?.unit_name || '-',
                item.weight === null ? '-' : this.formatPdfNumber(item.weight),
                item.item?.basel_code || '-'
            ];

            rect(45, y, 550, rowHeight);
            x = 45;
            values.forEach((value, index) => {
                if (index > 0) {
                    line(x, y, x, y + rowHeight);
                }
                text(x + 5, y + 8, this.truncatePdfText(value, index === 2 ? 42 : 14), 8, index === 0);
                x += columns[index];
            });
        });

        const detailY = Math.max(180, tableTop - rowHeight * (items.length + 2));
        text(70, detailY, 'Generador:', 11, true);
        text(175, detailY, certificate.generator_company?.business_name || '-', 11);
        text(70, detailY - 24, 'Ubicacion:', 11, true);
        text(175, detailY - 24, this.truncatePdfText(certificate.generator_address || '-', 60), 11);
        text(70, detailY - 48, 'Transportista:', 11, true);
        text(175, detailY - 48, certificate.transporter_company?.business_name || '-', 11);
        text(70, detailY - 72, 'Fecha de ingreso:', 11, true);
        text(175, detailY - 72, this.formatPdfDate(certificate.operation_date), 11);

        return this.createPdfBlob(content.join('\n'), width, height);
    }

    private createPdfBlob(stream: string, width: number, height: number): Blob {
        const encoder = new TextEncoder();
        const objects = [
            '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
            '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
            `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>\nendobj\n`,
            `4 0 obj\n<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}\nendstream\nendobj\n`,
            '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
            '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n'
        ];
        let pdf = '%PDF-1.4\n';
        const offsets = [0];

        for (const object of objects) {
            offsets.push(encoder.encode(pdf).length);
            pdf += object;
        }

        const xrefOffset = encoder.encode(pdf).length;
        pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
        for (let index = 1; index < offsets.length; index++) {
            pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
        }
        pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

        return new Blob([pdf], { type: 'application/pdf' });
    }

    private wrapPdfText(value: string, maxLength: number): string[] {
        const words = this.normalizePdfText(value).split(/\s+/);
        const lines: string[] = [];
        let current = '';

        for (const word of words) {
            const next = current ? `${current} ${word}` : word;
            if (next.length > maxLength) {
                lines.push(current);
                current = word;
            } else {
                current = next;
            }
        }

        if (current) {
            lines.push(current);
        }

        return lines;
    }

    private normalizePdfText(value: string): string {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\x20-\x7E]/g, '');
    }

    private escapePdfText(value: string): string {
        return this.normalizePdfText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    }

    private truncatePdfText(value: string, maxLength: number): string {
        const normalized = this.normalizePdfText(value);
        return normalized.length > maxLength ? `${normalized.slice(0, Math.max(0, maxLength - 3))}...` : normalized;
    }

    private formatPdfNumber(value: number): string {
        return Number(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
    }

    private formatPdfDate(value: string): string {
        const date = new Date(`${value}T00:00:00`);
        const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SETIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
        return `${String(date.getDate()).padStart(2, '0')} DE ${months[date.getMonth()]} DEL ${date.getFullYear()}`;
    }
}
