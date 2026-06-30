import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '@/app/core/supabase/supabase.client';

export type ItemStatus = 'active' | 'inactive';
type CatalogStatus = 'active' | 'inactive';

export interface ItemCatalogOption {
    id: string;
    name: string;
    status: CatalogStatus;
}

export interface UnitOption extends ItemCatalogOption {
    code: string;
    abbreviation: string | null;
}

export interface BaselCodeOption {
    id: string;
    code: string;
    description: string;
    status: CatalogStatus;
}

export interface ManagedItem {
    id: string;
    code: string;
    name: string;
    description: string | null;
    unit_id: string;
    category_id: string;
    item_type_id: string;
    basel_code_id: string | null;
    status: ItemStatus;
    created_at: string;
    updated_at: string;
    unit: UnitOption | null;
    category: ItemCatalogOption | null;
    item_type: ItemCatalogOption | null;
    basel_code: BaselCodeOption | null;
    certificate_items_count: number;
}

export interface ItemListFilters {
    search?: string | null;
    status?: ItemStatus | null;
    unitId?: string | null;
    categoryId?: string | null;
    itemTypeId?: string | null;
    baselCodeId?: string | null;
}

export interface ItemListParams {
    first: number;
    rows: number;
    sortField: string;
    sortOrder: 1 | -1;
    filters: ItemListFilters;
}

export interface ItemListResult {
    items: ManagedItem[];
    total: number;
}

export interface ItemFormOptions {
    units: UnitOption[];
    categories: ItemCatalogOption[];
    itemTypes: ItemCatalogOption[];
    baselCodes: BaselCodeOption[];
}

export interface SaveItemPayload {
    code: string;
    name: string;
    description: string | null;
    unit_id: string;
    category_id: string;
    item_type_id: string;
    basel_code_id: string | null;
    status: ItemStatus;
}

interface ItemRow {
    id: string;
    code: string;
    name: string;
    description: string | null;
    unit_id: string;
    category_id: string;
    item_type_id: string;
    basel_code_id: string | null;
    status: ItemStatus;
    created_at: string;
    updated_at: string;
    units: UnitOption | null;
    categories: ItemCatalogOption | null;
    item_types: ItemCatalogOption | null;
    basel_codes: BaselCodeOption | null;
}

@Injectable({ providedIn: 'root' })
export class ItemsService {
    private readonly supabase = inject(SupabaseClientService).client;
    private readonly sortableFields = new Set(['code', 'name', 'status', 'created_at', 'updated_at']);

    async listItems(params: ItemListParams): Promise<ItemListResult> {
        let query = this.supabase
            .from('items')
            .select(
                `
                id,
                code,
                name,
                description,
                unit_id,
                category_id,
                item_type_id,
                basel_code_id,
                status,
                created_at,
                updated_at,
                units(id, code, name, abbreviation, status),
                categories(id, name, status),
                item_types(id, name, status),
                basel_codes(id, code, description, status)
            `,
                { count: 'exact' }
            );

        const search = params.filters.search?.trim();
        if (search) {
            const pattern = `%${search.replaceAll('%', '\\%').replaceAll(',', '\\,')}%`;
            query = query.or(`code.ilike.${pattern},name.ilike.${pattern},description.ilike.${pattern}`);
        }

        if (params.filters.status) {
            query = query.eq('status', params.filters.status);
        }

        if (params.filters.unitId) {
            query = query.eq('unit_id', params.filters.unitId);
        }

        if (params.filters.categoryId) {
            query = query.eq('category_id', params.filters.categoryId);
        }

        if (params.filters.itemTypeId) {
            query = query.eq('item_type_id', params.filters.itemTypeId);
        }

        if (params.filters.baselCodeId) {
            query = query.eq('basel_code_id', params.filters.baselCodeId);
        }

        const sortField = this.sortableFields.has(params.sortField) ? params.sortField : 'created_at';
        query = query.order(sortField, { ascending: params.sortOrder === 1 }).range(params.first, params.first + params.rows - 1);

        const { data, error, count } = await query.returns<ItemRow[]>();

        if (error) {
            throw error;
        }

        const certificateItemCounts = await this.getCertificateItemCounts((data ?? []).map((item) => item.id));

        return {
            items: (data ?? []).map((row) => this.mapItem(row, certificateItemCounts.get(row.id) ?? 0)),
            total: count ?? 0
        };
    }

