import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '@/app/core/supabase/supabase.client';

export type CompanyStatus = 'active' | 'inactive';
export type CompanyType = 'generator' | 'transporter' | 'final_destination' | 'both';
export type BranchType = 'deposit' | 'fiscal_address' | 'office' | 'branch';

export interface ManagedCompany {
    id: string;
    company_type: CompanyType;
    ruc: string;
    business_name: string;
    trade_name: string | null;
    fiscal_address: string | null;
    status: CompanyStatus;
    created_at: string;
    updated_at: string;
    branches_count: number;
    contacts_count: number;
    certificates_count: number;
}

export interface CompanyBranch {
    id: string;
    company_id: string;
    branch_type: BranchType;
    name: string | null;
    address: string;
    status: CompanyStatus;
    created_at: string;
    updated_at: string;
}

export interface CompanyContact {
    id: string;
    company_id: string;
    full_name: string;
    position: string | null;
    email: string | null;
    phone: string | null;
    status: CompanyStatus;
    created_at: string;
    updated_at: string;
}

export interface CompanyListFilters {
    search?: string | null;
    status?: CompanyStatus | null;
    companyType?: CompanyType | null;
}

export interface CompanyListParams {
    first: number;
    rows: number;
    sortField: string;
    sortOrder: 1 | -1;
    filters: CompanyListFilters;
}

export interface CompanyListResult {
    companies: ManagedCompany[];
    total: number;
}

export interface SaveCompanyPayload {
    company_type: CompanyType;
    ruc: string;
    business_name: string;
    trade_name: string | null;
    fiscal_address: string | null;
    status: CompanyStatus;
}

export interface SaveCompanyBranchPayload {
    branch_type: BranchType;
    name: string | null;
    address: string;
    status: CompanyStatus;
}

export interface SaveCompanyContactPayload {
    full_name: string;
    position: string | null;
    email: string | null;
    phone: string | null;
    status: CompanyStatus;
}

