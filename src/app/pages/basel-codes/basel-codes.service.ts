import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '@/app/core/supabase/supabase.client';

export type BaselCodeStatus = 'active' | 'inactive';

export interface ManagedBaselCode {
    id: string;
    code: string;
    description: string;
    status: BaselCodeStatus;
    created_at: string;
    updated_at: string;
    items_count: number;
}

export interface BaselCodeListFilters {
    search?: string | null;
    status?: BaselCodeStatus | null;
}

export interface BaselCodeListParams {
    first: number;
    rows: number;
    sortField: string;
    sortOrder: 1 | -1;
    filters: BaselCodeListFilters;
}

export interface BaselCodeListResult {
    baselCodes: ManagedBaselCode[];
    total: number;
}

export interface SaveBaselCodePayload {
    code: string;
    description: string;
    status: BaselCodeStatus;
}

interface BaselCodeRow {
    id: string;
    code: string;
    description: string;
    status: BaselCodeStatus;
    created_at: string;
    updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class BaselCodesService {
    private readonly supabase = inject(SupabaseClientService).client;
    private readonly sortableFields = new Set(['code', 'description', 'status', 'created_at', 'updated_at']);

    async listBaselCodes(params: BaselCodeListParams): Promise<BaselCodeListResult> {
        let query = this.supabase.from('basel_codes').select('id, code, description, status, created_at, updated_at', { count: 'exact' });

        const search = params.filters.search?.trim();
        if (search) {
            const pattern = `%${search.replaceAll('%', '\\%').replaceAll(',', '\\,')}%`;
            query = query.or(`code.ilike.${pattern},description.ilike.${pattern}`);
        }

        if (params.filters.status) {
            query = query.eq('status', params.filters.status);
        }

        const sortField = this.sortableFields.has(params.sortField) ? params.sortField : 'created_at';
        query = query.order(sortField, { ascending: params.sortOrder === 1 }).range(params.first, params.first + params.rows - 1);

        const { data, error, count } = await query.returns<BaselCodeRow[]>();

        if (error) {
            throw error;
        }

        const itemCounts = await this.getItemCounts((data ?? []).map((baselCode) => baselCode.id));

        return {
            baselCodes: (data ?? []).map((row) => this.mapBaselCode(row, itemCounts.get(row.id) ?? 0)),
            total: count ?? 0
        };
    }

    async getBaselCode(baselCodeId: string): Promise<ManagedBaselCode> {
        const { data, error } = await this.supabase.from('basel_codes').select('id, code, description, status, created_at, updated_at').eq('id', baselCodeId).single().returns<BaselCodeRow>();

        if (error) {
            throw error;
        }

        const itemCounts = await this.getItemCounts([baselCodeId]);
        return this.mapBaselCode(data, itemCounts.get(baselCodeId) ?? 0);
    }

    async createBaselCode(payload: SaveBaselCodePayload): Promise<ManagedBaselCode> {
        const { data, error } = await this.supabase
            .from('basel_codes')
            .insert({
                code: payload.code.trim(),
                description: payload.description.trim(),
                status: payload.status
            })
            .select('id')
            .single()
            .returns<{ id: string }>();

        if (error) {
            throw error;
        }

        return this.getBaselCode(data.id);
    }

    async updateBaselCode(baselCodeId: string, payload: SaveBaselCodePayload): Promise<ManagedBaselCode> {
        const { error } = await this.supabase
            .from('basel_codes')
            .update({
                code: payload.code.trim(),
                description: payload.description.trim(),
                status: payload.status
            })
            .eq('id', baselCodeId);

        if (error) {
            throw error;
        }

        return this.getBaselCode(baselCodeId);
    }

    async updateStatus(baselCodeId: string, status: BaselCodeStatus): Promise<void> {
        const { error } = await this.supabase.from('basel_codes').update({ status }).eq('id', baselCodeId);

        if (error) {
            throw error;
        }
    }

    async deleteBaselCode(baselCode: ManagedBaselCode): Promise<void> {
        if (baselCode.items_count > 0) {
            throw new Error('No se puede eliminar un codigo Basilea usado en items.');
        }

        const { error } = await this.supabase.from('basel_codes').delete().eq('id', baselCode.id);

        if (error) {
            if ('code' in error && error.code === '23503') {
                throw new Error('No se puede eliminar un codigo Basilea usado en items.');
            }

            throw error;
        }
    }

    private async getItemCounts(baselCodeIds: string[]): Promise<Map<string, number>> {
        const counts = new Map<string, number>();

        if (!baselCodeIds.length) {
            return counts;
        }

        const { data, error } = await this.supabase.from('items').select('basel_code_id').in('basel_code_id', baselCodeIds).returns<{ basel_code_id: string | null }[]>();

        if (error) {
            return counts;
        }

        for (const row of data ?? []) {
            if (row.basel_code_id) {
                counts.set(row.basel_code_id, (counts.get(row.basel_code_id) ?? 0) + 1);
            }
        }

        return counts;
    }

    private mapBaselCode(row: BaselCodeRow, itemsCount: number): ManagedBaselCode {
        return {
            id: row.id,
            code: row.code,
            description: row.description,
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at,
            items_count: itemsCount
        };
    }
}
