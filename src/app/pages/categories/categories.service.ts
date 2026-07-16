import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '@/app/core/supabase/supabase.client';

export type CategoryStatus = 'active' | 'inactive';

export interface ManagedCategory {
    id: string;
    name: string;
    description: string | null;
    status: CategoryStatus;
    created_at: string;
    updated_at: string;
    items_count: number;
}

export interface CategoryListFilters {
    search?: string | null;
    status?: CategoryStatus | null;
}

export interface CategoryListParams {
    first: number;
    rows: number;
    sortField: string;
    sortOrder: 1 | -1;
    filters: CategoryListFilters;
}

export interface CategoryListResult {
    categories: ManagedCategory[];
    total: number;
}

export interface SaveCategoryPayload {
    name: string;
    description: string | null;
    status: CategoryStatus;
}

interface CategoryRow {
    id: string;
    name: string;
    description: string | null;
    status: CategoryStatus;
    created_at: string;
    updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class CategoriesService {
    private readonly supabase = inject(SupabaseClientService).client;
    private readonly sortableFields = new Set(['name', 'description', 'status', 'created_at', 'updated_at']);

    async listCategories(params: CategoryListParams): Promise<CategoryListResult> {
        let query = this.supabase.from('categories').select('id, name, description, status, created_at, updated_at', { count: 'exact' });

        const search = params.filters.search?.trim();

        if (search) {
            const pattern = `%${search.replaceAll('%', '\\%').replaceAll(',', '\\,')}%`;

            query = query.or(`name.ilike.${pattern},description.ilike.${pattern}`);
        }

        if (params.filters.status) {
            query = query.eq('status', params.filters.status);
        }

        const sortField = this.sortableFields.has(params.sortField) ? params.sortField : 'created_at';

        query = query.order(sortField, { ascending: params.sortOrder === 1 }).range(params.first, params.first + params.rows - 1);

        const { data, error, count } = await query.returns<CategoryRow[]>();

        if (error) {
            throw error;
        }

        const itemCounts = await this.getItemCounts((data ?? []).map((category) => category.id));

        return {
            categories: (data ?? []).map((row) => this.mapCategory(row, itemCounts.get(row.id) ?? 0)),
            total: count ?? 0
        };
    }

    async getCategory(categoryId: string): Promise<ManagedCategory> {
        const { data, error } = await this.supabase.from('categories').select('id, name, description, status, created_at, updated_at').eq('id', categoryId).single().returns<CategoryRow>();

        if (error) {
            throw error;
        }

        const itemCounts = await this.getItemCounts([categoryId]);

        return this.mapCategory(data, itemCounts.get(categoryId) ?? 0);
    }

    async createCategory(payload: SaveCategoryPayload): Promise<ManagedCategory> {
        const { data, error } = await this.supabase
            .from('categories')
            .insert({
                name: payload.name.trim(),
                description: payload.description?.trim() || null,
                status: payload.status
            })
            .select('id')
            .single()
            .returns<{ id: string }>();

        if (error) {
            throw error;
        }

        return this.getCategory(data.id);
    }

    async updateCategory(categoryId: string, payload: SaveCategoryPayload): Promise<ManagedCategory> {
        const { error } = await this.supabase
            .from('categories')
            .update({
                name: payload.name.trim(),
                description: payload.description?.trim() || null,
                status: payload.status
            })
            .eq('id', categoryId);

        if (error) {
            throw error;
        }

        return this.getCategory(categoryId);
    }

    async updateStatus(categoryId: string, status: CategoryStatus): Promise<void> {
        const { error } = await this.supabase.from('categories').update({ status }).eq('id', categoryId);

        if (error) {
            throw error;
        }
    }

    async deleteCategory(category: ManagedCategory): Promise<void> {
        if (category.items_count > 0) {
            throw new Error('No se puede eliminar una categoria usada en items.');
        }

        const { error } = await this.supabase.from('categories').delete().eq('id', category.id);

        if (error) {
            if ('code' in error && error.code === '23503') {
                throw new Error('No se puede eliminar una categoria usada en items.');
            }

            throw error;
        }
    }

    private async getItemCounts(categoryIds: string[]): Promise<Map<string, number>> {
        const counts = new Map<string, number>();

        if (!categoryIds.length) {
            return counts;
        }

        const { data, error } = await this.supabase.from('items').select('category_id').in('category_id', categoryIds).returns<{ category_id: string }[]>();

        if (error) {
            return counts;
        }

        for (const row of data ?? []) {
            counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
        }

        return counts;
    }

    private mapCategory(row: CategoryRow, itemsCount: number): ManagedCategory {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at,
            items_count: itemsCount
        };
    }
}
