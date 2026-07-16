import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '@/app/core/supabase/supabase.client';

export type AuditAction = 'insert' | 'update' | 'delete';
export type AuditData = Record<string, unknown>;

export interface AuditUserOption {
    id: string;
    full_name: string;
    email: string;
}

export interface AuditLog {
    id: string;
    user_id: string | null;
    action: AuditAction;
    table_name: string;
    record_id: string | null;
    old_data: AuditData | null;
    new_data: AuditData | null;
    created_at: string;
    user: {
        full_name: string | null;
        email: string | null;
    } | null;
}

export interface AuditLogFilters {
    search?: string | null;
    action?: AuditAction | null;
    tableName?: string | null;
    userId?: string | null;
    recordId?: string | null;
    dateFrom?: string | null;
    dateTo?: string | null;
}

export interface AuditLogListParams {
    first: number;
    rows: number;
    sortField: string;
    sortOrder: 1 | -1;
    filters: AuditLogFilters;
}

export interface AuditLogListResult {
    logs: AuditLog[];
    total: number;
}

@Injectable({ providedIn: 'root' })
export class AuditLogsService {
    private readonly supabase = inject(SupabaseClientService).client;
    private readonly sortableFields = new Set(['created_at', 'action', 'table_name']);

    async listLogs(params: AuditLogListParams): Promise<AuditLogListResult> {
        let query = this.supabase.from('audit_logs').select('id, user_id, action, table_name, record_id, old_data, new_data, created_at, user:profiles(full_name, email)', { count: 'exact' });

        const search = params.filters.search?.trim();

        if (search) {
            const pattern = `%${this.escapeLikeValue(search)}%`;
            const clauses = [`table_name.ilike.${pattern}`, `action.ilike.${pattern}`];

            if (this.isUuid(search)) {
                clauses.push(`record_id.eq.${search}`);
            }

            query = query.or(clauses.join(','));
        }

        if (params.filters.action) {
            query = query.eq('action', params.filters.action);
        }

        if (params.filters.tableName) {
            query = query.eq('table_name', params.filters.tableName);
        }

        if (params.filters.userId) {
            query = query.eq('user_id', params.filters.userId);
        }

        const recordId = params.filters.recordId?.trim();

        if (recordId) {
            query = query.eq('record_id', recordId);
        }

        if (params.filters.dateFrom) {
            query = query.gte('created_at', params.filters.dateFrom);
        }

        if (params.filters.dateTo) {
            query = query.lte('created_at', params.filters.dateTo);
        }

        const sortField = this.sortableFields.has(params.sortField) ? params.sortField : 'created_at';

        query = query.order(sortField, { ascending: params.sortOrder === 1 }).range(params.first, params.first + params.rows - 1);

        const { data, error, count } = await query.returns<AuditLog[]>();

        if (error) {
            throw error;
        }

        return {
            logs: data ?? [],
            total: count ?? 0
        };
    }

    async listUsers(): Promise<AuditUserOption[]> {
        const { data, error } = await this.supabase.from('profiles').select('id, full_name, email').order('full_name', { ascending: true }).returns<AuditUserOption[]>();

        if (error) {
            throw error;
        }

        return data ?? [];
    }

    async listTableNames(): Promise<string[]> {
        const { data, error } = await this.supabase.from('audit_logs').select('table_name').order('table_name', { ascending: true }).limit(1000).returns<{ table_name: string }[]>();

        if (error) {
            throw error;
        }

        return [...new Set((data ?? []).map((row) => row.table_name))];
    }

    private escapeLikeValue(value: string): string {
        return value.replaceAll('%', '\\%').replaceAll(',', '\\,');
    }

    private isUuid(value: string): boolean {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    }
}
