import { Injectable, inject } from '@angular/core';
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
            generationTypes: (data ?? []).map((row) => this.mapGenerationType(row, certificateCounts.get(row.id) ?? 0, templateCounts.get(row.id) ?? 0)),
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

        const [certificateCounts, templateCounts] = await Promise.all([this.getCertificateCounts([generationTypeId]), this.getTemplateCounts([generationTypeId])]);

        return this.mapGenerationType(data, certificateCounts.get(generationTypeId) ?? 0, templateCounts.get(generationTypeId) ?? 0);
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

    private mapGenerationType(row: CertificateGenerationTypeRow, certificatesCount: number, templatesCount: number): ManagedCertificateGenerationType {
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
            templates_count: templatesCount
        };
    }
}
