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
import { CompaniesService, CompanyStatus, CompanyType, ManagedCompany } from './companies.service';

@Component({
    selector: 'app-companies',
    standalone: true,
    imports: [ButtonModule, CommonModule, ConfirmDialogModule, DatePipe, InputTextModule, ReactiveFormsModule, RouterModule, SelectModule, TableModule, TagModule, ToastModule, ToolbarModule],
    providers: [ConfirmationService, MessageService],
    template: `
        <p-toast />
        <p-confirmdialog [style]="{ width: '450px' }" />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Operacion</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Empresas</h1>
                <p class="text-muted-color max-w-3xl">Gestiona empresas generadoras, transportistas y destinos finales con sus sedes y contactos.</p>
            </div>

            <p-toolbar>
                <ng-template #start>
                    <p-button label="Nueva empresa" icon="pi pi-plus" routerLink="/companies/new" [disabled]="!auth.hasPermission('companies.create')" />
                </ng-template>
                <ng-template #end>
                    <p-button label="Actualizar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="reload()" [loading]="loading()" />
                </ng-template>
            </p-toolbar>

            <div class="card">
                <form [formGroup]="filtersForm" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-5" (ngSubmit)="applyFilters()">
                    <div class="flex flex-col gap-2 xl:col-span-2">
                        <label for="search" class="font-medium">Buscar</label>
                        <input pInputText id="search" formControlName="search" placeholder="RUC, razon social o direccion" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="companyTypeFilter" class="font-medium">Tipo</label>
                        <p-select inputId="companyTypeFilter" formControlName="companyType" [options]="companyTypeOptions" optionLabel="label" optionValue="value" placeholder="Todos" class="w-full" [showClear]="true" />
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
                    [value]="companies()"
                    [lazy]="true"
                    (onLazyLoad)="loadCompanies($event)"
                    [loading]="loading()"
                    [paginator]="true"
                    [rows]="10"
                    [totalRecords]="totalRecords()"
                    [rowsPerPageOptions]="[10, 20, 50]"
                    [rowHover]="true"
                    dataKey="id"
                    sortField="created_at"
                    [sortOrder]="-1"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} empresas"
                    [showCurrentPageReport]="true"
                    responsiveLayout="scroll"
                    [tableStyle]="{ 'min-width': '92rem' }"
                >
                    <ng-template #header>
                        <tr>
                            <th pSortableColumn="business_name" style="min-width: 20rem">Empresa <p-sortIcon field="business_name" /></th>
                            <th pSortableColumn="ruc" style="min-width: 10rem">RUC <p-sortIcon field="ruc" /></th>
                            <th pSortableColumn="company_type" style="min-width: 12rem">Tipo <p-sortIcon field="company_type" /></th>
                            <th pSortableColumn="trade_name" style="min-width: 14rem">Nombre comercial <p-sortIcon field="trade_name" /></th>
                            <th style="min-width: 8rem">Sedes</th>
                            <th style="min-width: 8rem">Contactos</th>
                            <th style="min-width: 10rem">Certificados</th>
                            <th pSortableColumn="status" style="min-width: 10rem">Estado <p-sortIcon field="status" /></th>
                            <th pSortableColumn="created_at" style="min-width: 12rem">Creacion <p-sortIcon field="created_at" /></th>
                            <th style="width: 12rem"></th>
                        </tr>
                    </ng-template>

                    <ng-template #body let-company>
                        <tr>
                            <td>
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <i class="pi pi-building"></i>
                                    </div>
                                    <div>
                                        <div class="font-medium text-surface-900 dark:text-surface-0">{{ company.business_name }}</div>
                                        <small class="text-muted-color">{{ company.fiscal_address || 'Sin direccion fiscal' }}</small>
                                    </div>
                                </div>
                            </td>
                            <td>{{ company.ruc }}</td>
                            <td><p-tag [value]="companyTypeLabel(company.company_type)" severity="info" /></td>
                            <td>{{ company.trade_name || 'Sin nombre comercial' }}</td>
                            <td>{{ company.branches_count }}</td>
                            <td>{{ company.contacts_count }}</td>
                            <td>{{ company.certificates_count }}</td>
                            <td><p-tag [value]="statusLabel(company.status)" [severity]="company.status === 'active' ? 'success' : 'danger'" /></td>
                            <td>{{ company.created_at | date: 'dd/MM/yyyy HH:mm' }}</td>
                            <td>
                                <div class="flex justify-end gap-2">
                                    <p-button icon="pi pi-eye" [rounded]="true" [outlined]="true" severity="secondary" [routerLink]="['/companies', company.id]" />
                                    <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" [routerLink]="['/companies', company.id, 'edit']" [disabled]="!auth.hasPermission('companies.update')" />
                                    <p-button
                                        [icon]="company.status === 'active' ? 'pi pi-ban' : 'pi pi-check'"
                                        [rounded]="true"
                                        [outlined]="true"
                                        [severity]="company.status === 'active' ? 'danger' : 'success'"
                                        (onClick)="confirmStatusChange(company)"
                                        [disabled]="!auth.hasPermission('companies.update')"
                                    />
                                    <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (onClick)="confirmDelete(company)" [disabled]="company.certificates_count > 0 || !auth.hasPermission('companies.delete')" />
                                </div>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="10">No se encontraron empresas.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </div>
    `
})
export class Companies {
    readonly auth = inject(AuthService);
    private readonly fb = inject(FormBuilder);
    private readonly companiesService = inject(CompaniesService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);

