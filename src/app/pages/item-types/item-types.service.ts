import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '@/app/core/supabase/supabase.client';

export type ItemTypeStatus = 'active' | 'inactive';

export interface ManagedItemType {
    id: string;
    name: string;
    status: ItemTypeStatus;
    created_at: string;
    updated_at: string;
    items_count: number;
}

export interface ItemTypeListFilters {
    search?: string | null;
    status?: ItemTypeStatus | null;
}

export interface ItemTypeListParams {
    first: number;
    rows: number;
    sortField: string;
    sortOrder: 1 | -1;
    filters: ItemTypeListFilters;
}

export interface ItemTypeListResult {
    itemTypes: ManagedItemType[];
    total: number;
}

export interface SaveItemTypePayload {
    name: string;
    status: ItemTypeStatus;
}

interface ItemTypeRow {
    id: string;
    name: string;
    status: ItemTypeStatus;
    created_at: string;
    updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class ItemTypesService {
    private readonly supabase = inject(SupabaseClientService).client;
    private readonly sortableFields = new Set(['name', 'status', 'created_at', 'updated_at']);

    async listItemTypes(params: ItemTypeListParams): Promise<ItemTypeListResult> {
        let query = this.supabase.from('item_types').select('id, name, status, created_at, updated_at', { count: 'exact' });

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

        const { data, error, count } = await query.returns<ItemTypeRow[]>();

        if (error) {
            throw error;
        }

        const itemCounts = await this.getItemCounts((data ?? []).map((itemType) => itemType.id));

        return {
            itemTypes: (data ?? []).map((row) => this.mapItemType(row, itemCounts.get(row.id) ?? 0)),
            total: count ?? 0
        };
    }

    async getItemType(itemTypeId: string): Promise<ManagedItemType> {
        const { data, error } = await this.supabase.from('item_types').select('id, name, status, created_at, updated_at').eq('id', itemTypeId).single().returns<ItemTypeRow>();

        if (error) {
            throw error;
        }

        const itemCounts = await this.getItemCounts([itemTypeId]);

        return this.mapItemType(data, itemCounts.get(itemTypeId) ?? 0);
    }

    async createItemType(payload: SaveItemTypePayload): Promise<ManagedItemType> {
        const { data, error } = await this.supabase
            .from('item_types')
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

        return this.getItemType(data.id);
    }

    async updateItemType(itemTypeId: string, payload: SaveItemTypePayload): Promise<ManagedItemType> {
        const { error } = await this.supabase
            .from('item_types')
            .update({
                name: payload.name.trim(),
                status: payload.status
            })
            .eq('id', itemTypeId);

        if (error) {
            throw error;
        }

        return this.getItemType(itemTypeId);
    }

    async updateStatus(itemTypeId: string, status: ItemTypeStatus): Promise<void> {
        const { error } = await this.supabase.from('item_types').update({ status }).eq('id', itemTypeId);

        if (error) {
            throw error;
        }
    }

    async deleteItemType(itemType: ManagedItemType): Promise<void> {
        if (itemType.items_count > 0) {
            throw new Error('No se puede eliminar un tipo de item usado en items.');
        }

        const { error } = await this.supabase.from('item_types').delete().eq('id', itemType.id);

        if (error) {
            if ('code' in error && error.code === '23503') {
                throw new Error('No se puede eliminar un tipo de item usado en items.');
            }

            throw error;
        }
    }

    private async getItemCounts(itemTypeIds: string[]): Promise<Map<string, number>> {
        const counts = new Map<string, number>();

        if (!itemTypeIds.length) {
            return counts;
        }

        const { data, error } = await this.supabase.from('items').select('item_type_id').in('item_type_id', itemTypeIds).returns<{ item_type_id: string }[]>();

        if (error) {
            return counts;
        }

        for (const row of data ?? []) {
            counts.set(row.item_type_id, (counts.get(row.item_type_id) ?? 0) + 1);
        }

        return counts;
    }

    private mapItemType(row: ItemTypeRow, itemsCount: number): ManagedItemType {
        return {
            id: row.id,
            name: row.name,
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at,
            items_count: itemsCount
        };
    }
}
