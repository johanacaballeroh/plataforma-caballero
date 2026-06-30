import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
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
import { ItemFormOptions, ItemsService, ItemStatus, ManagedItem } from './items.service';

@Component({
    selector: 'app-items',
    standalone: true,
    imports: [ButtonModule, CommonModule, ConfirmDialogModule, DatePipe, InputTextModule, ReactiveFormsModule, RouterModule, SelectModule, TableModule, TagModule, ToastModule, ToolbarModule],
    providers: [ConfirmationService, MessageService],
    template: `
        <p-toast />
        <p-confirmdialog [style]="{ width: '450px' }" />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Operacion</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Items</h1>
                <p class="text-muted-color max-w-3xl">Gestiona items valorizables o residuos que pueden asociarse a certificados.</p>
            </div>

            <p-toolbar>
                <ng-template #start>
                    <p-button label="Nuevo item" icon="pi pi-plus" routerLink="/items/new" [disabled]="!auth.hasPermission('items.create')" />
                </ng-template>
                <ng-template #end>
                    <p-button label="Actualizar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="reload()" [loading]="loading()" />
                </ng-template>
            </p-toolbar>

            <div class="card">
                <form [formGroup]="filtersForm" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 mb-5" (ngSubmit)="applyFilters()">
                    <div class="flex flex-col gap-2 xl:col-span-2">
                        <label for="search" class="font-medium">Buscar</label>
                        <input pInputText id="search" formControlName="search" placeholder="Codigo, nombre o descripcion" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="statusFilter" class="font-medium">Estado</label>
                        <p-select inputId="statusFilter" formControlName="status" [options]="statusFilterOptions" optionLabel="label" optionValue="value" placeholder="Todos" class="w-full" [showClear]="true" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="unitFilter" class="font-medium">Unidad</label>
                        <p-select inputId="unitFilter" formControlName="unitId" [options]="options().units" optionLabel="name" optionValue="id" placeholder="Todas" class="w-full" [showClear]="true" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="categoryFilter" class="font-medium">Categoria</label>
                        <p-select inputId="categoryFilter" formControlName="categoryId" [options]="options().categories" optionLabel="name" optionValue="id" placeholder="Todas" class="w-full" [showClear]="true" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="itemTypeFilter" class="font-medium">Tipo</label>
                        <p-select inputId="itemTypeFilter" formControlName="itemTypeId" [options]="options().itemTypes" optionLabel="name" optionValue="id" placeholder="Todos" class="w-full" [showClear]="true" />
                    </div>

                    <div class="flex flex-col gap-2 xl:col-span-2">
                        <label for="baselCodeFilter" class="font-medium">Codigo Basilea</label>
                        <p-select inputId="baselCodeFilter" formControlName="baselCodeId" [options]="options().baselCodes" optionLabel="code" optionValue="id" placeholder="Todos" class="w-full" [showClear]="true" />
                    </div>

                    <div class="md:col-span-2 xl:col-span-4 flex items-end justify-end gap-3">
                        <p-button type="button" label="Limpiar" icon="pi pi-filter-slash" severity="secondary" [outlined]="true" (onClick)="clearFilters()" />
                        <p-button type="submit" label="Filtrar" icon="pi pi-search" />
                    </div>
                </form>

                <p-table
                    [value]="items()"
                    [lazy]="true"
                    (onLazyLoad)="loadItems($event)"
                    [loading]="loading()"
                    [paginator]="true"
                    [rows]="10"
                    [totalRecords]="totalRecords()"
                    [rowsPerPageOptions]="[10, 20, 50]"
                    [rowHover]="true"
                    dataKey="id"
                    sortField="created_at"
                    [sortOrder]="-1"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} items"
                    [showCurrentPageReport]="true"
                    responsiveLayout="scroll"
                    [tableStyle]="{ 'min-width': '96rem' }"
                >
                    <ng-template #header>
                        <tr>
                            <th pSortableColumn="code" style="min-width: 12rem">Codigo <p-sortIcon field="code" /></th>
                            <th pSortableColumn="name" style="min-width: 18rem">Item <p-sortIcon field="name" /></th>
                            <th style="min-width: 14rem">Unidad</th>
                            <th style="min-width: 14rem">Categoria</th>
                            <th style="min-width: 14rem">Tipo</th>
                            <th style="min-width: 12rem">Basilea</th>
                            <th style="min-width: 10rem">Certificados</th>
                            <th pSortableColumn="status" style="min-width: 10rem">Estado <p-sortIcon field="status" /></th>
                            <th pSortableColumn="created_at" style="min-width: 12rem">Creacion <p-sortIcon field="created_at" /></th>
                            <th style="width: 12rem"></th>
                        </tr>
                    </ng-template>

                    <ng-template #body let-item>
                        <tr>
                            <td>
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <i class="pi pi-box"></i>
                                    </div>
                                    <div>
                                        <div class="font-medium text-surface-900 dark:text-surface-0">{{ item.code }}</div>
                                        <small class="text-muted-color">Catalogo items</small>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="flex flex-col gap-1">
                                    <span class="font-medium">{{ item.name }}</span>
                                    <small class="text-muted-color">{{ item.description || 'Sin descripcion' }}</small>
                                </div>
                            </td>
                            <td>{{ item.unit?.name || 'Sin unidad' }}</td>
                            <td>{{ item.category?.name || 'Sin categoria' }}</td>
                            <td>{{ item.item_type?.name || 'Sin tipo' }}</td>
                            <td>{{ item.basel_code?.code || 'Sin codigo' }}</td>
                            <td>{{ item.certificate_items_count }}</td>
                            <td><p-tag [value]="statusLabel(item.status)" [severity]="item.status === 'active' ? 'success' : 'danger'" /></td>
                            <td>{{ item.created_at | date: 'dd/MM/yyyy HH:mm' }}</td>
                            <td>
                                <div class="flex justify-end gap-2">
                                    <p-button icon="pi pi-eye" [rounded]="true" [outlined]="true" severity="secondary" [routerLink]="['/items', item.id]" />
                                    <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" [routerLink]="['/items', item.id, 'edit']" [disabled]="!auth.hasPermission('items.update')" />
                                    <p-button
                                        [icon]="item.status === 'active' ? 'pi pi-ban' : 'pi pi-check'"
                                        [rounded]="true"
                                        [outlined]="true"
                                        [severity]="item.status === 'active' ? 'danger' : 'success'"
                                        (onClick)="confirmStatusChange(item)"
                                        [disabled]="!auth.hasPermission('items.update')"
                                    />
                                    <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (onClick)="confirmDelete(item)" [disabled]="item.certificate_items_count > 0 || !auth.hasPermission('items.delete')" />
                                </div>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="10">No se encontraron items.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </div>
    `
})
export class Items implements OnInit {
    readonly auth = inject(AuthService);
    private readonly fb = inject(FormBuilder);
    private readonly itemsService = inject(ItemsService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);