    readonly companies = signal<ManagedCompany[]>([]);
    readonly totalRecords = signal(0);
    readonly loading = signal(false);

    private lastLazyEvent: TableLazyLoadEvent = { first: 0, rows: 10, sortField: 'created_at', sortOrder: -1 };

    readonly companyTypeOptions: { label: string; value: CompanyType }[] = [
        { label: 'Generador', value: 'generator' },
        { label: 'Transportista', value: 'transporter' },
        { label: 'Destino final', value: 'final_destination' },
        { label: 'Mixta', value: 'both' }
    ];

    readonly statusFilterOptions: { label: string; value: CompanyStatus }[] = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' }
    ];

    readonly filtersForm = this.fb.group({
        search: [''],
        status: [null as CompanyStatus | null],
        companyType: [null as CompanyType | null]
    });

    async loadCompanies(event: TableLazyLoadEvent): Promise<void> {
        this.lastLazyEvent = event;
        this.loading.set(true);

        try {
            const result = await this.companiesService.listCompanies({
                first: event.first ?? 0,
                rows: event.rows ?? 10,
                sortField: this.normalizeSortField(event.sortField),
                sortOrder: event.sortOrder === 1 ? 1 : -1,
                filters: this.filtersForm.getRawValue()
            });

            this.companies.set(result.companies);
            this.totalRecords.set(result.total);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el listado de empresas.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }

    async reload(): Promise<void> {
        await this.loadCompanies(this.lastLazyEvent);
    }

    async applyFilters(): Promise<void> {
        await this.loadCompanies({ ...this.lastLazyEvent, first: 0 });
    }

    async clearFilters(): Promise<void> {
        this.filtersForm.reset({ search: '', status: null, companyType: null });
        await this.applyFilters();
    }

    confirmStatusChange(company: ManagedCompany): void {
        const nextStatus: CompanyStatus = company.status === 'active' ? 'inactive' : 'active';
        const action = nextStatus === 'inactive' ? 'inactivar' : 'activar';

        this.confirmationService.confirm({
            message: `Deseas ${action} la empresa ${company.business_name}?`,
            header: 'Confirmar cambio de estado',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Confirmar',
            rejectLabel: 'Cancelar',
            accept: () => {
                void this.changeStatus(company, nextStatus);
            }
        });
    }

    async changeStatus(company: ManagedCompany, status: CompanyStatus): Promise<void> {
        try {
            await this.companiesService.updateStatus(company.id, status);
            this.messageService.add({ severity: 'success', summary: 'Estado actualizado', detail: `${company.business_name} ahora esta ${this.statusLabel(status).toLowerCase()}.`, life: 3000 });
            await this.reload();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado de la empresa.', life: 3500 });
        }
    }

    confirmDelete(company: ManagedCompany): void {
        this.confirmationService.confirm({
            message: `Deseas eliminar la empresa ${company.business_name}? Esta accion no se permite si ya esta usada en certificados.`,
            header: 'Eliminar empresa',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                void this.deleteCompany(company);
            }
        });
    }

    async deleteCompany(company: ManagedCompany): Promise<void> {
        try {
            await this.companiesService.deleteCompany(company);
            this.messageService.add({ severity: 'success', summary: 'Empresa eliminada', detail: 'La empresa fue eliminada correctamente.', life: 3000 });
            await this.reload();
        } catch (error) {
            const detail = error instanceof Error ? error.message : 'No se pudo eliminar la empresa.';

            this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 4000 });
        }
    }

    companyTypeLabel(type: CompanyType): string {
        const labels: Record<CompanyType, string> = {
            generator: 'Generador',
            transporter: 'Transportista',
            final_destination: 'Destino final',
            both: 'Mixta'
        };

        return labels[type];
    }

    statusLabel(status: CompanyStatus): string {
        return status === 'active' ? 'Activo' : 'Inactivo';
    }

    private normalizeSortField(sortField: string | string[] | undefined | null): string {
        return Array.isArray(sortField) ? (sortField[0] ?? 'created_at') : (sortField ?? 'created_at');
    }
}
