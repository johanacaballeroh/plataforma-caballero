import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { AuditAction, AuditLog, AuditLogsService, AuditUserOption } from './audit-logs.service';

interface AuditTableOption {
    label: string;
    value: string;
}

interface AuditDiff {
    field: string;
    oldValue: unknown;
    newValue: unknown;
}

@Component({
    selector: 'app-audit-logs',
    standalone: true,
    imports: [ButtonModule, CommonModule, DatePipe, DatePickerModule, DialogModule, InputTextModule, ReactiveFormsModule, SelectModule, TableModule, TagModule, ToastModule, ToolbarModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Administracion</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Logs de auditoria</h1>
                <p class="text-muted-color max-w-3xl">Revisa cambios registrados por tabla, usuario, accion y registro. Este modulo es solo lectura para administradores.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div class="card mb-0">
                    <div class="flex items-center justify-between gap-4">
                        <div>
                            <span class="block text-muted-color font-medium mb-2">Eventos filtrados</span>
                            <div class="text-surface-900 dark:text-surface-0 font-semibold text-2xl">{{ totalRecords() | number }}</div>
                        </div>
                        <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border w-12 h-12">
                            <i class="pi pi-history text-blue-500 text-xl"></i>
                        </div>
                    </div>
                </div>

                <div class="card mb-0">
                    <div class="flex items-center justify-between gap-4">
                        <div>
                            <span class="block text-muted-color font-medium mb-2">Inserciones visibles</span>
                            <div class="text-surface-900 dark:text-surface-0 font-semibold text-2xl">{{ visibleActionCount('insert') }}</div>
                        </div>
                        <div class="flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-border w-12 h-12">
                            <i class="pi pi-plus text-green-500 text-xl"></i>
                        </div>
                    </div>
                </div>

                <div class="card mb-0">
                    <div class="flex items-center justify-between gap-4">
                        <div>
                            <span class="block text-muted-color font-medium mb-2">Actualizaciones visibles</span>
                            <div class="text-surface-900 dark:text-surface-0 font-semibold text-2xl">{{ visibleActionCount('update') }}</div>
                        </div>
                        <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border w-12 h-12">
                            <i class="pi pi-pencil text-orange-500 text-xl"></i>
                        </div>
                    </div>
                </div>

                <div class="card mb-0">
                    <div class="flex items-center justify-between gap-4">
                        <div>
                            <span class="block text-muted-color font-medium mb-2">Tablas visibles</span>
                            <div class="text-surface-900 dark:text-surface-0 font-semibold text-2xl">{{ visibleTableCount() }}</div>
                        </div>
                        <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-border w-12 h-12">
                            <i class="pi pi-database text-purple-500 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            <p-toolbar>
                <ng-template #start>
                    <p-button label="Actualizar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="reload()" [loading]="loading()" />
                </ng-template>
                <ng-template #end>
                    <p-button label="Limpiar filtros" icon="pi pi-filter-slash" severity="secondary" [outlined]="true" (onClick)="clearFilters()" />
                </ng-template>
            </p-toolbar>

            <div class="card">
                <form [formGroup]="filtersForm" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 mb-5" (ngSubmit)="applyFilters()">
                    <div class="flex flex-col gap-2 xl:col-span-2">
                        <label for="search" class="font-medium">Buscar</label>
                        <input pInputText id="search" formControlName="search" placeholder="Tabla, accion o UUID de registro" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="actionFilter" class="font-medium">Accion</label>
                        <p-select inputId="actionFilter" formControlName="action" [options]="actionOptions" optionLabel="label" optionValue="value" placeholder="Todas" class="w-full" [showClear]="true" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="tableFilter" class="font-medium">Tabla</label>
                        <p-select inputId="tableFilter" formControlName="tableName" [options]="tableOptions()" optionLabel="label" optionValue="value" placeholder="Todas" class="w-full" [showClear]="true" [filter]="true" />
                    </div>

                    <div class="flex flex-col gap-2 xl:col-span-2">
                        <label for="userFilter" class="font-medium">Usuario</label>
                        <p-select inputId="userFilter" formControlName="userId" [options]="users()" optionLabel="email" optionValue="id" placeholder="Todos" class="w-full" [showClear]="true" [filter]="true" filterBy="full_name,email">
                            <ng-template #item let-user>
                                <div class="flex flex-col">
                                    <span class="font-medium">{{ user.full_name || user.email }}</span>
                                    <small class="text-muted-color">{{ user.email }}</small>
                                </div>
                            </ng-template>
                        </p-select>
                    </div>

                    <div class="flex flex-col gap-2 xl:col-span-2">
                        <label for="recordId" class="font-medium">Registro</label>
                        <input pInputText id="recordId" formControlName="recordId" placeholder="UUID del registro" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="dateFrom" class="font-medium">Desde</label>
                        <p-datepicker inputId="dateFrom" formControlName="dateFrom" dateFormat="dd/mm/yy" [showIcon]="true" [showButtonBar]="true" placeholder="dd/mm/aaaa" appendTo="body" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="dateTo" class="font-medium">Hasta</label>
                        <p-datepicker inputId="dateTo" formControlName="dateTo" dateFormat="dd/mm/yy" [showIcon]="true" [showButtonBar]="true" placeholder="dd/mm/aaaa" appendTo="body" />
                    </div>

                    <div class="md:col-span-2 xl:col-span-2 flex items-end justify-end gap-3">
                        <p-button type="submit" label="Filtrar" icon="pi pi-search" />
                    </div>
                </form>

                <p-table
                    [value]="logs()"
                    [lazy]="true"
                    (onLazyLoad)="loadLogs($event)"
                    [loading]="loading()"
                    [paginator]="true"
                    [rows]="15"
                    [totalRecords]="totalRecords()"
                    [rowsPerPageOptions]="[15, 30, 50]"
                    [rowHover]="true"
                    dataKey="id"
                    sortField="created_at"
                    [sortOrder]="-1"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} eventos"
                    [showCurrentPageReport]="true"
                    responsiveLayout="scroll"
                    [tableStyle]="{ 'min-width': '98rem' }"
                >
                    <ng-template #header>
                        <tr>
                            <th pSortableColumn="created_at" style="min-width: 12rem">Fecha <p-sortIcon field="created_at" /></th>
                            <th pSortableColumn="action" style="min-width: 10rem">Accion <p-sortIcon field="action" /></th>
                            <th pSortableColumn="table_name" style="min-width: 14rem">Tabla <p-sortIcon field="table_name" /></th>
                            <th style="min-width: 16rem">Usuario</th>
                            <th style="min-width: 18rem">Registro</th>
                            <th style="min-width: 18rem">Resumen</th>
                            <th style="width: 8rem"></th>
                        </tr>
                    </ng-template>

                    <ng-template #body let-log>
                        <tr>
                            <td>{{ log.created_at | date: 'dd/MM/yyyy HH:mm:ss' }}</td>
                            <td><p-tag [value]="actionLabel(log.action)" [severity]="actionSeverity(log.action)" /></td>
                            <td>
                                <div class="flex flex-col">
                                    <span class="font-medium text-surface-900 dark:text-surface-0">{{ tableLabel(log.table_name) }}</span>
                                    <small class="text-muted-color">{{ log.table_name }}</small>
                                </div>
                            </td>
                            <td>
                                <div class="flex flex-col">
                                    <span class="font-medium">{{ userLabel(log) }}</span>
                                    <small class="text-muted-color">{{ log.user?.email || log.user_id || '-' }}</small>
                                </div>
                            </td>
                            <td>
                                <span class="font-mono text-sm">{{ log.record_id || '-' }}</span>
                            </td>
                            <td>{{ changeSummary(log) }}</td>
                            <td>
                                <div class="flex justify-end">
                                    <p-button icon="pi pi-search" [rounded]="true" [outlined]="true" severity="secondary" (onClick)="openDetail(log)" />
                                </div>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="7">No se encontraron eventos de auditoria.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </div>

        <p-dialog header="Detalle de auditoria" [(visible)]="detailVisible" [modal]="true" [style]="{ width: 'min(980px, 95vw)' }" [draggable]="false">
            @if (selectedLog()) {
                <div class="flex flex-col gap-5">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1">
                            <span class="text-muted-color text-sm">Evento</span>
                            <div class="flex items-center gap-2">
                                <p-tag [value]="actionLabel(selectedLog()!.action)" [severity]="actionSeverity(selectedLog()!.action)" />
                                <span class="font-medium">{{ selectedLog()!.created_at | date: 'dd/MM/yyyy HH:mm:ss' }}</span>
                            </div>
                        </div>
                        <div class="flex flex-col gap-1">
                            <span class="text-muted-color text-sm">Tabla</span>
                            <span class="font-medium">{{ tableLabel(selectedLog()!.table_name) }} ({{ selectedLog()!.table_name }})</span>
                        </div>
                        <div class="flex flex-col gap-1">
                            <span class="text-muted-color text-sm">Usuario</span>
                            <span class="font-medium">{{ userLabel(selectedLog()!) }}</span>
                        </div>
                        <div class="flex flex-col gap-1">
                            <span class="text-muted-color text-sm">Registro</span>
                            <span class="font-mono text-sm">{{ selectedLog()!.record_id || '-' }}</span>
                        </div>
                    </div>

                    <p-table [value]="selectedDiff()" responsiveLayout="scroll" [tableStyle]="{ 'min-width': '58rem' }">
                        <ng-template #header>
                            <tr>
                                <th style="min-width: 14rem">Campo</th>
                                <th style="min-width: 20rem">Antes</th>
                                <th style="min-width: 20rem">Despues</th>
                            </tr>
                        </ng-template>

                        <ng-template #body let-diff>
                            <tr>
                                <td class="font-medium">{{ diff.field }}</td>
                                <td><code class="text-sm whitespace-pre-wrap break-all">{{ stringifyValue(diff.oldValue) }}</code></td>
                                <td><code class="text-sm whitespace-pre-wrap break-all">{{ stringifyValue(diff.newValue) }}</code></td>
                            </tr>
                        </ng-template>

                        <ng-template #emptymessage>
                            <tr>
                                <td colspan="3">No hay diferencias para mostrar.</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            }
        </p-dialog>
    `
})
export class AuditLogs implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly auditLogsService = inject(AuditLogsService);
    private readonly messageService = inject(MessageService);

    readonly logs = signal<AuditLog[]>([]);
    readonly users = signal<AuditUserOption[]>([]);
    readonly tableNames = signal<string[]>([]);
    readonly selectedLog = signal<AuditLog | null>(null);
    readonly totalRecords = signal(0);
    readonly loading = signal(false);
    detailVisible = false;

    private lastLazyEvent: TableLazyLoadEvent = { first: 0, rows: 15, sortField: 'created_at', sortOrder: -1 };

    readonly actionOptions: { label: string; value: AuditAction }[] = [
        { label: 'Creacion', value: 'insert' },
        { label: 'Actualizacion', value: 'update' },
        { label: 'Eliminacion', value: 'delete' }
    ];

    readonly tableOptions = computed<AuditTableOption[]>(() => {
        const knownTables = [
            'profiles',
            'user_roles',
            'user_companies',
            'roles',
            'role_permissions',
            'companies',
            'company_branches',
            'company_contacts',
            'units',
            'categories',
            'item_types',
            'basel_codes',
            'quantity_types',
            'document_types',
            'certificate_generation_types',
            'certificate_template_versions',
            'items',
            'certificates',
            'certificate_items',
            'certificate_documents',
            'certificate_files',
            'report_exports'
        ];

        return [...new Set([...knownTables, ...this.tableNames()])].map((tableName) => ({ label: this.tableLabel(tableName), value: tableName }));
    });

    readonly visibleTableCount = computed(() => new Set(this.logs().map((log) => log.table_name)).size);
    readonly selectedDiff = computed(() => {
        const log = this.selectedLog();

        return log ? this.diffLog(log) : [];
    });

    readonly filtersForm = this.fb.group({
        search: [''],
        action: [null as AuditAction | null],
        tableName: [null as string | null],
        userId: [null as string | null],
        recordId: [''],
        dateFrom: [null as Date | null],
        dateTo: [null as Date | null]
    });

    async ngOnInit(): Promise<void> {
        await Promise.all([this.loadUsers(), this.loadTableNames()]);
    }

    async loadLogs(event: TableLazyLoadEvent): Promise<void> {
        this.lastLazyEvent = event;
        this.loading.set(true);

        try {
            const result = await this.auditLogsService.listLogs({
                first: event.first ?? 0,
                rows: event.rows ?? 15,
                sortField: this.normalizeSortField(event.sortField),
                sortOrder: event.sortOrder === 1 ? 1 : -1,
                filters: this.getNormalizedFilters()
            });

            this.logs.set(result.logs);
            this.totalRecords.set(result.total);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los logs de auditoria.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }

    async reload(): Promise<void> {
        await Promise.all([this.loadLogs(this.lastLazyEvent), this.loadTableNames()]);
    }

    async applyFilters(): Promise<void> {
        const { dateFrom, dateTo } = this.filtersForm.getRawValue();

        if (dateFrom && dateTo && dateFrom > dateTo) {
            this.messageService.add({ severity: 'warn', summary: 'Fechas invalidas', detail: 'La fecha desde no puede ser mayor que la fecha hasta.', life: 3500 });

            return;
        }

        await this.loadLogs({ ...this.lastLazyEvent, first: 0 });
    }

    async clearFilters(): Promise<void> {
        this.filtersForm.reset({ search: '', action: null, tableName: null, userId: null, recordId: '', dateFrom: null, dateTo: null });
        await this.applyFilters();
    }

    openDetail(log: AuditLog): void {
        this.selectedLog.set(log);
        this.detailVisible = true;
    }

    visibleActionCount(action: AuditAction): number {
        return this.logs().filter((log) => log.action === action).length;
    }

    actionLabel(action: AuditAction): string {
        const labels: Record<AuditAction, string> = {
            insert: 'Creacion',
            update: 'Actualizacion',
            delete: 'Eliminacion'
        };

        return labels[action] ?? action;
    }

    actionSeverity(action: AuditAction): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const severities: Record<AuditAction, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
            insert: 'success',
            update: 'warn',
            delete: 'danger'
        };

        return severities[action] ?? 'secondary';
    }

    tableLabel(tableName: string): string {
        const labels: Record<string, string> = {
            profiles: 'Usuarios / perfiles',
            user_roles: 'Roles de usuario',
            user_companies: 'Empresas de usuario',
            roles: 'Roles',
            role_permissions: 'Permisos por rol',
            companies: 'Empresas',
            company_branches: 'Sedes de empresa',
            company_contacts: 'Contactos de empresa',
            units: 'Unidades',
            categories: 'Categorias',
            item_types: 'Tipos de items',
            basel_codes: 'Codigos Basilea',
            quantity_types: 'Tipos de cantidad',
            document_types: 'Tipos de documentos',
            certificate_generation_types: 'Tipos de generacion',
            certificate_template_versions: 'Plantillas PDF',
            items: 'Items',
            certificates: 'Certificados',
            certificate_items: 'Items de certificado',
            certificate_documents: 'Documentos de certificado',
            certificate_files: 'PDFs generados',
            report_exports: 'Exportaciones de reportes'
        };

        return labels[tableName] ?? tableName;
    }

    userLabel(log: AuditLog): string {
        return log.user?.full_name || log.user?.email || log.user_id || 'Sistema';
    }

    changeSummary(log: AuditLog): string {
        if (log.action === 'insert') {
            return `${Object.keys(log.new_data ?? {}).length} campo(s) registrados`;
        }

        if (log.action === 'delete') {
            return `${Object.keys(log.old_data ?? {}).length} campo(s) eliminados`;
        }

        const changed = this.diffLog(log).length;

        return changed === 1 ? '1 campo modificado' : `${changed} campos modificados`;
    }

    stringifyValue(value: unknown): string {
        if (value === null || value === undefined || value === '') {
            return '-';
        }

        if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
        }

        return String(value);
    }

    private async loadUsers(): Promise<void> {
        try {
            this.users.set(await this.auditLogsService.listUsers());
        } catch {
            this.messageService.add({ severity: 'warn', summary: 'Usuarios', detail: 'No se pudieron cargar usuarios para filtros.', life: 3500 });
        }
    }

    private async loadTableNames(): Promise<void> {
        try {
            this.tableNames.set(await this.auditLogsService.listTableNames());
        } catch {
            this.tableNames.set([]);
        }
    }

    private getNormalizedFilters() {
        const filters = this.filtersForm.getRawValue();

        return {
            search: filters.search?.trim() || null,
            action: filters.action,
            tableName: filters.tableName,
            userId: filters.userId,
            recordId: filters.recordId?.trim() || null,
            dateFrom: this.formatDateTime(filters.dateFrom, 'start'),
            dateTo: this.formatDateTime(filters.dateTo, 'end')
        };
    }

    private diffLog(log: AuditLog): AuditDiff[] {
        const oldData = log.old_data ?? {};
        const newData = log.new_data ?? {};
        const fields = [...new Set([...Object.keys(oldData), ...Object.keys(newData)])].filter((field) => field !== 'updated_at');

        return fields
            .filter((field) => JSON.stringify(oldData[field]) !== JSON.stringify(newData[field]))
            .map((field) => ({
                field,
                oldValue: oldData[field],
                newValue: newData[field]
            }));
    }

    private normalizeSortField(sortField: string | string[] | undefined | null): string {
        return Array.isArray(sortField) ? (sortField[0] ?? 'created_at') : (sortField ?? 'created_at');
    }

    private formatDateTime(value: Date | null | undefined, boundary: 'start' | 'end'): string | null {
        if (!value) {
            return null;
        }

        const date = new Date(value);

        if (boundary === 'start') {
            date.setHours(0, 0, 0, 0);
        } else {
            date.setHours(23, 59, 59, 999);
        }

        return date.toISOString();
    }
}
