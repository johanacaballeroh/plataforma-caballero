import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '@/app/core/auth/auth.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ManagedUnit, UnitsService, UnitStatus } from './units.service';

@Component({
    selector: 'app-units',
    standalone: true,
    imports: [ButtonModule, CommonModule, ConfirmDialogModule, DatePipe, InputTextModule, ReactiveFormsModule, RouterModule, SelectModule, TableModule, TagModule, ToastModule, ToolbarModule],
    providers: [ConfirmationService, MessageService],
    template: `
        <p-toast />
        <p-confirmdialog [style]="{ width: '450px' }" />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Catalogos</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Unidades</h1>
                <p class="text-muted-color max-w-3xl">Gestiona unidades de medida usadas por items y reportes.</p>
            </div>

            <p-toolbar>
                <ng-template #start>
                    <p-button label="Nueva unidad" icon="pi pi-plus" routerLink="/units/new" [disabled]="!auth.hasPermission('units.create')" />
                </ng-template>
                <ng-template #end>
                    <p-button label="Actualizar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="reload()" [loading]="loading()" />
                </ng-template>
            </p-toolbar>

            <div class="card">
                <form [formGroup]="filtersForm" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-5" (ngSubmit)="applyFilters()">
                    <div class="flex flex-col gap-2 xl:col-span-2">
                        <label for="search" class="font-medium">Buscar</label>
                        <input pInputText id="search" formControlName="search" placeholder="Codigo, nombre o abreviatura" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="statusFilter" class="font-medium">Estado</label>
                        <p-select inputId="statusFilter" formControlName="status" [options]="statusFilterOptions" optionLabel="label" optionValue="value" placeholder="Todos" class="w-full" [showClear]="true" />
                    </div>

                    <div class="flex items-end justify-end gap-3">
                        <p-button type="button" label="Limpiar" icon="pi pi-filter-slash" severity="secondary" [outlined]="true" (onClick)="clearFilters()" />
                        <p-button type="submit" label="Filtrar" icon="pi pi-search" />
                    </div>
                </form>

                <p-table
                    [value]="units()"
                    [lazy]="true"
                    (onLazyLoad)="loadUnits($event)"
                    [loading]="loading()"
                    [paginator]="true"
                    [rows]="10"
                    [totalRecords]="totalRecords()"
                    [rowsPerPageOptions]="[10, 20, 50]"
                    [rowHover]="true"
                    dataKey="id"
                    sortField="created_at"
                    [sortOrder]="-1"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} unidades"
                    [showCurrentPageReport]="true"
                    responsiveLayout="scroll"
                    [tableStyle]="{ 'min-width': '78rem' }"
                >
                    <ng-template #header>
                        <tr>
                            <th pSortableColumn="code" style="min-width: 12rem">Codigo <p-sortIcon field="code" /></th>
                            <th pSortableColumn="name" style="min-width: 18rem">Unidad <p-sortIcon field="name" /></th>
                            <th pSortableColumn="abbreviation" style="min-width: 12rem">Abreviatura <p-sortIcon field="abbreviation" /></th>
                            <th style="min-width: 12rem">Items</th>
                            <th pSortableColumn="status" style="min-width: 10rem">Estado <p-sortIcon field="status" /></th>
                            <th pSortableColumn="created_at" style="min-width: 12rem">Creacion <p-sortIcon field="created_at" /></th>
                            <th pSortableColumn="updated_at" style="min-width: 12rem">Actualizacion <p-sortIcon field="updated_at" /></th>
                            <th style="width: 12rem"></th>
                        </tr>
                    </ng-template>

                    <ng-template #body let-unit>
                        <tr>
                            <td>
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <i class="pi pi-sliders-h"></i>
                                    </div>
                                    <div>
                                        <div class="font-medium text-surface-900 dark:text-surface-0">{{ unit.code }}</div>
                                        <small class="text-muted-color">Catalogo units</small>
                                    </div>
                                </div>
                            </td>
                            <td>{{ unit.name }}</td>
                            <td>{{ unit.abbreviation || 'Sin abreviatura' }}</td>
                            <td>
                                <div class="flex flex-col gap-1">
                                    <span class="font-medium">{{ unit.items_count }}</span>
                                    <small class="text-muted-color">item(s) asociados</small>
                                </div>
                            </td>
                            <td><p-tag [value]="statusLabel(unit.status)" [severity]="unit.status === 'active' ? 'success' : 'danger'" /></td>
                            <td>{{ unit.created_at | date: 'dd/MM/yyyy HH:mm' }}</td>
                            <td>{{ unit.updated_at | date: 'dd/MM/yyyy HH:mm' }}</td>
                            <td>
                                <div class="flex justify-end gap-2">
                                    <p-button icon="pi pi-eye" [rounded]="true" [outlined]="true" severity="secondary" [routerLink]="['/units', unit.id]" />
                                    <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" [routerLink]="['/units', unit.id, 'edit']" [disabled]="!auth.hasPermission('units.update')" />
                                    <p-button
                                        [icon]="unit.status === 'active' ? 'pi pi-ban' : 'pi pi-check'"
                                        [rounded]="true"
                                        [outlined]="true"
                                        [severity]="unit.status === 'active' ? 'danger' : 'success'"
                                        (onClick)="confirmStatusChange(unit)"
                                        [disabled]="!auth.hasPermission('units.update')"
                                    />
                                    <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (onClick)="confirmDelete(unit)" [disabled]="unit.items_count > 0 || !auth.hasPermission('units.delete')" />
                                </div>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="8">No se encontraron unidades.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </div>
    `
})
export class Units {
    readonly auth = inject(AuthService);
    private readonly fb = inject(FormBuilder);
    private readonly unitsService = inject(UnitsService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);

