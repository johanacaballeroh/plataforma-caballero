import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '@/app/core/supabase/supabase.client';

export type QuantityTypeStatus = 'active' | 'inactive';

export interface ManagedQuantityType {
    id: string;
    name: string;
    show_value: boolean;
    status: QuantityTypeStatus;
    created_at: string;
    updated_at: string;
    certificate_items_count: number;
}

export interface QuantityTypeListFilters {
    search?: string | null;
    status?: QuantityTypeStatus | null;
    showValue?: boolean | null;
}

export interface QuantityTypeListParams {
    first: number;
    rows: number;
    sortField: string;
    sortOrder: 1 | -1;
    filters: QuantityTypeListFilters;
}

export interface QuantityTypeListResult {
    quantityTypes: ManagedQuantityType[];
    total: number;
}

export interface SaveQuantityTypePayload {
    name: string;
    show_value: boolean;
    status: QuantityTypeStatus;
}

interface QuantityTypeRow {
    id: string;
    name: string;
    show_value: boolean;
    status: QuantityTypeStatus;
    created_at: string;
    updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class QuantityTypesService {
    private readonly supabase = inject(SupabaseClientService).client;
    private readonly sortableFields = new Set(['name', 'show_value', 'status', 'created_at', 'updated_at']);

    async listQuantityTypes(params: QuantityTypeListParams): Promise<QuantityTypeListResult> {
        let query = this.supabase.from('quantity_types').select('id, name, show_value, status, created_at, updated_at', { count: 'exact' });

        const search = params.filters.search?.trim();

        if (search) {
            const pattern = `%${search.replaceAll('%', '\\%').replaceAll(',', '\\,')}%`;

            query = query.ilike('name', pattern);
        }

        if (params.filters.status) {
            query = query.eq('status', params.filters.status);
        }

        if (params.filters.showValue !== null && params.filters.showValue !== undefined) {
            query = query.eq('show_value', params.filters.showValue);
        }

        const sortField = this.sortableFields.has(params.sortField) ? params.sortField : 'created_at';

        query = query.order(sortField, { ascending: params.sortOrder === 1 }).range(params.first, params.first + params.rows - 1);

        const { data, error, count } = await query.returns<QuantityTypeRow[]>();

        if (error) {
            throw error;
        }

        const itemCounts = await this.getCertificateItemCounts((data ?? []).map((quantityType) => quantityType.id));

        return {
            quantityTypes: (data ?? []).map((row) => this.mapQuantityType(row, itemCounts.get(row.id) ?? 0)),
            total: count ?? 0
        };
    }

    async getQuantityType(quantityTypeId: string): Promise<ManagedQuantityType> {
        const { data, error } = await this.supabase.from('quantity_types').select('id, name, show_value, status, created_at, updated_at').eq('id', quantityTypeId).single().returns<QuantityTypeRow>();

        if (error) {
            throw error;
        }

        const itemCounts = await this.getCertificateItemCounts([quantityTypeId]);

        return this.mapQuantityType(data, itemCounts.get(quantityTypeId) ?? 0);
    }

    async createQuantityType(payload: SaveQuantityTypePayload): Promise<ManagedQuantityType> {
        const { data, error } = await this.supabase
            .from('quantity_types')
            .insert({
                name: payload.name.trim(),
                show_value: payload.show_value,
                status: payload.status
            })
            .select('id')
            .single()
            .returns<{ id: string }>();

        if (error) {
            throw error;
        }

        return this.getQuantityType(data.id);
    }

    async updateQuantityType(quantityTypeId: string, payload: SaveQuantityTypePayload): Promise<ManagedQuantityType> {
        const { error } = await this.supabase
            .from('quantity_types')
            .update({
                name: payload.name.trim(),
                show_value: payload.show_value,
                status: payload.status
            })
            .eq('id', quantityTypeId);

        if (error) {
            throw error;
        }

        return this.getQuantityType(quantityTypeId);
    }

    async updateStatus(quantityTypeId: string, status: QuantityTypeStatus): Promise<void> {
        const { error } = await this.supabase.from('quantity_types').update({ status }).eq('id', quantityTypeId);

        if (error) {
            throw error;
        }
    }

    async deleteQuantityType(quantityType: ManagedQuantityType): Promise<void> {
        if (quantityType.certificate_items_count > 0) {
            throw new Error('No se puede eliminar un tipo de cantidad usado en certificados.');
        }

        const { error } = await this.supabase.from('quantity_types').delete().eq('id', quantityType.id);

        if (error) {
            if ('code' in error && error.code === '23503') {
                throw new Error('No se puede eliminar un tipo de cantidad usado en certificados.');
            }

            throw error;
        }
    }

    private async getCertificateItemCounts(quantityTypeIds: string[]): Promise<Map<string, number>> {
        const counts = new Map<string, number>();

        if (!quantityTypeIds.length) {
            return counts;
        }

        const { data, error } = await this.supabase.from('certificate_items').select('quantity_type_id').in('quantity_type_id', quantityTypeIds).returns<{ quantity_type_id: string | null }[]>();

        if (error) {
            return counts;
        }

        for (const row of data ?? []) {
            if (row.quantity_type_id) {
                counts.set(row.quantity_type_id, (counts.get(row.quantity_type_id) ?? 0) + 1);
            }
        }

        return counts;
    }

    private mapQuantityType(row: QuantityTypeRow, certificateItemsCount: number): ManagedQuantityType {
        return {
            id: row.id,
            name: row.name,
            show_value: row.show_value,
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at,
            certificate_items_count: certificateItemsCount
        };
    }
}
