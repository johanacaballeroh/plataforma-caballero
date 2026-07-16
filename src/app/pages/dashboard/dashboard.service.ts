import { Injectable, inject } from '@angular/core';
import { AuthService } from '@/app/core/auth/auth.service';
import { SupabaseClientService } from '@/app/core/supabase/supabase.client';

export type DashboardMetricKey = 'companies' | 'users' | 'items' | 'certificates';

export interface DashboardMetric {
    key: DashboardMetricKey;
    label: string;
    description: string;
    icon: string;
    color: 'blue' | 'cyan' | 'orange' | 'green';
    permission: string;
    total: number | null;
    today: number | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private readonly supabase = inject(SupabaseClientService).client;
    private readonly auth = inject(AuthService);

    async getMetrics(): Promise<DashboardMetric[]> {
        const [startOfToday, endOfToday] = this.todayRange();

        const definitions: Omit<DashboardMetric, 'total' | 'today'>[] = [
            {
                key: 'companies',
                label: 'Empresas',
                description: 'Empresas registradas',
                icon: 'pi pi-building',
                color: 'blue',
                permission: 'companies.view'
            },
            {
                key: 'users',
                label: 'Usuarios',
                description: 'Usuarios del sistema',
                icon: 'pi pi-users',
                color: 'cyan',
                permission: 'users.view'
            },
            {
                key: 'items',
                label: 'Items',
                description: 'Items del catalogo',
                icon: 'pi pi-box',
                color: 'orange',
                permission: 'items.view'
            },
            {
                key: 'certificates',
                label: 'Certificados',
                description: 'Certificados registrados',
                icon: 'pi pi-file-check',
                color: 'green',
                permission: 'certificates.view'
            }
        ];

        return Promise.all(
            definitions.map(async (metric) => {
                if (!this.canReadMetric(metric.key, metric.permission)) {
                    return { ...metric, total: null, today: null };
                }

                const tableName = this.tableName(metric.key);
                const [total, today] = await Promise.all([this.countRows(tableName), this.countRows(tableName, startOfToday, endOfToday)]);

                return { ...metric, total, today };
            })
        );
    }

    private canReadMetric(key: DashboardMetricKey, permission: string): boolean {
        if (key === 'certificates') {
            return this.auth.hasAnyPermission(['certificates.view', 'certificates.view_own']);
        }

        return this.auth.hasPermission(permission);
    }

    private tableName(key: DashboardMetricKey): 'companies' | 'profiles' | 'items' | 'certificates' {
        const tables = {
            companies: 'companies',
            users: 'profiles',
            items: 'items',
            certificates: 'certificates'
        } as const;

        return tables[key];
    }

    private async countRows(tableName: 'companies' | 'profiles' | 'items' | 'certificates', from?: string, to?: string): Promise<number> {
        let query = this.supabase.from(tableName).select('id', { count: 'exact', head: true });

        if (from) {
            query = query.gte('created_at', from);
        }

        if (to) {
            query = query.lte('created_at', to);
        }

        const { count, error } = await query;

        if (error) {
            throw error;
        }

        return count ?? 0;
    }

    private todayRange(): [string, string] {
        const start = new Date();

        start.setHours(0, 0, 0, 0);

        const end = new Date();

        end.setHours(23, 59, 59, 999);

        return [start.toISOString(), end.toISOString()];
    }
}
