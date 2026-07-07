import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { AuthService } from '@/app/core/auth/auth.service';
import { DashboardMetric, DashboardService } from './dashboard.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [ButtonModule, CommonModule, ProgressSpinnerModule, SkeletonModule, ToastModule, ToolbarModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Principal</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">{{ welcomeTitle() }}</h1>
                <p class="text-muted-color max-w-3xl">{{ welcomeDescription() }}</p>
            </div>

            @if (canViewMetrics()) {
                <p-toolbar>
                    <ng-template #start>
                        <div class="flex items-center gap-2 text-muted-color">
                            <i class="pi pi-calendar"></i>
                            <span>Hoy: {{ todayLabel }}</span>
                        </div>
                    </ng-template>
                    <ng-template #end>
                        <p-button label="Actualizar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="loadMetrics()" [loading]="loading()" />
                    </ng-template>
                </p-toolbar>

                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    @for (metric of metrics(); track metric.key) {
                        <div class="card mb-0">
                            <div class="flex items-start justify-between gap-4">
                                <div class="min-w-0">
                                    <span class="block text-muted-color font-medium mb-2">{{ metric.label }}</span>
                                    @if (loading()) {
                                        <p-skeleton width="5rem" height="2rem" />
                                    } @else {
                                        <div class="text-surface-900 dark:text-surface-0 font-semibold text-3xl">{{ metric.total ?? 0 }}</div>
                                    }
                                    <div class="text-muted-color mt-2">{{ metric.description }}</div>
                                </div>
                                <div class="flex items-center justify-center rounded-border w-12 h-12 shrink-0" [ngClass]="iconBackground(metric.color)">
                                    <i [class]="metric.icon + ' text-xl ' + iconText(metric.color)"></i>
                                </div>
                            </div>

                            <div class="mt-5 pt-4 border-t border-surface">
                                <div class="flex items-center justify-between gap-3">
                                    <span class="text-muted-color">Creados hoy</span>
                                    @if (loading()) {
                                        <p-skeleton width="3rem" height="1.5rem" />
                                    } @else {
                                        <span class="font-semibold text-surface-900 dark:text-surface-0">{{ metric.today ?? 0 }}</span>
                                    }
                                </div>
                            </div>
                        </div>
                    }
                </div>
            }
        </div>
    `
})
export class Dashboard implements OnInit {
    private readonly auth = inject(AuthService);
    private readonly dashboardService = inject(DashboardService);
    private readonly messageService = inject(MessageService);

    readonly metrics = signal<DashboardMetric[]>(this.defaultMetrics());
    readonly loading = signal(false);
    readonly todayLabel = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
    readonly canViewMetrics = computed(() => this.auth.hasPermission('logs.view'));
    readonly welcomeTitle = computed(() => `Bienvenido, ${this.auth.profile()?.full_name || this.auth.profile()?.email || 'usuario'}`);
    readonly welcomeDescription = computed(() =>
        this.canViewMetrics() ? 'Resumen administrativo con totales generales y registros creados durante el dia actual.' : 'Accede a los modulos disponibles desde el menu lateral.'
    );

    async ngOnInit(): Promise<void> {
        if (this.canViewMetrics()) {
            await this.loadMetrics();
        }
    }

    async loadMetrics(): Promise<void> {
        if (!this.canViewMetrics()) {
            return;
        }

        this.loading.set(true);

        try {
            this.metrics.set(await this.dashboardService.getMetrics());
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Dashboard', detail: 'No se pudieron cargar las metricas del dashboard.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }

    iconBackground(color: DashboardMetric['color']): string {
        const colors: Record<DashboardMetric['color'], string> = {
            blue: 'bg-blue-100 dark:bg-blue-400/10',
            cyan: 'bg-cyan-100 dark:bg-cyan-400/10',
            orange: 'bg-orange-100 dark:bg-orange-400/10',
            green: 'bg-green-100 dark:bg-green-400/10'
        };

        return colors[color];
    }

    iconText(color: DashboardMetric['color']): string {
        const colors: Record<DashboardMetric['color'], string> = {
            blue: 'text-blue-500',
            cyan: 'text-cyan-500',
            orange: 'text-orange-500',
            green: 'text-green-500'
        };

        return colors[color];
    }

    private defaultMetrics(): DashboardMetric[] {
        return [
            { key: 'companies', label: 'Empresas', description: 'Empresas registradas', icon: 'pi pi-building', color: 'blue', permission: 'companies.view', total: null, today: null },
            { key: 'users', label: 'Usuarios', description: 'Usuarios del sistema', icon: 'pi pi-users', color: 'cyan', permission: 'users.view', total: null, today: null },
            { key: 'items', label: 'Items', description: 'Items del catalogo', icon: 'pi pi-box', color: 'orange', permission: 'items.view', total: null, today: null },
            { key: 'certificates', label: 'Certificados', description: 'Certificados registrados', icon: 'pi pi-file-check', color: 'green', permission: 'certificates.view', total: null, today: null }
        ];
    }
}
