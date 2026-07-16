import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '@/app/core/supabase/supabase.client';

export type RoleStatus = 'active' | 'inactive';

export interface Permission {
    id: string;
    module_key: string;
    action_key: string;
    description: string | null;
    created_at: string;
}

export interface ManagedRole {
    id: string;
    name: string;
    description: string | null;
    is_system_role: boolean;
    status: RoleStatus;
    created_at: string;
    updated_at: string;
    permissions: Permission[];
    users_count: number;
}

export interface RoleListFilters {
    search?: string | null;
    status?: RoleStatus | null;
    systemRole?: boolean | null;
    moduleKey?: string | null;
}

export interface RoleListParams {
    first: number;
    rows: number;
    sortField: string;
    sortOrder: 1 | -1;
    filters: RoleListFilters;
}

export interface RoleListResult {
    roles: ManagedRole[];
    total: number;
}

export interface SaveRolePayload {
    name: string;
    description: string | null;
    status: RoleStatus;
    permissionIds: string[];
}

interface RoleRow {
    id: string;
    name: string;
    description: string | null;
    is_system_role: boolean;
    status: RoleStatus;
    created_at: string;
    updated_at: string;
    role_permissions: { permissions: Permission | null }[];
}

@Injectable({ providedIn: 'root' })
export class RolesService {
    private readonly supabase = inject(SupabaseClientService).client;
    private readonly sortableFields = new Set(['name', 'status', 'is_system_role', 'created_at', 'updated_at']);

    async listRoles(params: RoleListParams): Promise<RoleListResult> {
        const roleIdsByModule = params.filters.moduleKey ? await this.getRoleIdsByModule(params.filters.moduleKey) : null;

        if (roleIdsByModule && roleIdsByModule.length === 0) {
            return { roles: [], total: 0 };
        }

        let query = this.supabase
            .from('roles')
            .select(
                `
                id,
                name,
                description,
                is_system_role,
                status,
                created_at,
                updated_at,
                role_permissions(permissions(id, module_key, action_key, description, created_at))
            `,
                { count: 'exact' }
            );

        const search = params.filters.search?.trim();

        if (search) {
            const pattern = `%${search.replaceAll('%', '\\%').replaceAll(',', '\\,')}%`;

            query = query.or(`name.ilike.${pattern},description.ilike.${pattern}`);
        }

        if (params.filters.status) {
            query = query.eq('status', params.filters.status);
        }

        if (params.filters.systemRole !== null && params.filters.systemRole !== undefined) {
            query = query.eq('is_system_role', params.filters.systemRole);
        }

        if (roleIdsByModule) {
            query = query.in('id', roleIdsByModule);
        }

        const sortField = this.sortableFields.has(params.sortField) ? params.sortField : 'created_at';

        query = query.order(sortField, { ascending: params.sortOrder === 1 }).range(params.first, params.first + params.rows - 1);

        const { data, error, count } = await query.returns<RoleRow[]>();

        if (error) {
            throw error;
        }

        const userCounts = await this.getUserCounts((data ?? []).map((role) => role.id));

        return {
            roles: (data ?? []).map((row) => this.mapRole(row, userCounts.get(row.id) ?? 0)),
            total: count ?? 0
        };
    }

    async listPermissions(): Promise<Permission[]> {
        const { data, error } = await this.supabase.from('permissions').select('id, module_key, action_key, description, created_at').order('module_key', { ascending: true }).order('action_key', { ascending: true }).returns<Permission[]>();

        if (error) {
            throw error;
        }

        return data ?? [];
    }

    async createRole(payload: SaveRolePayload): Promise<ManagedRole> {
        const { data, error } = await this.supabase
            .from('roles')
            .insert({
                name: payload.name.trim(),
                description: payload.description?.trim() || null,
                status: payload.status,
                is_system_role: false
            })
            .select('id')
            .single()
            .returns<{ id: string }>();

        if (error) {
            throw error;
        }

        await this.replaceRolePermissions(data.id, payload.permissionIds);

        return this.getRole(data.id);
    }

    async updateRole(roleId: string, payload: SaveRolePayload): Promise<ManagedRole> {
        const { error } = await this.supabase
            .from('roles')
            .update({
                name: payload.name.trim(),
                description: payload.description?.trim() || null,
                status: payload.status
            })
            .eq('id', roleId);

        if (error) {
            throw error;
        }

        await this.replaceRolePermissions(roleId, payload.permissionIds);

        return this.getRole(roleId);
    }

    async updateStatus(roleId: string, status: RoleStatus): Promise<void> {
        const { error } = await this.supabase.from('roles').update({ status }).eq('id', roleId);

        if (error) {
            throw error;
        }
    }

    async deleteRole(role: ManagedRole): Promise<void> {
        if (role.is_system_role) {
            throw new Error('No se puede eliminar un rol base del sistema.');
        }

        if (role.users_count > 0) {
            throw new Error('No se puede eliminar un rol asignado a usuarios.');
        }

        const { error } = await this.supabase.from('roles').delete().eq('id', role.id);

        if (error) {
            throw error;
        }
    }

    async getRole(roleId: string): Promise<ManagedRole> {
        const { data, error } = await this.supabase
            .from('roles')
            .select(
                `
                id,
                name,
                description,
                is_system_role,
                status,
                created_at,
                updated_at,
                role_permissions(permissions(id, module_key, action_key, description, created_at))
            `
            )
            .eq('id', roleId)
            .single()
            .returns<RoleRow>();

        if (error) {
            throw error;
        }

        const userCounts = await this.getUserCounts([roleId]);

        return this.mapRole(data, userCounts.get(roleId) ?? 0);
    }

    private async replaceRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
        const { error: deleteError } = await this.supabase.from('role_permissions').delete().eq('role_id', roleId);

        if (deleteError) {
            throw deleteError;
        }

        if (!permissionIds.length) {
            return;
        }

        const { error: insertError } = await this.supabase.from('role_permissions').insert(permissionIds.map((permissionId) => ({ role_id: roleId, permission_id: permissionId })));

        if (insertError) {
            throw insertError;
        }
    }

    private async getRoleIdsByModule(moduleKey: string): Promise<string[]> {
        const { data, error } = await this.supabase.from('role_permissions').select('role_id, permissions!inner(module_key)').eq('permissions.module_key', moduleKey).returns<{ role_id: string }[]>();

        if (error) {
            throw error;
        }

        return [...new Set((data ?? []).map((row) => row.role_id))];
    }

    private async getUserCounts(roleIds: string[]): Promise<Map<string, number>> {
        const counts = new Map<string, number>();

        if (!roleIds.length) {
            return counts;
        }

        const { data, error } = await this.supabase.from('user_roles').select('role_id').in('role_id', roleIds).returns<{ role_id: string }[]>();

        if (error) {
            throw error;
        }

        for (const row of data ?? []) {
            counts.set(row.role_id, (counts.get(row.role_id) ?? 0) + 1);
        }

        return counts;
    }

    private mapRole(row: RoleRow, usersCount: number): ManagedRole {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            is_system_role: row.is_system_role,
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at,
            permissions: (row.role_permissions ?? []).map((item) => item.permissions).filter((permission): permission is Permission => !!permission),
            users_count: usersCount
        };
    }
}
