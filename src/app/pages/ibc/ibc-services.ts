import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '@/app/core/auth/auth.service';
import { IBC_STATUSES, IbcListParams, IbcServiceCycle, ibcErrorMessage, ibcState } from './ibc.models';
import { IbcLookupComponent } from './ibc-lookup';
import { IbcService } from './ibc.service';
import { ibcServiceDays } from './ibc-report.utils';

@Component({
    selector: 'app-ibc-services',
    imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonModule, DatePickerModule, DialogModule, InputTextModule, SelectModule, TableModule, TagModule, TextareaModule, ToastModule, IbcLookupComponent],
    providers: [MessageService],
    template: `
        <p-toast />
        <div class="flex flex-col gap-6">
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div><span class="text-sm font-medium text-primary">Control IBC</span><h1 class="text-3xl font-semibold mt-2">Servicios IBC</h1><p class="text-muted-color">Registra ingresos y atiende el lavado, la hermeticidad y la entrega de cada envase.</p></div>
                <div class="flex flex-wrap gap-3">
                    <p-button label="Ver reportes" icon="pi pi-chart-bar" severity="secondary" [outlined]="true" routerLink="/ibc/reports" />
                    @if (auth.hasPermission('ibc.create')) { <p-button label="Registrar ingreso" icon="pi pi-plus" (onClick)="openReceive()" /> }
                </div>
            </div>
            <div class="card">
                <h2 class="text-xl font-semibold mb-5">Bandeja de trabajo</h2>
                <form [formGroup]="filters" (ngSubmit)="filter()" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                    <div class="flex flex-col gap-2 md:col-span-2"><label for="ibc-search">Buscar</label><input pInputText id="ibc-search" formControlName="search" placeholder="Envase, empresa, químico, GRE u orden de compra" /></div>
                    <div class="flex flex-col gap-2"><label for="ibc-filter-company">Empresa</label><app-ibc-lookup kind="companies" inputId="ibc-filter-company" formControlName="companyId" placeholder="Todas las empresas" /></div>
                    <div class="flex flex-col gap-2"><label for="ibc-filter-chemical">Químico</label><app-ibc-lookup kind="chemicals" inputId="ibc-filter-chemical" formControlName="chemicalId" placeholder="Todos los químicos" /></div>
                    <div class="flex flex-col gap-2"><label for="ibc-filter-status">Estado</label><p-select inputId="ibc-filter-status" formControlName="status" [options]="statuses" optionLabel="label" optionValue="value" placeholder="Todos" [showClear]="true" /></div>
                    <div class="flex flex-col gap-2"><label for="ibc-date-from">Ingreso desde</label><input pInputText type="date" id="ibc-date-from" formControlName="dateFrom" /></div>
                    <div class="flex flex-col gap-2"><label for="ibc-date-to">Ingreso hasta</label><input pInputText type="date" id="ibc-date-to" formControlName="dateTo" /></div>
                    <div class="flex items-end gap-3"><p-button type="submit" label="Filtrar" icon="pi pi-search" /><p-button label="Limpiar" severity="secondary" [outlined]="true" (onClick)="clear()" /></div>
                </form>
                <p-table [value]="rows()" [lazy]="true" (onLazyLoad)="load($event)" [loading]="loading()" [paginator]="true" [first]="params.first" [rows]="params.rows" [totalRecords]="total()" [rowsPerPageOptions]="[10,20,50]" dataKey="id" sortField="received_at" [sortOrder]="1" [showCurrentPageReport]="true" currentPageReportTemplate="{first} a {last} de {totalRecords} servicios" [tableStyle]="{'min-width':'90rem'}">
                    <ng-template #header><tr>
                        <th pSortableColumn="container_code">Envase <p-sortIcon field="container_code" /></th><th pSortableColumn="company_name">Empresa <p-sortIcon field="company_name" /></th><th pSortableColumn="chemical_name">Químico <p-sortIcon field="chemical_name" /></th>
                        <th pSortableColumn="received_at">Ingreso <p-sortIcon field="received_at" /></th><th>Días en servicio</th><th pSortableColumn="gre_entry">GRE ingreso <p-sortIcon field="gre_entry" /></th><th pSortableColumn="purchase_order">OC <p-sortIcon field="purchase_order" /></th>
                        <th pSortableColumn="wash_count">Lavados <p-sortIcon field="wash_count" /></th><th pSortableColumn="status">Estado <p-sortIcon field="status" /></th><th pSortableColumn="delivered_at">Entrega <p-sortIcon field="delivered_at" /></th><th>Acciones</th>
                    </tr></ng-template>
                    <ng-template #body let-row><tr>
                        <td><a [routerLink]="['/ibc/containers',row.container_id]" class="text-primary font-semibold">{{ row.container_code }}</a><div class="text-sm text-muted-color">N.° {{ row.original_number }}</div>@if (row.is_demo) { <p-tag value="Demo" severity="info" /> }</td>
                        <td>{{ row.company_name }}</td><td>{{ row.chemical_name }}</td><td>{{ row.received_at | date:'dd/MM/yyyy':'-0500' }}</td><td>{{ days(row) ?? '—' }}<div class="text-xs text-muted-color">{{ row.delivered_at ? 'Hasta su entrega' : 'Desde el ingreso' }}</div></td><td>{{ row.gre_entry || '—' }}</td><td>{{ row.purchase_order || '—' }}</td><td>{{ row.wash_count }}</td>
                        <td><p-tag [value]="state(row.status).label" [severity]="state(row.status).severity" /></td><td>{{ (row.delivered_at | date:'dd/MM/yyyy') || '—' }}</td>
                        <td><p-button label="Abrir" icon="pi pi-arrow-right" [text]="true" [routerLink]="['/ibc/services',row.id]" /></td>
                    </tr></ng-template>
                    <ng-template #emptymessage><tr><td colspan="11">No hay servicios para estos filtros.</td></tr></ng-template>
                </p-table>
            </div>
        </div>
        <p-dialog [(visible)]="receiveVisible" header="Registrar ingreso individual" [modal]="true" [style]="{width:'52rem',maxWidth:'95vw'}">
            <form [formGroup]="receiveForm" (ngSubmit)="receive()" class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div class="flex flex-col gap-2"><label for="ibc-mode">Identificación</label><p-select inputId="ibc-mode" formControlName="mode" [options]="modes" optionLabel="label" optionValue="value" appendTo="body" /></div>
                @if (receiveForm.controls.mode.value === 'existing') {
                    <div class="flex flex-col gap-2"><label for="ibc-existing">Envase existente</label><app-ibc-lookup kind="containers" inputId="ibc-existing" formControlName="containerId" /></div>
                } @else {
                    <div class="flex flex-col gap-2"><label for="ibc-original">Número original del envase</label><input pInputText id="ibc-original" formControlName="originalNumber" maxlength="80" /></div>
                }
                <div class="flex flex-col gap-2"><label for="ibc-receive-company">Empresa solicitante</label><app-ibc-lookup kind="companies" inputId="ibc-receive-company" formControlName="companyId" /></div>
                <div class="flex flex-col gap-2"><label for="ibc-receive-chemical">Químico contenido</label><app-ibc-lookup kind="chemicals" inputId="ibc-receive-chemical" formControlName="chemicalId" /></div>
                <div class="flex flex-col gap-2"><label for="ibc-received">Fecha y hora de ingreso</label><p-datepicker inputId="ibc-received" formControlName="receivedAt" [showTime]="true" hourFormat="24" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body" /></div>
                <div class="flex flex-col gap-2"><label for="ibc-gre">GRE ingreso</label><input pInputText id="ibc-gre" formControlName="greEntry" maxlength="120" /></div>
                <div class="flex flex-col gap-2"><label for="ibc-po">Orden de compra</label><input pInputText id="ibc-po" formControlName="purchaseOrder" maxlength="120" /></div>
                <div class="flex flex-col gap-2 md:col-span-2"><label for="ibc-notes">Observaciones</label><textarea pTextarea id="ibc-notes" formControlName="notes" rows="3"></textarea></div>
                <p class="text-sm text-muted-color md:col-span-2">Si el envase ya tiene una ficha, selecciónala para conservar su historial. La GRE y la orden de compra pueden compartirse entre ingresos.</p>
                @if (receiveInvalid) { <p role="alert" class="text-red-500 md:col-span-2">Selecciona el envase o escribe su número, la empresa, el químico y una fecha válida.</p> }
                <div class="flex justify-end gap-3 md:col-span-2"><p-button label="Cancelar" severity="secondary" [outlined]="true" (onClick)="receiveVisible=false" /><p-button type="submit" label="Registrar ingreso" icon="pi pi-check" [loading]="saving()" /></div>
            </form>
        </p-dialog>
    `
})
export class IbcServicesComponent {
    readonly auth = inject(AuthService);
    private readonly service = inject(IbcService);
    private readonly messages = inject(MessageService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly fb = inject(FormBuilder);
    readonly rows = signal<IbcServiceCycle[]>([]);
    readonly total = signal(0);
    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly statuses = [{ label: 'Todos', value: '' }, { label: 'Pendientes', value: 'open' }, ...IBC_STATUSES];
    readonly state = ibcState;
    readonly days = ibcServiceDays;
    readonly modes = [{ label: 'Crear ficha de envase', value: 'new' }, { label: 'Usar envase existente', value: 'existing' }];
    readonly filters = this.fb.nonNullable.group({ search: '', status: 'open', companyId: '', chemicalId: '', dateFrom: '', dateTo: '' });
    readonly receiveForm = this.fb.nonNullable.group({ mode: 'new', containerId: '', originalNumber: ['', Validators.maxLength(80)], companyId: ['', Validators.required], chemicalId: ['', Validators.required], receivedAt: [new Date(), Validators.required], greEntry: '', purchaseOrder: '', notes: '' });
    params: IbcListParams = { first: 0, rows: 10, sortField: 'received_at', sortOrder: 1, status: 'open' };
    receiveVisible = false;
    receiveInvalid = false;
    private request = 0;
    private tableReady = false;

    constructor() {
        this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((query) => {
            const status = query.get('status');

            this.filters.reset({ search: query.get('search') ?? '', status: status !== null && this.statuses.some((option) => option.value === status) ? status : 'open', companyId: query.get('companyId') ?? '', chemicalId: query.get('chemicalId') ?? '', dateFrom: query.get('dateFrom') ?? '', dateTo: query.get('dateTo') ?? '' });
            this.params = { ...this.params, ...this.filters.getRawValue(), first: 0 };
            if (this.tableReady) void this.load();
        });
    }

    async load(event?: TableLazyLoadEvent): Promise<void> {
        if (this.params.dateFrom && this.params.dateTo && this.params.dateFrom > this.params.dateTo) {
            this.messages.add({ severity: 'warn', summary: 'Fechas', detail: 'La fecha inicial debe ser anterior a la final.' });

            return;
        }

        this.tableReady = true;
        this.params = { ...this.params, first: event?.first ?? this.params.first, rows: event?.rows ?? this.params.rows, sortField: typeof event?.sortField === 'string' ? event.sortField : this.params.sortField, sortOrder: event?.sortOrder === 1 ? 1 : event?.sortOrder === -1 ? -1 : this.params.sortOrder };
        const request = ++this.request;

        this.loading.set(true);

        try {
            const result = await this.service.listServices({ ...this.params });

            if (request !== this.request) return;
            this.rows.set(result.rows);
            this.total.set(result.total);
        } catch (error) { this.error(error); } finally { if (request === this.request) this.loading.set(false); }
    }

    filter(): void { this.params = { ...this.params, ...this.filters.getRawValue(), first: 0 }; void this.load(); }
    clear(): void { this.filters.reset(); this.filter(); }
    openReceive(): void { this.receiveForm.reset({ mode: 'new', receivedAt: new Date() }); this.receiveInvalid = false; this.receiveVisible = true; }

    async receive(): Promise<void> {
        this.receiveForm.markAllAsTouched();
        const data = this.receiveForm.getRawValue();

        this.receiveInvalid = this.receiveForm.invalid || (data.mode === 'existing' ? !data.containerId : !data.originalNumber.trim()) || !(data.receivedAt instanceof Date) || Number.isNaN(data.receivedAt.getTime());
        if (this.receiveInvalid || this.saving() || !this.auth.hasPermission('ibc.create')) return;
        this.saving.set(true);

        try {
            const id = await this.service.receive({ ...data, containerId: data.mode === 'existing' ? data.containerId : null });

            this.receiveVisible = false;
            await this.router.navigate(['/ibc/services', id]);
        } catch (error) { this.error(error); } finally { this.saving.set(false); }
    }

    private error(error: unknown): void { this.messages.add({ severity: 'error', summary: 'Control IBC', detail: ibcErrorMessage(error) }); }
}
