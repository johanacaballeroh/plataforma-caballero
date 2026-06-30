import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '@/app/core/supabase/supabase.client';

export type UnitStatus = 'active' | 'inactive';

export interface ManagedUnit {
    id: string;
    code: string;
    name: string;
    abbreviation: string | null;
    status: UnitStatus;
    created_at: string;
    updated_at: string;
    items_count: number;
}

export interface UnitListFilters {
    search?: string | null;
    status?: UnitStatus | null;
}

export interface UnitListParams {
    first: number;
    rows: number;
    sortField: string;
    sortOrder: 1 | -1;
    filters: UnitListFilters;
}

export interface UnitListResult {
    units: ManagedUnit[];
    total: number;
}

export interface SaveUnitPayload {
    code: string;
    name: string;
    abbreviation: string | null;
    status: UnitStatus;
}

interface UnitRow {
    id: string;
    code: string;
    name: string;
    abbreviation: string | null;
    status: UnitStatus;
    created_at: string;
    updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class UnitsService {
    private readonly supabase = inject(SupabaseClientService).client;
    private readonly sortableFields = new Set(['code', 'name', 'abbreviation', 'status', 'created_at', 'updated_at']);

    async listUnits(params: UnitListParams): Promise<UnitListResult> {
        let query = this.supabase.from('units').select('id, code, name, abbreviation, status, created_at, updated_at', { count: 'exact' });

        const search = params.filters.search?.trim();
        if (search) {
            const pattern = `%${search.replaceAll('%', '\\%').replaceAll(',', '\\,')}%`;
            query = query.or(`code.ilike.${pattern},name.ilike.${pattern},abbreviation.ilike.${pattern}`);
        }

        if (params.filters.status) {
            query = query.eq('status', params.filters.status);
        }

        const sortField = this.sortableFields.has(params.sortField) ? params.sortField : 'created_at';
        query = query.order(sortField, { ascending: params.sortOrder === 1 }).range(params.first, params.first + params.rows - 1);

        const { data, error, count } = await query.returns<UnitRow[]>();

        if (error) {
            throw error;
        }

        const itemCounts = await this.getItemCounts((data ?? []).map((unit) => unit.id));

        return {
            units: (data ?? []).map((row) => this.mapUnit(row, itemCounts.get(row.id) ?? 0)),
            total: count ?? 0
        };
    }

    async getUnit(unitId: string): Promise<ManagedUnit> {
        const { data, error } = await this.supabase.from('units').select('id, code, name, abbreviation, status, created_at, updated_at').eq('id', unitId).single().returns<UnitRow>();

        if (error) {
            throw error;
        }

        const itemCounts = await this.getItemCounts([unitId]);
        return this.mapUnit(data, itemCounts.get(unitId) ?? 0);
    }

    async createUnit(payload: SaveUnitPayload): Promise<ManagedUnit> {
        const { data, error } = await this.supabase
            .from('units')
            .insert({
                code: payload.code.trim(),
                name: payload.name.trim(),
                abbreviation: payload.abbreviation?.trim() || null,
                status: payload.status
            })
            .select('id')
            .single()
            .returns<{ id: string }>();

        if (error) {
            throw error;
        }

        return this.getUnit(data.id);
    }

    async updateUnit(unitId: string, payload: SaveUnitPayload): Promise<ManagedUnit> {
        const { error } = await this.supabase
            .from('units')
            .update({
                code: payload.code.trim(),
                name: payload.name.trim(),
                abbreviation: payload.abbreviation?.trim() || null,
                status: payload.status
            })
            .eq('id', unitId);

        if (error) {
            throw error;
        }

        return this.getUnit(unitId);
    }

    async updateStatus(unitId: string, status: UnitStatus): Promise<void> {
        const { error } = await this.supabase.from('units').update({ status }).eq('id', unitId);

        if (error) {
            throw error;
        }
    }

    async deleteUnit(unit: ManagedUnit): Promise<void> {
        if (unit.items_count > 0) {
            throw new Error('No se puede eliminar una unidad usada en items.');
        }

        const { error } = await this.supabase.from('units').delete().eq('id', unit.id);

        if (error) {
            if ('code' in error && error.code === '23503') {
                throw new Error('No se puede eliminar una unidad usada en items.');
            }

            throw error;
        }
    }

    private async getItemCounts(unitIds: string[]): Promise<Map<string, number>> {
        const counts = new Map<string, number>();

        if (!unitIds.length) {
            return counts;
        }

        const { data, error } = await this.supabase.from('items').select('unit_id').in('unit_id', unitIds).returns<{ unit_id: string }[]>();

        if (error) {
            return counts;
        }

        for (const row of data ?? []) {
            counts.set(row.unit_id, (counts.get(row.unit_id) ?? 0) + 1);
        }

        return counts;
    }

    private mapUnit(row: UnitRow, itemsCount: number): ManagedUnit {
        return {
            id: row.id,
            code: row.code,
            name: row.name,
            abbreviation: row.abbreviation,
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at,
            items_count: itemsCount
        };
    }
}