    readonly units = signal<ManagedUnit[]>([]);
    readonly totalRecords = signal(0);
    readonly loading = signal(false);

    private lastLazyEvent: TableLazyLoadEvent = { first: 0, rows: 10, sortField: 'created_at', sortOrder: -1 };

    readonly statusFilterOptions: { label: string; value: UnitStatus }[] = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' }
    ];

    readonly filtersForm = this.fb.group({
        search: [''],
        status: [null as UnitStatus | null]
    });

    async loadUnits(event: TableLazyLoadEvent): Promise<void> {
        this.lastLazyEvent = event;
        this.loading.set(true);

        try {
            const result = await this.unitsService.listUnits({
                first: event.first ?? 0,
                rows: event.rows ?? 10,
                sortField: this.normalizeSortField(event.sortField),
                sortOrder: event.sortOrder === 1 ? 1 : -1,
                filters: this.filtersForm.getRawValue()
            });

            this.units.set(result.units);
            this.totalRecords.set(result.total);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el listado de unidades.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }

    async reload(): Promise<void> {
        await this.loadUnits(this.lastLazyEvent);
    }

    async applyFilters(): Promise<void> {
        await this.loadUnits({ ...this.lastLazyEvent, first: 0 });
    }

    async clearFilters(): Promise<void> {
        this.filtersForm.reset({ search: '', status: null });
        await this.applyFilters();
    }

    confirmStatusChange(unit: ManagedUnit): void {
        const nextStatus: UnitStatus = unit.status === 'active' ? 'inactive' : 'active';
        const action = nextStatus === 'inactive' ? 'inactivar' : 'activar';

        this.confirmationService.confirm({
            message: `Deseas ${action} la unidad ${unit.code}?`,
            header: 'Confirmar cambio de estado',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Confirmar',
            rejectLabel: 'Cancelar',
            accept: () => {
                void this.changeStatus(unit, nextStatus);
            }
        });
    }

    async changeStatus(unit: ManagedUnit, status: UnitStatus): Promise<void> {
        try {
            await this.unitsService.updateStatus(unit.id, status);
            this.messageService.add({ severity: 'success', summary: 'Estado actualizado', detail: `${unit.code} ahora esta ${this.statusLabel(status).toLowerCase()}.`, life: 3000 });
            await this.reload();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado de la unidad.', life: 3500 });
        }
    }

    confirmDelete(unit: ManagedUnit): void {
        this.confirmationService.confirm({
            message: `Deseas eliminar la unidad ${unit.code}? Esta accion no se permite si ya tiene items asociados.`,
            header: 'Eliminar unidad',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                void this.deleteUnit(unit);
            }
        });
    }

    async deleteUnit(unit: ManagedUnit): Promise<void> {
        try {
            await this.unitsService.deleteUnit(unit);
            this.messageService.add({ severity: 'success', summary: 'Unidad eliminada', detail: 'La unidad fue eliminada correctamente.', life: 3000 });
            await this.reload();
        } catch (error) {
            const detail = error instanceof Error ? error.message : 'No se pudo eliminar la unidad.';

            this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 4000 });
        }
    }

    statusLabel(status: UnitStatus): string {
        return status === 'active' ? 'Activo' : 'Inactivo';
    }

    private normalizeSortField(sortField: string | string[] | undefined | null): string {
        return Array.isArray(sortField) ? (sortField[0] ?? 'created_at') : (sortField ?? 'created_at');
    }
}
