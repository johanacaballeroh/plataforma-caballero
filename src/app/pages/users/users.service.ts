import { Injectable, inject } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { SupabaseClientService } from '@/app/core/supabase/supabase.client';
import { environment } from '../../../environments/environment';

export type UserStatus = 'active' | 'inactive';
export type CompanyType = 'generator' | 'transporter' | 'final_destination' | 'both';

export interface UserRoleOption {
    id: string;
    name: string;
    status: UserStatus;
}

export interface UserCompanyOption {
    id: string;
    business_name: string;
    ruc: string;
    company_type: CompanyType;
    status: UserStatus;
}

export interface ManagedUser {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    status: UserStatus;
    created_at: string;
    updated_at: string;
    roles: UserRoleOption[];
    companies: UserCompanyOption[];
}

export interface UserListFilters {
    search?: string | null;
    status?: UserStatus | null;
    roleId?: string | null;
    companyId?: string | null;
}

export interface UserListParams {
    first: number;
    rows: number;
    sortField: string;
    sortOrder: 1 | -1;
    filters: UserListFilters;
}

export interface UserListResult {
    users: ManagedUser[];
    total: number;
}

export interface UpdateManagedUserPayload {
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    status: UserStatus;
    roleIds: string[];
    companyIds: string[];
}

export interface CreateManagedUserPayload extends UpdateManagedUserPayload {
    email: string;
    password: string;
}

interface ProfileRow {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    status: UserStatus;
    created_at: string;
    updated_at: string;
    user_roles: { roles: UserRoleOption | null }[];
    user_companies: { companies: UserCompanyOption | null }[];
}

