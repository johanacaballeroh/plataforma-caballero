import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '@/app/core/auth/auth.service';
import { IbcLookupComponent } from './ibc-lookup';
import { IBC_STATUSES, IbcListParams, ibcErrorMessage } from './ibc.models';
import { ibcReportTotals } from './ibc-report.utils';
import { IbcService } from './ibc.service';

@Component({
    selector: 'app-ibc-reports',
    imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonModule, InputTextModule, ProgressBarModule, TagModule, ToastModule, IbcLookupComponent],
    providers: [MessageService],
    template: `
        <p-toast />
        <div class="flex flex-col gap-6">
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <span class="text-sm font-medium text-primary">Control IBC</span>
                    <h1 class="text-3xl font-semibold mt-2">Reportes y seguimiento</h1>
                    <p class="text-muted-color">Analiza el volumen de servicios y su distribución por estado.</p>
                </div>
                <div class="flex flex-wrap gap-3">
                    <p-button label="Actualizar" icon="pi pi-refresh" severity="secondary" [outlined]="true" [loading]="loading()" (onClick)="load()" />
                    @if (auth.hasPermission('ibc.export')) {
                        <p-button label="Exportar reporte CSV" icon="pi pi-download" [loading]="exporting()" [disabled]="loading() || failed() || !hasResults() || totals().total === 0" (onClick)="export()" />
                    }
                </div>
            </div>

            <div class="card mb-0!">
                <h2 class="text-xl font-semibold mb-4">Período y alcance del reporte</h2>
                <form [formGroup]="filters" (ngSubmit)="applyFilters()" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div class="flex flex-col gap-2"><label for="ibc-report-company">Empresa</label><app-ibc-lookup kind="companies" inputId="ibc-report-company" formControlName="companyId" placeholder="Todas las empresas" /></div>
                    <div class="flex flex-col gap-2"><label for="ibc-report-chemical">Químico</label><app-ibc-lookup kind="chemicals" inputId="ibc-report-chemical" formControlName="chemicalId" placeholder="Todos los químicos" /></div>
                    <div class="flex flex-col gap-2"><label for="ibc-report-from">Ingreso desde</label><input pInputText type="date" id="ibc-report-from" formControlName="dateFrom" /></div>
                    <div class="flex flex-col gap-2"><label for="ibc-report-to">Ingreso hasta</label><input pInputText type="date" id="ibc-report-to" formControlName="dateTo" /></div>
                    <div class="flex flex-wrap items-center justify-between gap-3 md:col-span-2 xl:col-span-4">
                        <p class="text-sm text-muted-color mb-0">El período corresponde a la fecha de ingreso. Sin fechas se incluye todo el historial.</p>
                        <div class="flex gap-3"><p-button type="submit" label="Aplicar filtros" icon="pi pi-filter" /><p-button label="Limpiar" severity="secondary" [outlined]="true" (onClick)="clearFilters()" /></div>
                    </div>
                </form>
            </div>

            @if (failed()) {
                <div role="alert" class="card mb-0! border border-red-300 text-red-600 dark:text-red-300">No se pudo actualizar el reporte. Intenta nuevamente con el botón Actualizar.</div>
            }

            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" aria-label="Resumen de servicios según filtros aplicados" [attr.aria-busy]="loading()">
                @for (card of cards(); track card.label) {
                    <div class="card mb-0! flex items-center justify-between gap-4">
                        <div><span class="text-muted-color">{{ card.label }}</span><div class="text-3xl font-semibold mt-2">{{ counts() && !loading() && !failed() ? card.value : '—' }}</div></div>
                        <i [class]="card.icon + ' text-2xl text-primary'" aria-hidden="true"></i>
                    </div>
                }
            </div>

            <div class="card mb-0!">
                <h2 class="text-xl font-semibold mb-1">Distribución por estado</h2>
                <p class="text-sm text-muted-color mb-5">Selecciona un estado para abrir sus registros en Servicios IBC, conservando el período y los filtros aplicados.</p>
                @if (hasResults() && !loading() && !failed() && totals().total === 0) {
                    <p class="text-muted-color" role="status">No hay servicios para el período y los filtros aplicados.</p>
                }
                <div class="flex flex-col gap-4">
                    @for (state of statuses; track state.value) {
                        <a [routerLink]="['/ibc/services']" [queryParams]="serviceFilters(state.value)" class="block w-full rounded-lg p-2 hover:bg-surface-100 dark:hover:bg-surface-800 focus-visible:outline-2 focus-visible:outline-primary">
                            <span class="flex flex-wrap justify-between items-center gap-2 mb-2">
                                <p-tag [value]="state.label" [severity]="state.severity" />
                                <span class="text-sm">{{ counts() && !failed() && !loading() ? count(state.value) : '—' }} servicios · {{ percentage(state.value) | number:'1.0-1' }} % <i class="pi pi-arrow-up-right ml-2" aria-hidden="true"></i></span>
                            </span>
                            <p-progressbar [value]="loading() || failed() ? 0 : percentage(state.value)" [showValue]="false" [style]="{height:'0.5rem'}" />
                        </a>
                    }
                </div>
            </div>

            <div class="card mb-0! flex flex-wrap justify-between items-center gap-4">
                <div><h2 class="text-xl font-semibold mb-1">Continuar el seguimiento</h2><p class="text-muted-color mb-0">Atiende los pendientes y consulta las fichas de cada envase desde la bandeja de trabajo.</p></div>
                <p-button label="Abrir Servicios IBC" icon="pi pi-arrow-right" [routerLink]="['/ibc/services']" [queryParams]="serviceFilters()" />
            </div>
        </div>
    `
})
export class IbcReportsComponent implements OnInit {
    readonly auth = inject(AuthService);
    private readonly service = inject(IbcService);
    private readonly messages = inject(MessageService);
    private readonly fb = inject(FormBuilder);
    readonly counts = signal<Record<string, number> | null>(null);
    readonly loading = signal(false);
    readonly failed = signal(false);
    readonly hasResults = signal(false);
    readonly exporting = signal(false);
    readonly statuses = IBC_STATUSES;
    readonly filters = this.fb.nonNullable.group({ companyId: '', chemicalId: '', dateFrom: '', dateTo: '' });
    readonly totals = computed(() => ibcReportTotals(this.counts() ?? {}));
    readonly cards = computed(() => [
        { label: 'Servicios registrados', value: this.totals().total, icon: 'pi pi-chart-bar' },
        { label: 'Servicios abiertos', value: this.totals().open, icon: 'pi pi-inbox' },
        { label: 'Retenidos', value: this.totals().retained, icon: 'pi pi-exclamation-circle' },
        { label: 'Entregados', value: this.totals().delivered, icon: 'pi pi-truck' }
    ]);
    params: IbcListParams = { first: 0, rows: 10, sortField: 'received_at', sortOrder: 1, status: '' };
    private request = 0;