    readonly items = signal<ManagedItem[]>([]);
    readonly options = signal<ItemFormOptions>({ units: [], categories: [], itemTypes: [], baselCodes: [] });
    readonly totalRecords = signal(0);
    readonly loading = signal(false);

    private lastLazyEvent: TableLazyLoadEvent = { first: 0, rows: 10, sortField: 'created_at', sortOrder: -1 };

    readonly statusFilterOptions: { label: string; value: ItemStatus }[] = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' }
    ];

    readonly filtersForm = this.fb.group({
        search: [''],
        status: [null as ItemStatus | null],
        unitId: [null as string | null],
        categoryId: [null as string | null],
        itemTypeId: [null as string | null],
        baselCodeId: [null as string | null]
    });

    async ngOnInit(): Promise<void> {
        await this.loadOptions();
    }

    async loadItems(event: TableLazyLoadEvent): Promise<void> {
        this.lastLazyEvent = event;
        this.loading.set(true);

        try {
            const result = await this.itemsService.listItems({
                first: event.first ?? 0,
                rows: event.rows ?? 10,
                sortField: this.normalizeSortField(event.sortField),
                sortOrder: event.sortOrder === 1 ? 1 : -1,
                filters: this.filtersForm.getRawValue()
            });

            this.items.set(result.items);
            this.totalRecords.set(result.total);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el listado de items.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }

    async reload(): Promise<void> {
        await this.loadItems(this.lastLazyEvent);
    }

    async applyFilters(): Promise<void> {
        await this.loadItems({ ...this.lastLazyEvent, first: 0 });
    }

    async clearFilters(): Promise<void> {
        this.filtersForm.reset({ search: '', status: null, unitId: null, categoryId: null, itemTypeId: null, baselCodeId: null });
        await this.applyFilters();
    }

    confirmStatusChange(item: ManagedItem): void {
        const nextStatus: ItemStatus = item.status === 'active' ? 'inactive' : 'active';
        const action = nextStatus === 'inactive' ? 'inactivar' : 'activar';

        this.confirmationService.confirm({
            message: `Deseas ${action} el item ${item.code}?`,
            header: 'Confirmar cambio de estado',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Confirmar',
            rejectLabel: 'Cancelar',
            accept: () => {
                void this.changeStatus(item, nextStatus);
            }
        });
    }

    async changeStatus(item: ManagedItem, status: ItemStatus): Promise<void> {
        try {
            await this.itemsService.updateStatus(item.id, status);
            this.messageService.add({ severity: 'success', summary: 'Estado actualizado', detail: `${item.code} ahora esta ${this.statusLabel(status).toLowerCase()}.`, life: 3000 });
            await this.reload();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado del item.', life: 3500 });
        }
    }

    confirmDelete(item: ManagedItem): void {
        this.confirmationService.confirm({
            message: `Deseas eliminar el item ${item.code}? Esta accion no se permite si ya esta usado en certificados.`,
            header: 'Eliminar item',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                void this.deleteItem(item);
            }
        });
    }

    async deleteItem(item: ManagedItem): Promise<void> {
        try {
            await this.itemsService.deleteItem(item);
            this.messageService.add({ severity: 'success', summary: 'Item eliminado', detail: 'El item fue eliminado correctamente.', life: 3000 });
            await this.reload();
        } catch (error) {
            const detail = error instanceof Error ? error.message : 'No se pudo eliminar el item.';
            this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 4000 });
        }
    }

    statusLabel(status: ItemStatus): string {
        return status === 'active' ? 'Activo' : 'Inactivo';
    }

    private async loadOptions(): Promise<void> {
        try {
            this.options.set(await this.itemsService.getFormOptions());
        } catch {
            this.messageService.add({ severity: 'warn', summary: 'Catalogos', detail: 'No se pudieron cargar catalogos para filtros.', life: 3500 });
        }
    }

    private normalizeSortField(sortField: string | string[] | undefined | null): string {
        return Array.isArray(sortField) ? (sortField[0] ?? 'created_at') : (sortField ?? 'created_at');
    }
}
