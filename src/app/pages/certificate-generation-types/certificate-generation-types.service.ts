import { Injectable, inject } from '@angular/core';
import { AuthService } from '@/app/core/auth/auth.service';
import { SupabaseClientService } from '@/app/core/supabase/supabase.client';

export type CertificateGenerationTypeStatus = 'active' | 'inactive';

export interface ManagedCertificateGenerationType {
    id: string;
    name: string;
    description: string | null;
    show_final_destination_company: boolean;
    show_destination_place: boolean;
    status: CertificateGenerationTypeStatus;
    created_at: string;
    updated_at: string;
    certificates_count: number;
    templates_count: number;
    active_template: CertificateTemplateVersion | null;
    template_versions: CertificateTemplateVersion[];
}

export interface CertificateTemplateVersion {
    id: string;
    certificate_generation_type_id: string;
    version_number: number;
    name: string;
    storage_bucket: string;
    storage_path: string;
    uploaded_by: string | null;
    active_from: string;
    active_to: string | null;
    is_active: boolean;
    is_locked: boolean;
    created_at: string;
    certificates_count: number;
}

export interface CertificateTemplatePdfUrl {
    url: string;
    template: CertificateTemplateVersion;
    usedFallback: boolean;
}

export interface CertificateGenerationTypeListFilters {
    search?: string | null;
    status?: CertificateGenerationTypeStatus | null;
    showFinalDestinationCompany?: boolean | null;
    showDestinationPlace?: boolean | null;
}

export interface CertificateGenerationTypeListParams {
    first: number;
    rows: number;
    sortField: string;
    sortOrder: 1 | -1;
    filters: CertificateGenerationTypeListFilters;
}

export interface CertificateGenerationTypeListResult {
    generationTypes: ManagedCertificateGenerationType[];
    total: number;
}

export interface SaveCertificateGenerationTypePayload {
    name: string;
    description: string | null;
    show_final_destination_company: boolean;
    show_destination_place: boolean;
    status: CertificateGenerationTypeStatus;
    template_file?: File | null;
}

