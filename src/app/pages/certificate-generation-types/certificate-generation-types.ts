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
import { CertificateGenerationTypesService, CertificateGenerationTypeStatus, ManagedCertificateGenerationType } from './certificate-generation-types.service';

@Component({
    selector: 'app-certificate-generation-types',
    standalone: true,
    imports: [ButtonModule, CommonModule, ConfirmDialogModule, DatePipe, InputTextModule, ReactiveFormsModule, RouterModule, SelectModule, TableModule, TagModule, ToastModule, ToolbarModule],
    providers: [ConfirmationService, MessageService],
    template: `
        <p-toast />
        <p-confirmdialog [style]="{ width: '450px' }" />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Catalogos</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Tipos de generacion</h1>
                <p class="text-muted-color max-w-3xl">Gestiona tipos de generacion de certificado y reglas asociadas a campos de destino.</p>
            </div>

            <p-toolbar>
                <ng-template #start>
                    <p-button label="Nuevo tipo" icon="pi pi-plus" routerLink="/certificate-generation-types/new" [disabled]="!auth.hasPermission('certificate_generation_types.create')" />
                </ng-template>
                <ng-template #end>
                    <p-button label="Actualizar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="reload()" [loading]="loading()" />
                </ng-template>
            </p-toolbar>

            <div class="card">
                <form [formGroup]="filtersForm" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 mb-5" (ngSubmit)="applyFilters()">
                    <div class="flex flex-col gap-2 xl:col-span-2">
                        <label for="search" class="font-medium">Buscar</label>
                        <input pInputText id="search" formControlName="search" placeholder="Nombre o descripcion" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="statusFilter" class="font-medium">Estado</label>
                        <p-select inputId="statusFilter" formControlName="status" [options]="statusFilterOptions" optionLabel="label" optionValue="value" placeholder="Todos" class="w-full" [showClear]="true" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="finalDestinationFilter" class="font-medium">Destino final</label>
                        <p-select inputId="finalDestinationFilter" formControlName="showFinalDestinationCompany" [options]="booleanFilterOptions" optionLabel="label" optionValue="value" placeholder="Todos" class="w-full" [showClear]="true" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="destinationPlaceFilter" class="font-medium">Lugar destino</label>
                        <p-select inputId="destinationPlaceFilter" formControlName="showDestinationPlace" [options]="booleanFilterOptions" optionLabel="label" optionValue="value" placeholder="Todos" class="w-full" [showClear]="true" />
                    </div>

                    <div class="flex items-end justify-end gap-3">
                        <p-button type="button" label="Limpiar" icon="pi pi-filter-slash" severity="secondary" [outlined]="true" (onClick)="clearFilters()" />
                        <p-button type="submit" label="Filtrar" icon="pi pi-search" />
                    </div>
                </form>

                <p-table
                    [value]="generationTypes()"
                    [lazy]="true"
                    (onLazyLoad)="loadGenerationTypes($event)"
                    [loading]="loading()"
                    [paginator]="true"
                    [rows]="10"
                    [totalRecords]="totalRecords()"
                    [rowsPerPageOptions]="[10, 20, 50]"
                    [rowHover]="true"
                    dataKey="id"
                    sortField="created_at"
                    [sortOrder]="-1"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} tipos"
                    [showCurrentPageReport]="true"
                    responsiveLayout="scroll"
                    [tableStyle]="{ 'min-width': '86rem' }"
                >
                    <ng-template #header>
                        <tr>
                            <th pSortableColumn="name" style="min-width: 18rem">Tipo de generacion <p-sortIcon field="name" /></th>
                            <th style="min-width: 18rem">Descripcion</th>
                            <th pSortableColumn="show_final_destination_company" style="min-width: 12rem">Destino final <p-sortIcon field="show_final_destination_company" /></th>
                            <th pSortableColumn="show_destination_place" style="min-width: 12rem">Lugar destino <p-sortIcon field="show_destination_place" /></th>
                            <th style="min-width: 10rem">Certificados</th>
                            <th style="min-width: 10rem">Plantillas</th>
                            <th pSortableColumn="status" style="min-width: 10rem">Estado <p-sortIcon field="status" /></th>
                            <th pSortableColumn="created_at" style="min-width: 12rem">Creacion <p-sortIcon field="created_at" /></th>
                            <th style="width: 12rem"></th>
                        </tr>
                    </ng-template>

                    <ng-template #body let-generationType>
                        <tr>
                            <td>
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <i class="pi pi-file-edit"></i>
                                    </div>
                                    <div>
                                        <div class="font-medium text-surface-900 dark:text-surface-0">{{ generationType.name }}</div>
                                        <small class="text-muted-color">certificate_generation_types</small>
                                    </div>
                                </div>
                            </td>
                            <td>{{ generationType.description || 'Sin descripcion' }}</td>
                            <td><p-tag [value]="generationType.show_final_destination_company ? 'Visible' : 'Oculto'" [severity]="generationType.show_final_destination_company ? 'info' : 'secondary'" /></td>
                            <td><p-tag [value]="generationType.show_destination_place ? 'Visible' : 'Oculto'" [severity]="generationType.show_destination_place ? 'info' : 'secondary'" /></td>
                            <td>{{ generationType.certificates_count }}</td>
                            <td>{{ generationType.templates_count }}</td>
                            <td><p-tag [value]="statusLabel(generationType.status)" [severity]="generationType.status === 'active' ? 'success' : 'danger'" /></td>
                            <td>{{ generationType.created_at | date: 'dd/MM/yyyy HH:mm' }}</td>
                            <td>
                                <div class="flex justify-end gap-2">
                                    <p-button icon="pi pi-eye" [rounded]="true" [outlined]="true" severity="secondary" [routerLink]="['/certificate-generation-types', generationType.id]" />
                                    <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" [routerLink]="['/certificate-generation-types', generationType.id, 'edit']" [disabled]="!auth.hasPermission('certificate_generation_types.update')" />
                                    <p-button
                                        [icon]="generationType.status === 'active' ? 'pi pi-ban' : 'pi pi-check'"
                                        [rounded]="true"
                                        [outlined]="true"
                                        [severity]="generationType.status === 'active' ? 'danger' : 'success'"
                                        (onClick)="confirmStatusChange(generationType)"
                                        [disabled]="!auth.hasPermission('certificate_generation_types.update')"
                                    />
                                    <p-button
                                        icon="pi pi-trash"
                                        [rounded]="true"
                                        [outlined]="true"
                                        severity="danger"
                                        (onClick)="confirmDelete(generationType)"
                                        [disabled]="generationType.certificates_count > 0 || generationType.templates_count > 0 || !auth.hasPermission('certificate_generation_types.delete')"
                                    />
                                </div>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="9">No se encontraron tipos de generacion.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </div>
    `
})
export class CertificateGenerationTypes {
    readonly auth = inject(AuthService);
    private readonly fb = inject(FormBuilder);
    private readonly generationTypesService = inject(CertificateGenerationTypesService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);