    ngOnInit(): void { void this.load(); }

    async load(): Promise<void> {
        const request = ++this.request;
        const params = { ...this.params };

        this.loading.set(true);
        this.failed.set(false);

        try {
            const counts = await this.service.summary(params);

            if (request !== this.request) return;
            this.counts.set(counts);
            this.hasResults.set(true);
        } catch (error) {
            if (request !== this.request) return;
            this.failed.set(true);
            this.error(error);
        } finally {
            if (request === this.request) this.loading.set(false);
        }
    }

    applyFilters(): void {
        const filters = this.filters.getRawValue();

        if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
            this.messages.add({ severity: 'warn', summary: 'Fechas', detail: 'La fecha inicial debe ser anterior a la final.' });

            return;
        }

        this.params = { ...this.params, ...filters };
        void this.load();
    }

    clearFilters(): void {
        this.filters.reset();
        this.applyFilters();
    }

    serviceFilters(status = 'open') {
        return {
            status, companyId: this.params.companyId || null, chemicalId: this.params.chemicalId || null,
            dateFrom: this.params.dateFrom || null, dateTo: this.params.dateTo || null
        };
    }

    percentage(status: string): number {
        return !this.totals().total || this.failed() || this.loading() ? 0 : (this.count(status) / this.totals().total) * 100;
    }

    count(status: string): number {
        return this.counts()?.[status] ?? 0;
    }

    async export(): Promise<void> {
        if (!this.auth.hasPermission('ibc.export') || this.exporting() || this.loading() || this.failed() || !this.hasResults() || !this.totals().total) return;
        this.exporting.set(true);

        try {
            await this.service.exportCsv({ ...this.params });
            this.messages.add({ severity: 'success', summary: 'Reporte exportado', detail: 'La exportación del período se descargó y quedó registrada.' });
        } catch (error) { this.error(error); } finally { this.exporting.set(false); }
    }

    private error(error: unknown): void { this.messages.add({ severity: 'error', summary: 'Reportes IBC', detail: ibcErrorMessage(error) }); }
}