    async getItem(itemId: string): Promise<ManagedItem> {
        const { data, error } = await this.supabase
            .from('items')
            .select(
                `
                id,
                code,
                name,
                description,
                unit_id,
                category_id,
                item_type_id,
                basel_code_id,
                status,
                created_at,
                updated_at,
                units(id, code, name, abbreviation, status),
                categories(id, name, status),
                item_types(id, name, status),
                basel_codes(id, code, description, status)
            `
            )
            .eq('id', itemId)
            .single()
            .returns<ItemRow>();

        if (error) {
            throw error;
        }

        const certificateItemCounts = await this.getCertificateItemCounts([itemId]);
        return this.mapItem(data, certificateItemCounts.get(itemId) ?? 0);
    }

    async createItem(payload: SaveItemPayload): Promise<ManagedItem> {
        const { data, error } = await this.supabase
            .from('items')
            .insert(this.mapSavePayload(payload))
            .select('id')
            .single()
            .returns<{ id: string }>();

        if (error) {
            throw error;
        }

        return this.getItem(data.id);
    }

    async updateItem(itemId: string, payload: SaveItemPayload): Promise<ManagedItem> {
        const { error } = await this.supabase.from('items').update(this.mapSavePayload(payload)).eq('id', itemId);

        if (error) {
            throw error;
        }

        return this.getItem(itemId);
    }

    async updateStatus(itemId: string, status: ItemStatus): Promise<void> {
        const { error } = await this.supabase.from('items').update({ status }).eq('id', itemId);

        if (error) {
            throw error;
        }
    }

    async deleteItem(item: ManagedItem): Promise<void> {
        if (item.certificate_items_count > 0) {
            throw new Error('No se puede eliminar un item usado en certificados.');
        }

        const { error } = await this.supabase.from('items').delete().eq('id', item.id);

        if (error) {
            if ('code' in error && error.code === '23503') {
                throw new Error('No se puede eliminar un item usado en certificados.');
            }

            throw error;
        }
    }

    async getFormOptions(): Promise<ItemFormOptions> {
        const [units, categories, itemTypes, baselCodes] = await Promise.all([this.listUnits(), this.listCategories(), this.listItemTypes(), this.listBaselCodes()]);

        return { units, categories, itemTypes, baselCodes };
    }

    private async listUnits(): Promise<UnitOption[]> {
        const { data, error } = await this.supabase.from('units').select('id, code, name, abbreviation, status').eq('status', 'active').order('name', { ascending: true }).returns<UnitOption[]>();

        if (error) {
            throw error;
        }

        return data ?? [];
    }

    private async listCategories(): Promise<ItemCatalogOption[]> {
        const { data, error } = await this.supabase.from('categories').select('id, name, status').eq('status', 'active').order('name', { ascending: true }).returns<ItemCatalogOption[]>();

        if (error) {
            throw error;
        }

        return data ?? [];
    }

    private async listItemTypes(): Promise<ItemCatalogOption[]> {
        const { data, error } = await this.supabase.from('item_types').select('id, name, status').eq('status', 'active').order('name', { ascending: true }).returns<ItemCatalogOption[]>();

        if (error) {
            throw error;
        }

        return data ?? [];
    }

    private async listBaselCodes(): Promise<BaselCodeOption[]> {
        const { data, error } = await this.supabase.from('basel_codes').select('id, code, description, status').eq('status', 'active').order('code', { ascending: true }).returns<BaselCodeOption[]>();

        if (error) {
            throw error;
        }

        return data ?? [];
    }

    private async getCertificateItemCounts(itemIds: string[]): Promise<Map<string, number>> {
        const counts = new Map<string, number>();

        if (!itemIds.length) {
            return counts;
        }

        const { data, error } = await this.supabase.from('certificate_items').select('item_id').in('item_id', itemIds).returns<{ item_id: string }[]>();

        if (error) {
            return counts;
        }

        for (const row of data ?? []) {
            counts.set(row.item_id, (counts.get(row.item_id) ?? 0) + 1);
        }

        return counts;
    }

    private mapSavePayload(payload: SaveItemPayload): Omit<ItemRow, 'id' | 'created_at' | 'updated_at' | 'units' | 'categories' | 'item_types' | 'basel_codes'> {
        return {
            code: payload.code.trim(),
            name: payload.name.trim(),
            description: payload.description?.trim() || null,
            unit_id: payload.unit_id,
            category_id: payload.category_id,
            item_type_id: payload.item_type_id,
            basel_code_id: payload.basel_code_id || null,
            status: payload.status
        };
    }

    private mapItem(row: ItemRow, certificateItemsCount: number): ManagedItem {
        return {
            id: row.id,
            code: row.code,
            name: row.name,
            description: row.description,
            unit_id: row.unit_id,
            category_id: row.category_id,
            item_type_id: row.item_type_id,
            basel_code_id: row.basel_code_id,
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at,
            unit: row.units,
            category: row.categories,
            item_type: row.item_types,
            basel_code: row.basel_codes,
            certificate_items_count: certificateItemsCount
        };
    }
}
