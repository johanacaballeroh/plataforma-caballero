import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '@/app/core/auth/auth.service';
import { IbcListParams, IbcRegistryRow, IbcServiceCycle, ibcErrorMessage, ibcState } from './ibc.models';
import { IbcService } from './ibc.service';

@Component({
    selector: 'app-ibc-registry',
    imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonModule, DialogModule, InputTextModule, SelectModule, TableModule, TagModule, TextareaModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />
        <div class="flex flex-col gap-6">
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div><span class="text-sm font-medium text-primary">Control IBC</span><h1 class="text-3xl font-semibold mt-2">{{ chemical ? 'Químicos' : 'Envases IBC' }}</h1>
                    <p class="text-muted-color">{{ chemical ? 'Mantén los químicos disponibles para registrar nuevos ingresos.' : 'Consulta cada envase y conserva su historial entre servicios.' }}</p></div>
                @if (can('create')) { <p-button [label]="chemical ? 'Nuevo químico' : 'Nuevo envase'" icon="pi pi-plus" (onClick)="open(null, false)" /> }
            </div>
            <div class="card">
                <form [formGroup]="filters" (ngSubmit)="filter()" class="flex flex-wrap items-end gap-4 mb-6">
                    <div class="flex flex-col gap-2 grow"><label for="ibc-registry-search">Buscar</label><input pInputText id="ibc-registry-search" formControlName="search" [placeholder]="chemical ? 'Nombre del químico' : 'Código o número original'" /></div>
                    <div class="flex flex-col gap-2"><label for="ibc-registry-status">Estado</label><p-select inputId="ibc-registry-status" formControlName="status" [options]="statuses" optionLabel="label" optionValue="value" placeholder="Todos" [showClear]="true" /></div>
                    <p-button type="submit" label="Filtrar" icon="pi pi-search" />
                    <p-button label="Limpiar" severity="secondary" [outlined]="true" (onClick)="clear()" />
                </form>
                <p-table [value]="rows()" [lazy]="true" (onLazyLoad)="load($event)" [loading]="loading()" [paginator]="true" [first]="params.first" [rows]="params.rows" [totalRecords]="total()" [rowsPerPageOptions]="[10,20,50]" dataKey="id" sortField="created_at" [sortOrder]="-1" [tableStyle]="{'min-width':'48rem'}">
                    <ng-template #header><tr>
                        @if (!chemical) { <th pSortableColumn="code">Código <p-sortIcon field="code" /></th> }
                        <th [pSortableColumn]="chemical ? 'name' : 'original_number'">{{ chemical ? 'Nombre' : 'Número original' }} <p-sortIcon [field]="chemical ? 'name' : 'original_number'" /></th>
                        @if (!chemical) { <th pSortableColumn="cycle_count">Servicios <p-sortIcon field="cycle_count" /></th><th pSortableColumn="wash_count">Lavados registrados <p-sortIcon field="wash_count" /></th> }
                        <th pSortableColumn="status">Estado <p-sortIcon field="status" /></th><th>Acciones</th>
                    </tr></ng-template>
                    <ng-template #body let-row><tr>
                        @if (!chemical) { <td class="font-medium">{{ row.code }}</td> }
                        <td>{{ chemical ? row.name : row.original_number }}</td>
                        @if (!chemical) { <td>{{ row.cycle_count }}</td><td>{{ row.wash_count }}</td> }
                        <td><p-tag [value]="row.status === 'active' ? 'Activo' : 'Inactivo'" [severity]="row.status === 'active' ? 'success' : 'secondary'" /></td>
                        <td><div class="flex gap-2"><p-button label="Ver" icon="pi pi-eye" [text]="true" (onClick)="open(row, true)" />
                            @if (can('update')) { <p-button label="Editar" icon="pi pi-pencil" [text]="true" (onClick)="open(row, false)" /> }
                        </div></td>
                    </tr></ng-template>
                    <ng-template #emptymessage><tr><td [attr.colspan]="chemical ? 3 : 6">No hay registros para estos filtros.</td></tr></ng-template>
                </p-table>
            </div>
        </div>
        <p-dialog [(visible)]="visible" [modal]="true" [header]="readonly ? 'Detalle' : selected ? 'Editar registro' : 'Nuevo registro'" [style]="{width:'54rem',maxWidth:'95vw'}">
            <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-5 pt-2">
                @if (selected?.code) { <p class="text-primary font-semibold">{{ selected?.code }}</p> }
                <div class="flex flex-col gap-2"><label for="ibc-identity">{{ chemical ? 'Nombre del químico' : 'Número original del envase' }}</label><input pInputText id="ibc-identity" formControlName="identity" [attr.maxlength]="chemical ? 160 : 80" /></div>
                <div class="flex flex-col gap-2"><label for="ibc-description">{{ chemical ? 'Descripción' : 'Observaciones' }}</label><textarea pTextarea id="ibc-description" rows="3" formControlName="description"></textarea></div>
                <div class="flex flex-col gap-2"><label for="ibc-status">Estado</label><p-select inputId="ibc-status" formControlName="status" [options]="statuses" optionLabel="label" optionValue="value" appendTo="body" /></div>
                @if (selected) { <p class="text-sm text-muted-color">Creado: {{ selected.created_at | date:'dd/MM/yyyy HH:mm' }} · Actualizado: {{ selected.updated_at | date:'dd/MM/yyyy HH:mm' }}</p> }
                @if (form.invalid && form.touched && !readonly) { <p class="text-red-500" role="alert">Completa el nombre o número, respetando su longitud máxima.</p> }
                <div class="flex justify-end gap-3"><p-button label="Cerrar" severity="secondary" [outlined]="true" (onClick)="visible=false" />
                    @if (!readonly) { <p-button label="Guardar" type="submit" icon="pi pi-check" [loading]="saving()" /> }
                </div>
            </form>
            @if (!chemical && selected) {
                <h2 class="text-xl font-semibold mt-6 mb-3">Historial de servicios</h2>
                <p-table [value]="history()" [lazy]="true" [lazyLoadOnInit]="false" (onLazyLoad)="loadHistory($event)" [loading]="historyLoading()" [paginator]="true" [first]="historyParams.first" [rows]="historyParams.rows" [totalRecords]="historyTotal()" [sortField]="historyParams.sortField" [sortOrder]="historyParams.sortOrder" [tableStyle]="{'min-width':'35rem'}">
                    <ng-template #header><tr><th pSortableColumn="received_at">Ingreso <p-sortIcon field="received_at" /></th><th>Empresa / químico</th><th pSortableColumn="status">Estado <p-sortIcon field="status" /></th><th>Detalle</th></tr></ng-template>
                    <ng-template #body let-cycle><tr><td>{{ cycle.received_at | date:'dd/MM/yyyy' }}</td><td>{{ cycle.company_name }}<br /><span class="text-muted-color">{{ cycle.chemical_name }}</span></td><td><p-tag [value]="state(cycle.status).label" [severity]="state(cycle.status).severity" /></td><td><p-button icon="pi pi-arrow-right" ariaLabel="Abrir servicio" [routerLink]="['/ibc/services',cycle.id]" [text]="true" /></td></tr></ng-template>
                    <ng-template #emptymessage>
                        @if (!historyLoading()) {
                            <tr><td colspan="4">{{ historyFailed() ? 'No se pudo cargar el historial de este envase.' : 'Este envase todavía no tiene servicios.' }}</td></tr>
                        }
                    </ng-template>
                </p-table>
            }
        </p-dialog>
    `
})
export class IbcRegistryComponent {
    private readonly service = inject(IbcService);
    private readonly route = inject(ActivatedRoute);
    private readonly messages = inject(MessageService);
    private readonly fb = inject(FormBuilder);
    readonly auth = inject(AuthService);
    readonly chemical = this.route.snapshot.data['registry'] === 'chemicals';
    readonly rows = signal<IbcRegistryRow[]>([]);
    readonly history = signal<IbcServiceCycle[]>([]);
    readonly total = signal(0);
    readonly historyTotal = signal(0);
    readonly loading = signal(false);
    readonly historyLoading = signal(false);
    readonly historyFailed = signal(false);
    readonly saving = signal(false);
    readonly state = ibcState;
    readonly statuses = [{ label: 'Activo', value: 'active' }, { label: 'Inactivo', value: 'inactive' }];
    readonly filters = this.fb.nonNullable.group({ search: '', status: '' });
    readonly form = this.fb.nonNullable.group({ identity: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(this.chemical ? 160 : 80)]], description: '', status: ['active', Validators.required] });
    params: IbcListParams = { first: 0, rows: 10, sortField: 'created_at', sortOrder: -1 };
    historyParams: IbcListParams = { first: 0, rows: 10, sortField: 'received_at', sortOrder: -1 };
    visible = false;
    readonly = false;
    selected: IbcRegistryRow | null = null;
    private request = 0;
    private historyRequest = 0;

    constructor() {
        const id = this.route.snapshot.paramMap.get('id');

        if (id) void this.openById(id);
    }

    can(action: string): boolean { return this.auth.hasPermission(`${this.chemical ? 'ibc_chemicals' : 'ibc'}.${action}`); }

    async load(event?: TableLazyLoadEvent): Promise<void> {
        this.params = { ...this.params, ...this.filters.getRawValue(), first: event?.first ?? this.params.first, rows: event?.rows ?? this.params.rows, sortField: typeof event?.sortField === 'string' ? event.sortField : this.params.sortField, sortOrder: event?.sortOrder === 1 ? 1 : event?.sortOrder === -1 ? -1 : this.params.sortOrder };
        const request = ++this.request;

        this.loading.set(true);

        try {
            const result = await this.service.listRegistry(this.chemical, this.params);

            if (request !== this.request) return;
            this.rows.set(result.rows);
            this.total.set(result.total);
        } catch (error) { this.error(error); } finally { if (request === this.request) this.loading.set(false); }
    }

    filter(): void { this.params.first = 0; void this.load(); }
    clear(): void { this.filters.reset(); this.filter(); }

    open(row: IbcRegistryRow | null, readonly: boolean): void {
        this.selected = row;
        this.readonly = readonly;
        this.form.reset({ identity: (this.chemical ? row?.name : row?.original_number) ?? '', description: (this.chemical ? row?.description : row?.notes) ?? '', status: row?.status ?? 'active' });
        if (readonly) this.form.disable(); else this.form.enable();
        this.history.set([]);
        this.historyTotal.set(0);
        this.historyLoading.set(false);
        this.historyFailed.set(false);
        this.historyParams = { first: 0, rows: 10, sortField: 'received_at', sortOrder: -1 };
        this.historyRequest++;
        this.visible = true;

        if (!this.chemical && row) void this.loadHistory();
    }

    private async openById(id: string): Promise<void> {
        try { this.open(await this.service.getRegistry(this.chemical, id), true); } catch (error) { this.error(error); }
    }

    async loadHistory(event?: TableLazyLoadEvent): Promise<void> {
        if (this.chemical || !this.visible || !this.selected) return;

        const request = ++this.historyRequest;
        const { first, rows, sortField, sortOrder } = this.historyParams;

        this.historyParams = {
            first: event?.first ?? first,
            rows: event?.rows ?? rows,
            sortField: typeof event?.sortField === 'string' ? event.sortField : sortField,
            sortOrder: event?.sortOrder === 1 || event?.sortOrder === -1 ? event.sortOrder : sortOrder
        };
        this.historyLoading.set(true);
        this.historyFailed.set(false);

        try {
            const result = await this.service.listServices({ ...this.historyParams, containerId: this.selected.id });

            if (request !== this.historyRequest || !this.visible) return;
            this.history.set(result.rows);
            this.historyTotal.set(result.total);
        } catch (error) {
            if (request !== this.historyRequest || !this.visible) return;
            this.historyFailed.set(true);
            this.history.set([]);
            this.error(error);
        } finally {
            if (request === this.historyRequest) this.historyLoading.set(false);
        }
    }

    async save(): Promise<void> {
        this.form.markAllAsTouched();
        if (this.form.invalid || this.readonly || this.saving() || !this.can(this.selected ? 'update' : 'create')) return;
        this.saving.set(true);

        try {
            await this.service.saveRegistry(this.chemical, this.selected?.id ?? null, this.form.getRawValue());
            this.visible = false;
            this.messages.add({ severity: 'success', summary: 'Guardado', detail: 'El registro se guardó correctamente.' });
            await this.load();
        } catch (error) { this.error(error); } finally { this.saving.set(false); }
    }

    private error(error: unknown): void { this.messages.add({ severity: 'error', summary: 'Control IBC', detail: ibcErrorMessage(error) }); }
}
