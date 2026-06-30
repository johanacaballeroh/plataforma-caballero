import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '@/app/core/supabase/supabase.client';

export type DocumentTypeStatus = 'active' | 'inactive';

export interface ManagedDocumentType {
    id: string;
    name: string;
    status: DocumentTypeStatus;
    created_at: string;
    updated_at: string;
    documents_count: number;
}

export interface DocumentTypeListFilters {
    search?: string | null;
    status?: DocumentTypeStatus | null;
}

export interface DocumentTypeListParams {
    first: number;
    rows: number;
    sortField: string;
    sortOrder: 1 | -1;
    filters: DocumentTypeListFilters;
}

export interface DocumentTypeListResult {
    documentTypes: ManagedDocumentType[];
    total: number;
}

export interface SaveDocumentTypePayload {
    name: string;
    status: DocumentTypeStatus;
}

interface DocumentTypeRow {
    id: string;
    name: string;
    status: DocumentTypeStatus;
    created_at: string;
    updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentTypesService {
    private readonly supabase = inject(SupabaseClientService).client;
    private readonly sortableFields = new Set(['name', 'status', 'created_at', 'updated_at']);

    async listDocumentTypes(params: DocumentTypeListParams): Promise<DocumentTypeListResult> {
        let query = this.supabase.from('document_types').select('id, name, status, created_at, updated_at', { count: 'exact' });

        const search = params.filters.search?.trim();
        if (search) {
            const pattern = `%${search.replaceAll('%', '\\%').replaceAll(',', '\\,')}%`;
            query = query.ilike('name', pattern);
        }

        if (params.filters.status) {
            query = query.eq('status', params.filters.status);
        }

        const sortField = this.sortableFields.has(params.sortField) ? params.sortField : 'created_at';
        query = query.order(sortField, { ascending: params.sortOrder === 1 }).range(params.first, params.first + params.rows - 1);

        const { data, error, count } = await query.returns<DocumentTypeRow[]>();

        if (error) {
            throw error;
        }

        const documentCounts = await this.getDocumentCounts((data ?? []).map((documentType) => documentType.id));

        return {
            documentTypes: (data ?? []).map((row) => this.mapDocumentType(row, documentCounts.get(row.id) ?? 0)),
            total: count ?? 0
        };
    }

    async getDocumentType(documentTypeId: string): Promise<ManagedDocumentType> {
        const { data, error } = await this.supabase.from('document_types').select('id, name, status, created_at, updated_at').eq('id', documentTypeId).single().returns<DocumentTypeRow>();

        if (error) {
            throw error;
        }

        const documentCounts = await this.getDocumentCounts([documentTypeId]);
        return this.mapDocumentType(data, documentCounts.get(documentTypeId) ?? 0);
    }

    async createDocumentType(payload: SaveDocumentTypePayload): Promise<ManagedDocumentType> {
        const { data, error } = await this.supabase
            .from('document_types')
            .insert({
                name: payload.name.trim(),
                status: payload.status
            })
            .select('id')
            .single()
            .returns<{ id: string }>();

        if (error) {
            throw error;
        }

        return this.getDocumentType(data.id);
    }

    async updateDocumentType(documentTypeId: string, payload: SaveDocumentTypePayload): Promise<ManagedDocumentType> {
        const { error } = await this.supabase
            .from('document_types')
            .update({
                name: payload.name.trim(),
                status: payload.status
            })
            .eq('id', documentTypeId);

        if (error) {
            throw error;
        }

        return this.getDocumentType(documentTypeId);
    }

    async updateStatus(documentTypeId: string, status: DocumentTypeStatus): Promise<void> {
        const { error } = await this.supabase.from('document_types').update({ status }).eq('id', documentTypeId);

        if (error) {
            throw error;
        }
    }

    async deleteDocumentType(documentType: ManagedDocumentType): Promise<void> {
        if (documentType.documents_count > 0) {
            throw new Error('No se puede eliminar un tipo de documento usado en certificados.');
        }

        const { error } = await this.supabase.from('document_types').delete().eq('id', documentType.id);

        if (error) {
            if ('code' in error && error.code === '23503') {
                throw new Error('No se puede eliminar un tipo de documento usado en certificados.');
            }

            throw error;
        }
    }

    private async getDocumentCounts(documentTypeIds: string[]): Promise<Map<string, number>> {
        const counts = new Map<string, number>();

        if (!documentTypeIds.length) {
            return counts;
        }

        const { data, error } = await this.supabase.from('certificate_documents').select('document_type_id').in('document_type_id', documentTypeIds).returns<{ document_type_id: string }[]>();

        if (error) {
            return counts;
        }

        for (const row of data ?? []) {
            counts.set(row.document_type_id, (counts.get(row.document_type_id) ?? 0) + 1);
        }

        return counts;
    }

    private mapDocumentType(row: DocumentTypeRow, documentsCount: number): ManagedDocumentType {
        return {
            id: row.id,
            name: row.name,
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at,
            documents_count: documentsCount
        };
    }
}
