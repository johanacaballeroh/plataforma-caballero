import { Injectable, computed, inject, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { SupabaseClientService } from '../supabase/supabase.client';
import { AuthState, UserProfile } from './auth.models';

type UserRoleRow = {
    roles: {
        name: string;
        status: string;
        role_permissions: {
            permissions: {
                module_key: string;
                action_key: string;
            } | null;
        }[];
    } | null;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly supabase = inject(SupabaseClientService).client;
    private initialized = false;

    private readonly state = signal<AuthState>({
        session: null,
        user: null,
        profile: null,
        permissions: [],
        companyIds: [],
        loading: true
    });

    readonly session = computed(() => this.state().session);
    readonly user = computed(() => this.state().user);
    readonly profile = computed(() => this.state().profile);
    readonly permissions = computed(() => this.state().permissions);
    readonly companyIds = computed(() => this.state().companyIds);
    readonly loading = computed(() => this.state().loading);
    readonly isAuthenticated = computed(() => !!this.state().session && this.state().profile?.status === 'active');

    constructor() {
        this.supabase.auth.onAuthStateChange((_event, session) => {
            void this.setSession(session);
        });
    }

    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        this.initialized = true;
        const { data } = await this.supabase.auth.getSession();

        await this.setSession(data.session);
    }

    async signIn(email: string, password: string): Promise<void> {
        const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });

        if (error) {
            throw error;
        }

        await this.setSession(data.session);

        if (!this.isAuthenticated()) {
            await this.signOut();
            throw new Error('Usuario inactivo o sin perfil habilitado.');
        }
    }

    async signOut(): Promise<void> {
        await this.supabase.auth.signOut();
        this.state.set({
            session: null,
            user: null,
            profile: null,
            permissions: [],
            companyIds: [],
            loading: false
        });
    }

    hasPermission(permission: string): boolean {
        return this.permissions().includes(permission);
    }

    hasAnyPermission(permissions: string[] | undefined): boolean {
        if (!permissions?.length) {
            return true;
        }

        return permissions.some((permission) => this.hasPermission(permission));
    }

    async refreshCurrentUser(): Promise<void> {
        const session = this.session();

        await this.setSession(session);
    }

    private async setSession(session: Session | null): Promise<void> {
        this.state.update((current) => ({ ...current, session, user: session?.user ?? null, loading: true }));

        if (!session?.user) {
            this.state.set({
                session: null,
                user: null,
                profile: null,
                permissions: [],
                companyIds: [],
                loading: false
            });

            return;
        }

        const [profile, permissions, companyIds] = await Promise.all([this.loadProfile(session.user.id), this.loadPermissions(session.user.id), this.loadCompanyIds(session.user.id)]);

        this.state.set({
            session,
            user: session.user,
            profile,
            permissions,
            companyIds,
            loading: false
        });
    }

    private async loadProfile(userId: string): Promise<UserProfile | null> {
        const { data, error } = await this.supabase.from('profiles').select('id, full_name, email, phone, avatar_url, status').eq('id', userId).maybeSingle();

        if (error) {
            console.error('No se pudo cargar el perfil autenticado.', error);

            return null;
        }

        return data as UserProfile | null;
    }

    private async loadPermissions(userId: string): Promise<string[]> {
        const { data, error } = await this.supabase
            .from('user_roles')
            .select('roles(name, status, role_permissions(permissions(module_key, action_key)))')
            .eq('user_id', userId)
            .returns<UserRoleRow[]>();

        if (error) {
            console.error('No se pudieron cargar los permisos del usuario.', error);

            return [];
        }

        const permissions = new Set<string>();

        for (const userRole of data ?? []) {
            if (userRole.roles?.status !== 'active') {
                continue;
            }

            for (const rolePermission of userRole.roles.role_permissions ?? []) {
                const permission = rolePermission.permissions;

                if (permission) {
                    permissions.add(`${permission.module_key}.${permission.action_key}`);
                }
            }
        }

        return [...permissions];
    }

    private async loadCompanyIds(userId: string): Promise<string[]> {
        const { data, error } = await this.supabase.from('user_companies').select('company_id').eq('user_id', userId).returns<{ company_id: string }[]>();

        if (error) {
            console.error('No se pudieron cargar las empresas asociadas al usuario.', error);

            return [];
        }

        return (data ?? []).map((row) => row.company_id);
    }
}