interface CertificateGenerationTypeRow {
    id: string;
    name: string;
    description: string | null;
    show_final_destination_company: boolean;
    show_destination_place: boolean;
    status: CertificateGenerationTypeStatus;
    created_at: string;
    updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class CertificateGenerationTypesService {
    private readonly supabase = inject(SupabaseClientService).client;
    private readonly auth = inject(AuthService);
    private readonly sortableFields = new Set(['name', 'show_final_destination_company', 'show_destination_place', 'status', 'created_at', 'updated_at']);

    async listGenerationTypes(params: CertificateGenerationTypeListParams): Promise<CertificateGenerationTypeListResult> {
        let query = this.supabase.from('certificate_generation_types').select('id, name, description, show_final_destination_company, show_destination_place, status, created_at, updated_at', { count: 'exact' });

        const search = params.filters.search?.trim();
        if (search) {
            const pattern = `%${search.replaceAll('%', '\\%').replaceAll(',', '\\,')}%`;
            query = query.or(`name.ilike.${pattern},description.ilike.${pattern}`);
        }

        if (params.filters.status) {
            query = query.eq('status', params.filters.status);
        }

        if (params.filters.showFinalDestinationCompany !== null && params.filters.showFinalDestinationCompany !== undefined) {
            query = query.eq('show_final_destination_company', params.filters.showFinalDestinationCompany);
        }

        if (params.filters.showDestinationPlace !== null && params.filters.showDestinationPlace !== undefined) {
            query = query.eq('show_destination_place', params.filters.showDestinationPlace);
        }

        const sortField = this.sortableFields.has(params.sortField) ? params.sortField : 'created_at';
        query = query.order(sortField, { ascending: params.sortOrder === 1 }).range(params.first, params.first + params.rows - 1);

        const { data, error, count } = await query.returns<CertificateGenerationTypeRow[]>();

        if (error) {
            throw error;
        }

        const ids = (data ?? []).map((generationType) => generationType.id);
        const [certificateCounts, templateCounts] = await Promise.all([this.getCertificateCounts(ids), this.getTemplateCounts(ids)]);

        return {
            generationTypes: (data ?? []).map((row) => this.mapGenerationType(row, certificateCounts.get(row.id) ?? 0, templateCounts.get(row.id) ?? 0, null, [])),
            total: count ?? 0
        };
    }

    async getGenerationType(generationTypeId: string): Promise<ManagedCertificateGenerationType> {
        const { data, error } = await this.supabase
            .from('certificate_generation_types')
            .select('id, name, description, show_final_destination_company, show_destination_place, status, created_at, updated_at')
            .eq('id', generationTypeId)
            .single()
            .returns<CertificateGenerationTypeRow>();

        if (error) {
            throw error;
        }

        const [certificateCounts, templateVersions] = await Promise.all([this.getCertificateCounts([generationTypeId]), this.listTemplateVersions(generationTypeId)]);
        const activeTemplate = templateVersions.find((template) => template.is_active) ?? null;

        return this.mapGenerationType(data, certificateCounts.get(generationTypeId) ?? 0, templateVersions.length, activeTemplate, templateVersions);
    }

    async createGenerationType(payload: SaveCertificateGenerationTypePayload): Promise<ManagedCertificateGenerationType> {
        const { data, error } = await this.supabase
            .from('certificate_generation_types')
            .insert({
                name: payload.name.trim(),
                description: payload.description?.trim() || null,
                show_final_destination_company: payload.show_final_destination_company,
                show_destination_place: payload.show_destination_place,
                status: payload.status
            })
            .select('id')
            .single()
            .returns<{ id: string }>();

        if (error) {
            throw error;
        }

        if (payload.template_file) {
            await this.uploadTemplate(data.id, payload.name, payload.template_file);
        }

        return this.getGenerationType(data.id);
    }

    async updateGenerationType(generationTypeId: string, payload: SaveCertificateGenerationTypePayload): Promise<ManagedCertificateGenerationType> {
        const { error } = await this.supabase
            .from('certificate_generation_types')
            .update({
                name: payload.name.trim(),
                description: payload.description?.trim() || null,
                show_final_destination_company: payload.show_final_destination_company,
                show_destination_place: payload.show_destination_place,
                status: payload.status
            })
            .eq('id', generationTypeId);

        if (error) {
            throw error;
        }

        if (payload.template_file) {
            await this.uploadTemplate(generationTypeId, payload.name, payload.template_file);
        }

        return this.getGenerationType(generationTypeId);
    }

    async updateStatus(generationTypeId: string, status: CertificateGenerationTypeStatus): Promise<void> {
        const { error } = await this.supabase.from('certificate_generation_types').update({ status }).eq('id', generationTypeId);

        if (error) {
            throw error;
        }
    }

    async deleteGenerationType(generationType: ManagedCertificateGenerationType): Promise<void> {
        if (generationType.certificates_count > 0 || generationType.templates_count > 0) {
            throw new Error('No se puede eliminar un tipo de generacion usado en certificados o plantillas.');
        }

        const { error } = await this.supabase.from('certificate_generation_types').delete().eq('id', generationType.id);

        if (error) {
            if ('code' in error && error.code === '23503') {
                throw new Error('No se puede eliminar un tipo de generacion usado en certificados o plantillas.');
            }

            throw error;
        }
    }

    async createSignedUrl(bucket: string, storagePath: string): Promise<string> {
        const { data, error } = await this.supabase.storage.from(bucket).createSignedUrl(storagePath, 60 * 5);

        if (error) {
            throw error;
        }

        return data.signedUrl;
    }

    async createTemplatePdfUrl(generationTypeId: string, preferredTemplate: CertificateTemplateVersion | null): Promise<CertificateTemplatePdfUrl> {
        const templates = await this.listTemplateVersions(generationTypeId);
        const orderedTemplates = this.prioritizeTemplates(templates, preferredTemplate?.id ?? null);
        let lastMissingPath: string | null = null;

        for (const template of orderedTemplates) {
            const { data, error } = await this.supabase.storage.from(template.storage_bucket).download(template.storage_path);

            if (!error && data) {
                return {
                    url: URL.createObjectURL(data),
                    template,
                    usedFallback: !!preferredTemplate && template.id !== preferredTemplate.id
                };
            }

            lastMissingPath = `${template.storage_bucket}/${template.storage_path}`;
        }

        throw new Error(lastMissingPath ? `No se encontro el archivo en Storage: ${lastMissingPath}` : 'Este tipo no tiene plantillas registradas.');
    }

    private async uploadTemplate(generationTypeId: string, generationTypeName: string, file: File): Promise<void> {
        if (!this.isPdf(file)) {
            throw new Error('La plantilla debe ser un archivo PDF.');
        }

        const bucket = 'certificate-templates';
        const versionNumber = await this.getNextTemplateVersionNumber(generationTypeId);
        const storagePath = `${generationTypeId}/v${versionNumber}-${crypto.randomUUID()}-${this.sanitizeFileName(file.name)}`;

        const { error: uploadError } = await this.supabase.storage.from(bucket).upload(storagePath, file, { contentType: 'application/pdf', upsert: false });

        if (uploadError) {
            throw uploadError;
        }

        let insertedTemplateId: string | null = null;

        try {
            const { data, error } = await this.supabase
                .from('certificate_template_versions')
                .insert({
                    certificate_generation_type_id: generationTypeId,
                    version_number: versionNumber,
                    name: `Plantilla de certificado - ${generationTypeName.trim()}`,
                    storage_bucket: bucket,
                    storage_path: storagePath,
                    uploaded_by: this.auth.user()?.id ?? null,
                    is_active: false,
                    is_locked: true
                })
                .select('id')
                .single()
                .returns<{ id: string }>();

            if (error) {
                throw error;
            }

            insertedTemplateId = data.id;
            await this.deactivateActiveTemplates(generationTypeId);

            const { error: activateError } = await this.supabase.from('certificate_template_versions').update({ is_active: true, active_to: null }).eq('id', insertedTemplateId);

            if (activateError) {
                throw activateError;
            }
        } catch (error) {
            await this.supabase.storage.from(bucket).remove([storagePath]);
            if (insertedTemplateId) {
                await this.supabase.from('certificate_template_versions').delete().eq('id', insertedTemplateId);
            }
            throw error;
        }
    }

    private async deactivateActiveTemplates(generationTypeId: string): Promise<void> {
        const { error } = await this.supabase
            .from('certificate_template_versions')
            .update({ is_active: false, active_to: new Date().toISOString() })
            .eq('certificate_generation_type_id', generationTypeId)
            .eq('is_active', true);

        if (error) {
            throw error;
        }
    }

    private async getNextTemplateVersionNumber(generationTypeId: string): Promise<number> {
        const { data, error } = await this.supabase
            .from('certificate_template_versions')
            .select('version_number')
            .eq('certificate_generation_type_id', generationTypeId)
            .order('version_number', { ascending: false })
            .limit(1)
            .maybeSingle()
            .returns<{ version_number: number }>();

        if (error) {
            throw error;
        }

        return (data?.version_number ?? 0) + 1;
    }

    private async getActiveTemplate(generationTypeId: string): Promise<CertificateTemplateVersion | null> {
        const { data, error } = await this.supabase
            .from('certificate_template_versions')
            .select('id, certificate_generation_type_id, version_number, name, storage_bucket, storage_path, uploaded_by, active_from, active_to, is_active, is_locked, created_at')
            .eq('certificate_generation_type_id', generationTypeId)
            .eq('is_active', true)
            .maybeSingle()
            .returns<CertificateTemplateVersion>();

        if (error) {
            throw error;
        }

        return data ?? null;
    }

    private async listTemplateVersions(generationTypeId: string): Promise<CertificateTemplateVersion[]> {
        const { data, error } = await this.supabase
            .from('certificate_template_versions')
            .select('id, certificate_generation_type_id, version_number, name, storage_bucket, storage_path, uploaded_by, active_from, active_to, is_active, is_locked, created_at')
            .eq('certificate_generation_type_id', generationTypeId)
            .order('is_active', { ascending: false })
            .order('version_number', { ascending: false })
            .returns<CertificateTemplateVersion[]>();

        if (error) {
            throw error;
        }

        const templates = data ?? [];
        const certificateCounts = await this.getCertificateCountsByTemplate(templates.map((template) => template.id));

        return templates.map((template) => ({
            ...template,
            certificates_count: certificateCounts.get(template.id) ?? 0
        }));
    }

    private async getCertificateCounts(generationTypeIds: string[]): Promise<Map<string, number>> {
        const counts = new Map<string, number>();

        if (!generationTypeIds.length) {
            return counts;
        }

        const { data, error } = await this.supabase.from('certificates').select('generation_type_id').in('generation_type_id', generationTypeIds).returns<{ generation_type_id: string }[]>();

        if (error) {
            return counts;
        }

        for (const row of data ?? []) {
            counts.set(row.generation_type_id, (counts.get(row.generation_type_id) ?? 0) + 1);
        }

        return counts;
    }

    private async getTemplateCounts(generationTypeIds: string[]): Promise<Map<string, number>> {
        const counts = new Map<string, number>();

        if (!generationTypeIds.length) {
            return counts;
        }

        const { data, error } = await this.supabase.from('certificate_template_versions').select('certificate_generation_type_id').in('certificate_generation_type_id', generationTypeIds).returns<{ certificate_generation_type_id: string }[]>();

        if (error) {
            return counts;
        }

        for (const row of data ?? []) {
            counts.set(row.certificate_generation_type_id, (counts.get(row.certificate_generation_type_id) ?? 0) + 1);
        }

        return counts;
    }

    private async getCertificateCountsByTemplate(templateVersionIds: string[]): Promise<Map<string, number>> {
        const counts = new Map<string, number>();

        if (!templateVersionIds.length) {
            return counts;
        }

        const { data, error } = await this.supabase.from('certificates').select('template_version_id').in('template_version_id', templateVersionIds).returns<{ template_version_id: string | null }[]>();

        if (error) {
            return counts;
        }

        for (const row of data ?? []) {
            if (row.template_version_id) {
                counts.set(row.template_version_id, (counts.get(row.template_version_id) ?? 0) + 1);
            }
        }

        return counts;
    }

    private mapGenerationType(row: CertificateGenerationTypeRow, certificatesCount: number, templatesCount: number, activeTemplate: CertificateTemplateVersion | null, templateVersions: CertificateTemplateVersion[]): ManagedCertificateGenerationType {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            show_final_destination_company: row.show_final_destination_company,
            show_destination_place: row.show_destination_place,
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at,
            certificates_count: certificatesCount,
            templates_count: templatesCount,
            active_template: activeTemplate,
            template_versions: templateVersions
        };
    }

    private prioritizeTemplates(templates: CertificateTemplateVersion[], preferredTemplateId: string | null): CertificateTemplateVersion[] {
        if (!preferredTemplateId) {
            return templates;
        }

        return [...templates].sort((left, right) => {
            if (left.id === preferredTemplateId) {
                return -1;
            }

            if (right.id === preferredTemplateId) {
                return 1;
            }

            if (left.is_active !== right.is_active) {
                return left.is_active ? -1 : 1;
            }

            return right.version_number - left.version_number;
        });
    }

    private isPdf(file: File): boolean {
        return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
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