interface CompanyRow {
    id: string;
    company_type: CompanyType;
    ruc: string;
    business_name: string;
    trade_name: string | null;
    fiscal_address: string | null;
    status: CompanyStatus;
    created_at: string;
    updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class CompaniesService {
    private readonly supabase = inject(SupabaseClientService).client;
    private readonly sortableFields = new Set(['ruc', 'business_name', 'trade_name', 'company_type', 'status', 'created_at', 'updated_at']);

    async listCompanies(params: CompanyListParams): Promise<CompanyListResult> {
        let query = this.supabase.from('companies').select('id, company_type, ruc, business_name, trade_name, fiscal_address, status, created_at, updated_at', { count: 'exact' });

        const search = params.filters.search?.trim();

        if (search) {
            const pattern = `%${search.replaceAll('%', '\\%').replaceAll(',', '\\,')}%`;

            query = query.or(`ruc.ilike.${pattern},business_name.ilike.${pattern},trade_name.ilike.${pattern},fiscal_address.ilike.${pattern}`);
        }

        if (params.filters.status) {
            query = query.eq('status', params.filters.status);
        }

        if (params.filters.companyType) {
            query = query.eq('company_type', params.filters.companyType);
        }

        const sortField = this.sortableFields.has(params.sortField) ? params.sortField : 'created_at';

        query = query.order(sortField, { ascending: params.sortOrder === 1 }).range(params.first, params.first + params.rows - 1);

        const { data, error, count } = await query.returns<CompanyRow[]>();

        if (error) {
            throw error;
        }

        const ids = (data ?? []).map((company) => company.id);
        const [branchCounts, contactCounts, certificateCounts] = await Promise.all([this.getBranchCounts(ids), this.getContactCounts(ids), this.getCertificateCounts(ids)]);

        return {
            companies: (data ?? []).map((row) => this.mapCompany(row, branchCounts.get(row.id) ?? 0, contactCounts.get(row.id) ?? 0, certificateCounts.get(row.id) ?? 0)),
            total: count ?? 0
        };
    }

    async getCompany(companyId: string): Promise<ManagedCompany> {
        const { data, error } = await this.supabase
            .from('companies')
            .select('id, company_type, ruc, business_name, trade_name, fiscal_address, status, created_at, updated_at')
            .eq('id', companyId)
            .single()
            .returns<CompanyRow>();

        if (error) {
            throw error;
        }

        const [branchCounts, contactCounts, certificateCounts] = await Promise.all([this.getBranchCounts([companyId]), this.getContactCounts([companyId]), this.getCertificateCounts([companyId])]);

        return this.mapCompany(data, branchCounts.get(companyId) ?? 0, contactCounts.get(companyId) ?? 0, certificateCounts.get(companyId) ?? 0);
    }

    async createCompany(payload: SaveCompanyPayload): Promise<ManagedCompany> {
        const { data, error } = await this.supabase.from('companies').insert(this.mapCompanyPayload(payload)).select('id').single().returns<{ id: string }>();

        if (error) {
            throw error;
        }

        return this.getCompany(data.id);
    }

    async updateCompany(companyId: string, payload: SaveCompanyPayload): Promise<ManagedCompany> {
        const { error } = await this.supabase.from('companies').update(this.mapCompanyPayload(payload)).eq('id', companyId);

        if (error) {
            throw error;
        }

        return this.getCompany(companyId);
    }

    async updateStatus(companyId: string, status: CompanyStatus): Promise<void> {
        const { error } = await this.supabase.from('companies').update({ status }).eq('id', companyId);

        if (error) {
            throw error;
        }
    }

    async deleteCompany(company: ManagedCompany): Promise<void> {
        if (company.certificates_count > 0) {
            throw new Error('No se puede eliminar una empresa usada en certificados.');
        }

        const { error } = await this.supabase.from('companies').delete().eq('id', company.id);

        if (error) {
            if ('code' in error && error.code === '23503') {
                throw new Error('No se puede eliminar una empresa usada en certificados.');
            }

            throw error;
        }
    }

    async listBranches(companyId: string): Promise<CompanyBranch[]> {
        const { data, error } = await this.supabase
            .from('company_branches')
            .select('id, company_id, branch_type, name, address, status, created_at, updated_at')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .returns<CompanyBranch[]>();

        if (error) {
            throw error;
        }

        return data ?? [];
    }

    async createBranch(companyId: string, payload: SaveCompanyBranchPayload): Promise<void> {
        const { error } = await this.supabase.from('company_branches').insert({ ...this.mapBranchPayload(payload), company_id: companyId });

        if (error) {
            throw error;
        }
    }

    async updateBranch(branchId: string, payload: SaveCompanyBranchPayload): Promise<void> {
        const { error } = await this.supabase.from('company_branches').update(this.mapBranchPayload(payload)).eq('id', branchId);

        if (error) {
            throw error;
        }
    }

    async updateBranchStatus(branchId: string, status: CompanyStatus): Promise<void> {
        const { error } = await this.supabase.from('company_branches').update({ status }).eq('id', branchId);

        if (error) {
            throw error;
        }
    }

    async deleteBranch(branchId: string): Promise<void> {
        const { error } = await this.supabase.from('company_branches').delete().eq('id', branchId);

        if (error) {
            throw error;
        }
    }

    async listContacts(companyId: string): Promise<CompanyContact[]> {
        const { data, error } = await this.supabase
            .from('company_contacts')
            .select('id, company_id, full_name, position, email, phone, status, created_at, updated_at')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .returns<CompanyContact[]>();

        if (error) {
            throw error;
        }

        return data ?? [];
    }

    async createContact(companyId: string, payload: SaveCompanyContactPayload): Promise<void> {
        const { error } = await this.supabase.from('company_contacts').insert({ ...this.mapContactPayload(payload), company_id: companyId });

        if (error) {
            throw error;
        }
    }

    async updateContact(contactId: string, payload: SaveCompanyContactPayload): Promise<void> {
        const { error } = await this.supabase.from('company_contacts').update(this.mapContactPayload(payload)).eq('id', contactId);

        if (error) {
            throw error;
        }
    }

    async updateContactStatus(contactId: string, status: CompanyStatus): Promise<void> {
        const { error } = await this.supabase.from('company_contacts').update({ status }).eq('id', contactId);

        if (error) {
            throw error;
        }
    }

    async deleteContact(contactId: string): Promise<void> {
        const { error } = await this.supabase.from('company_contacts').delete().eq('id', contactId);

        if (error) {
            throw error;
        }
    }

    private async getBranchCounts(companyIds: string[]): Promise<Map<string, number>> {
        return this.countByCompany('company_branches', companyIds);
    }

    private async getContactCounts(companyIds: string[]): Promise<Map<string, number>> {
        return this.countByCompany('company_contacts', companyIds);
    }

    private async countByCompany(table: 'company_branches' | 'company_contacts', companyIds: string[]): Promise<Map<string, number>> {
        const counts = new Map<string, number>();

        if (!companyIds.length) {
            return counts;
        }

        const { data, error } = await this.supabase.from(table).select('company_id').in('company_id', companyIds).returns<{ company_id: string }[]>();

        if (error) {
            return counts;
        }

        for (const row of data ?? []) {
            counts.set(row.company_id, (counts.get(row.company_id) ?? 0) + 1);
        }

        return counts;
    }

    private async getCertificateCounts(companyIds: string[]): Promise<Map<string, number>> {
        const counts = new Map<string, number>();

        if (!companyIds.length) {
            return counts;
        }

        const { data, error } = await this.supabase
            .from('certificates')
            .select('id, generator_company_id, transporter_company_id, final_destination_company_id')
            .or(`generator_company_id.in.(${companyIds.join(',')}),transporter_company_id.in.(${companyIds.join(',')}),final_destination_company_id.in.(${companyIds.join(',')})`)
            .returns<{ id: string; generator_company_id: string; transporter_company_id: string | null; final_destination_company_id: string | null }[]>();

        if (error) {
            return counts;
        }

        const companySet = new Set(companyIds);
        const certificateIdsByCompany = new Map<string, Set<string>>();

        for (const row of data ?? []) {
            for (const companyId of [row.generator_company_id, row.transporter_company_id, row.final_destination_company_id]) {
                if (companyId && companySet.has(companyId)) {
                    const certificateIds = certificateIdsByCompany.get(companyId) ?? new Set<string>();

                    certificateIds.add(row.id);
                    certificateIdsByCompany.set(companyId, certificateIds);
                }
            }
        }

        for (const [companyId, certificateIds] of certificateIdsByCompany) {
            counts.set(companyId, certificateIds.size);
        }

        return counts;
    }

    private mapCompanyPayload(payload: SaveCompanyPayload): Omit<CompanyRow, 'id' | 'created_at' | 'updated_at'> {
        return {
            company_type: payload.company_type,
            ruc: payload.ruc.trim(),
            business_name: payload.business_name.trim(),
            trade_name: payload.trade_name?.trim() || null,
            fiscal_address: payload.fiscal_address?.trim() || null,
            status: payload.status
        };
    }

    private mapBranchPayload(payload: SaveCompanyBranchPayload): Omit<CompanyBranch, 'id' | 'company_id' | 'created_at' | 'updated_at'> {
        return {
            branch_type: payload.branch_type,
            name: payload.name?.trim() || null,
            address: payload.address.trim(),
            status: payload.status
        };
    }

    private mapContactPayload(payload: SaveCompanyContactPayload): Omit<CompanyContact, 'id' | 'company_id' | 'created_at' | 'updated_at'> {
        return {
            full_name: payload.full_name.trim(),
            position: payload.position?.trim() || null,
            email: payload.email?.trim() || null,
            phone: payload.phone?.trim() || null,
            status: payload.status
        };
    }

    private mapCompany(row: CompanyRow, branchesCount: number, contactsCount: number, certificatesCount: number): ManagedCompany {
        return {
            id: row.id,
            company_type: row.company_type,
            ruc: row.ruc,
            business_name: row.business_name,
            trade_name: row.trade_name,
            fiscal_address: row.fiscal_address,
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at,
            branches_count: branchesCount,
            contacts_count: contactsCount,
            certificates_count: certificatesCount
        };
    }
}