    readonly generationTypes = signal<ManagedCertificateGenerationType[]>([]);
    readonly totalRecords = signal(0);
    readonly loading = signal(false);

    private lastLazyEvent: TableLazyLoadEvent = { first: 0, rows: 10, sortField: 'created_at', sortOrder: -1 };

    readonly statusFilterOptions: { label: string; value: CertificateGenerationTypeStatus }[] = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' }
    ];

    readonly booleanFilterOptions = [
        { label: 'Visible', value: true },
        { label: 'Oculto', value: false }
    ];

    readonly filtersForm = this.fb.group({
        search: [''],
        status: [null as CertificateGenerationTypeStatus | null],
        showFinalDestinationCompany: [null as boolean | null],
        showDestinationPlace: [null as boolean | null]
    });

    async loadGenerationTypes(event: TableLazyLoadEvent): Promise<void> {
        this.lastLazyEvent = event;
        this.loading.set(true);

        try {
            const result = await this.generationTypesService.listGenerationTypes({
                first: event.first ?? 0,
                rows: event.rows ?? 10,
                sortField: this.normalizeSortField(event.sortField),
                sortOrder: event.sortOrder === 1 ? 1 : -1,
                filters: this.filtersForm.getRawValue()
            });

            this.generationTypes.set(result.generationTypes);
            this.totalRecords.set(result.total);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el listado de tipos de generacion.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }

    async reload(): Promise<void> {
        await this.loadGenerationTypes(this.lastLazyEvent);
    }

    async applyFilters(): Promise<void> {
        await this.loadGenerationTypes({ ...this.lastLazyEvent, first: 0 });
    }

    async clearFilters(): Promise<void> {
        this.filtersForm.reset({ search: '', status: null, showFinalDestinationCompany: null, showDestinationPlace: null });
        await this.applyFilters();
    }

    confirmStatusChange(generationType: ManagedCertificateGenerationType): void {
        const nextStatus: CertificateGenerationTypeStatus = generationType.status === 'active' ? 'inactive' : 'active';
        const action = nextStatus === 'inactive' ? 'inactivar' : 'activar';

        this.confirmationService.confirm({
            message: `Deseas ${action} el tipo de generacion ${generationType.name}?`,
            header: 'Confirmar cambio de estado',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Confirmar',
            rejectLabel: 'Cancelar',
            accept: () => {
                void this.changeStatus(generationType, nextStatus);
            }
        });
    }

    async changeStatus(generationType: ManagedCertificateGenerationType, status: CertificateGenerationTypeStatus): Promise<void> {
        try {
            await this.generationTypesService.updateStatus(generationType.id, status);
            this.messageService.add({ severity: 'success', summary: 'Estado actualizado', detail: `${generationType.name} ahora esta ${this.statusLabel(status).toLowerCase()}.`, life: 3000 });
            await this.reload();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado del tipo de generacion.', life: 3500 });
        }
    }

    confirmDelete(generationType: ManagedCertificateGenerationType): void {
        this.confirmationService.confirm({
            message: `Deseas eliminar el tipo de generacion ${generationType.name}? Esta accion no se permite si ya tiene certificados o plantillas asociadas.`,
            header: 'Eliminar tipo de generacion',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                void this.deleteGenerationType(generationType);
            }
        });
    }

    async deleteGenerationType(generationType: ManagedCertificateGenerationType): Promise<void> {
        try {
            await this.generationTypesService.deleteGenerationType(generationType);
            this.messageService.add({ severity: 'success', summary: 'Tipo eliminado', detail: 'El tipo de generacion fue eliminado correctamente.', life: 3000 });
            await this.reload();
        } catch (error) {
            const detail = error instanceof Error ? error.message : 'No se pudo eliminar el tipo de generacion.';
            this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 4000 });
        }
    }

    statusLabel(status: CertificateGenerationTypeStatus): string {
        return status === 'active' ? 'Activo' : 'Inactivo';
    }

    private normalizeSortField(sortField: string | string[] | undefined | null): string {
        return Array.isArray(sortField) ? (sortField[0] ?? 'created_at') : (sortField ?? 'created_at');
    }
}
