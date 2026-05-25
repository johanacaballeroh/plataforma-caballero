import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '@/app/core/supabase/supabase.client';
import { UserProfile } from '@/app/core/auth/auth.models';

export interface ProfileRole {
    name: string;
    status: 'active' | 'inactive';
}

export interface ProfileCompany {
    id: string;
    business_name: string;
    ruc: string;
    company_type: 'generator' | 'transporter' | 'final_destination' | 'both';
    status: 'active' | 'inactive';
}

interface UserRoleRow {
    roles: ProfileRole | null;
}

interface UserCompanyRow {
    companies: ProfileCompany | null;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
    private readonly supabase = inject(SupabaseClientService).client;

    async getCurrentProfile(): Promise<UserProfile> {
        const { data: userData, error: userError } = await this.supabase.auth.getUser();

        if (userError || !userData.user) {
            throw userError ?? new Error('No hay una sesion activa.');
        }

        const { data, error } = await this.supabase.from('profiles').select('id, full_name, email, phone, avatar_url, status').eq('id', userData.user.id).single();

        if (error) {
            throw error;
        }

        return data as UserProfile;
    }

    async updateCurrentProfile(profileId: string, changes: Pick<UserProfile, 'full_name' | 'phone' | 'avatar_url'>): Promise<UserProfile> {
        const payload = {
            full_name: changes.full_name.trim(),
            phone: changes.phone?.trim() || null,
            avatar_url: changes.avatar_url?.trim() || null
        };

        const { data, error } = await this.supabase.from('profiles').update(payload).eq('id', profileId).select('id, full_name, email, phone, avatar_url, status').single();

        if (error) {
            throw error;
        }

        return data as UserProfile;
    }

    async updatePassword(password: string): Promise<void> {
        const { error } = await this.supabase.auth.updateUser({ password });

        if (error) {
            throw error;
        }
    }

    async getCurrentRoles(userId: string): Promise<ProfileRole[]> {
        const { data, error } = await this.supabase.from('user_roles').select('roles(name, status)').eq('user_id', userId).returns<UserRoleRow[]>();

        if (error) {
            throw error;
        }

        return (data ?? []).map((row) => row.roles).filter((role): role is ProfileRole => !!role);
    }

    async getCurrentCompanies(userId: string): Promise<ProfileCompany[]> {
        const { data, error } = await this.supabase.from('user_companies').select('companies(id, business_name, ruc, company_type, status)').eq('user_id', userId).returns<UserCompanyRow[]>();

        if (error) {
            throw error;
        }

        return (data ?? []).map((row) => row.companies).filter((company): company is ProfileCompany => !!company);
    }
}