@Injectable({ providedIn: 'root' })
export class UsersService {
    private readonly supabase = inject(SupabaseClientService).client;
    private readonly signUpClient = createClient(environment.supabase.url, environment.supabase.publishableKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
            storageKey: 'plataforma-caballero-user-create'
        }
    });
    private readonly sortableFields = new Set(['full_name', 'email', 'status', 'created_at', 'updated_at']);

    async listUsers(params: UserListParams): Promise<UserListResult> {
        const filteredUserIds = await this.getFilteredUserIds(params.filters);

        if (filteredUserIds && filteredUserIds.length === 0) {
            return { users: [], total: 0 };
        }

        let query = this.supabase
            .from('profiles')
            .select(
                `
                id,
                full_name,
                email,
                phone,
                avatar_url,
                status,
                created_at,
                updated_at,
                user_roles(roles(id, name, status)),
                user_companies(companies(id, business_name, ruc, company_type, status))
            `,
                { count: 'exact' }
            );

        const search = params.filters.search?.trim();

        if (search) {
            const pattern = `%${search.replaceAll('%', '\\%').replaceAll(',', '\\,')}%`;

            query = query.or(`full_name.ilike.${pattern},email.ilike.${pattern}`);
        }

        if (params.filters.status) {
            query = query.eq('status', params.filters.status);
        }

        if (filteredUserIds) {
            query = query.in('id', filteredUserIds);
        }

        const sortField = this.sortableFields.has(params.sortField) ? params.sortField : 'created_at';

        query = query.order(sortField, { ascending: params.sortOrder === 1 }).range(params.first, params.first + params.rows - 1);

        const { data, error, count } = await query.returns<ProfileRow[]>();

        if (error) {
            throw error;
        }

        return {
            users: (data ?? []).map((row) => this.mapProfile(row)),
            total: count ?? 0
        };
    }

    async getUser(userId: string): Promise<ManagedUser> {
        const { data, error } = await this.supabase
            .from('profiles')
            .select(
                `
                id,
                full_name,
                email,
                phone,
                avatar_url,
                status,
                created_at,
                updated_at,
                user_roles(roles(id, name, status)),
                user_companies(companies(id, business_name, ruc, company_type, status))
            `
            )
            .eq('id', userId)
            .single()
            .returns<ProfileRow>();

        if (error) {
            throw error;
        }

        return this.mapProfile(data);
    }

    async updateUser(userId: string, payload: UpdateManagedUserPayload): Promise<ManagedUser> {
        const { error: profileError } = await this.supabase
            .from('profiles')
            .update({
                full_name: payload.full_name.trim(),
                phone: payload.phone?.trim() || null,
                avatar_url: payload.avatar_url?.trim() || null,
                status: payload.status
            })
            .eq('id', userId);

        if (profileError) {
            throw profileError;
        }

        await Promise.all([this.replaceUserRoles(userId, payload.roleIds), this.replaceUserCompanies(userId, payload.companyIds)]);

        return this.getUser(userId);
    }

    async createUser(payload: CreateManagedUserPayload): Promise<ManagedUser> {
        const { data, error } = await this.signUpClient.auth.signUp({
            email: payload.email.trim(),
            password: payload.password,
            options: {
                data: {
                    full_name: payload.full_name.trim()
                }
            }
        });

        await this.signUpClient.auth.signOut();

        if (error) {
            throw error;
        }

        if (!data.user?.id) {
            throw new Error('No se pudo crear el usuario en Supabase Auth.');
        }

        await this.waitForProfile(data.user.id);

        return this.updateUser(data.user.id, {
            full_name: payload.full_name,
            phone: payload.phone,
            avatar_url: payload.avatar_url,
            status: payload.status,
            roleIds: payload.roleIds,
            companyIds: payload.companyIds
        });
    }

    async updateStatus(userId: string, status: UserStatus): Promise<void> {
        const { error } = await this.supabase.from('profiles').update({ status }).eq('id', userId);

        if (error) {
            throw error;
        }
    }

    async listRoles(): Promise<UserRoleOption[]> {
        const { data, error } = await this.supabase.from('roles').select('id, name, status').order('name', { ascending: true }).returns<UserRoleOption[]>();

        if (error) {
            throw error;
        }

        return data ?? [];
    }

    async listCompanies(): Promise<UserCompanyOption[]> {
        const { data, error } = await this.supabase
            .from('companies')
            .select('id, business_name, ruc, company_type, status')
            .order('business_name', { ascending: true })
            .returns<UserCompanyOption[]>();

        if (error) {
            throw error;
        }

        return data ?? [];
    }

    private async getFilteredUserIds(filters: UserListFilters): Promise<string[] | null> {
        const roleIds = filters.roleId ? await this.getUserIdsByRole(filters.roleId) : null;
        const companyIds = filters.companyId ? await this.getUserIdsByCompany(filters.companyId) : null;

        if (!roleIds && !companyIds) {
            return null;
        }

        if (roleIds && companyIds) {
            const companySet = new Set(companyIds);

            return roleIds.filter((userId) => companySet.has(userId));
        }

        return roleIds ?? companyIds ?? null;
    }

    private async getUserIdsByRole(roleId: string): Promise<string[]> {
        const { data, error } = await this.supabase.from('user_roles').select('user_id').eq('role_id', roleId).returns<{ user_id: string }[]>();

        if (error) {
            throw error;
        }

        return (data ?? []).map((row) => row.user_id);
    }

    private async getUserIdsByCompany(companyId: string): Promise<string[]> {
        const { data, error } = await this.supabase.from('user_companies').select('user_id').eq('company_id', companyId).returns<{ user_id: string }[]>();

        if (error) {
            throw error;
        }

        return (data ?? []).map((row) => row.user_id);
    }

    private async replaceUserRoles(userId: string, roleIds: string[]): Promise<void> {
        const { error: deleteError } = await this.supabase.from('user_roles').delete().eq('user_id', userId);

        if (deleteError) {
            throw deleteError;
        }

        if (!roleIds.length) {
            return;
        }

        const { error: insertError } = await this.supabase.from('user_roles').insert(roleIds.map((roleId) => ({ user_id: userId, role_id: roleId })));

        if (insertError) {
            throw insertError;
        }
    }

    private async replaceUserCompanies(userId: string, companyIds: string[]): Promise<void> {
        const { error: deleteError } = await this.supabase.from('user_companies').delete().eq('user_id', userId);

        if (deleteError) {
            throw deleteError;
        }

        if (!companyIds.length) {
            return;
        }

        const { error: insertError } = await this.supabase.from('user_companies').insert(companyIds.map((companyId) => ({ user_id: userId, company_id: companyId })));

        if (insertError) {
            throw insertError;
        }
    }

    private mapProfile(row: ProfileRow): ManagedUser {
        return {
            id: row.id,
            full_name: row.full_name,
            email: row.email,
            phone: row.phone,
            avatar_url: row.avatar_url,
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at,
            roles: (row.user_roles ?? []).map((item) => item.roles).filter((role): role is UserRoleOption => !!role),
            companies: (row.user_companies ?? []).map((item) => item.companies).filter((company): company is UserCompanyOption => !!company)
        };
    }

    private async waitForProfile(userId: string): Promise<void> {
        for (let attempt = 0; attempt < 8; attempt++) {
            const { data, error } = await this.supabase.from('profiles').select('id').eq('id', userId).maybeSingle();

            if (data?.id) {
                return;
            }

            if (error) {
                throw error;
            }

            await new Promise((resolve) => setTimeout(resolve, 250));
        }

        throw new Error('El perfil del usuario creado aun no esta disponible.');
    }
}
