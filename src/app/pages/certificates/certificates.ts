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
import { CertificateFormOptions, CertificatesService, CertificateStatus, ManagedCertificate } from './certificates.service';

@Component({
    selector: 'app-certificates',
    standalone: true,
    imports: [ButtonModule, CommonModule, ConfirmDialogModule, DatePipe, InputTextModule, ReactiveFormsModule, RouterModule, SelectModule, TableModule, TagModule, ToastModule, ToolbarModule],
    providers: [ConfirmationService, MessageService],
    template: `
        <p-toast />
        <p-confirmdialog [style]="{ width: '450px' }" />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Operacion</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Certificados</h1>
                <p class="text-muted-color max-w-3xl">Gestiona certificados de valorizacion, items, documentos, emision y archivos generados.</p>
            </div>

            <p-toolbar>
                <ng-template #start>
                    <p-button label="Nuevo certificado" icon="pi pi-plus" routerLink="/certificates/new" [disabled]="!auth.hasPermission('certificates.create')" />
                </ng-template>
                <ng-template #end>
                    <p-button label="Actualizar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="reload()" [loading]="loading()" />
                </ng-template>
            </p-toolbar>

            <div class="card">
                <form [formGroup]="filtersForm" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 mb-5" (ngSubmit)="applyFilters()">
                    <div class="flex flex-col gap-2">
                        <label for="series" class="font-medium">Buscar por Serie</label>
                        <input pInputText id="series" formControlName="series" placeholder="Serie" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="number" class="font-medium">Numero</label>
                        <input pInputText id="number" formControlName="number" placeholder="Numero" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="statusFilter" class="font-medium">Estado</label>
                        <p-select inputId="statusFilter" formControlName="status" [options]="statusFilterOptions" optionLabel="label" optionValue="value" placeholder="Todos" class="w-full" [showClear]="true" />
                    </div>

                    <div class="flex flex-col gap-2 xl:col-span-2">
                        <label for="generatorCompanyFilter" class="font-medium">Empresa</label>
                        <p-select inputId="generatorCompanyFilter" formControlName="generatorCompanyId" [options]="options().companies" optionLabel="name" optionValue="id" placeholder="Todos" class="w-full" [showClear]="true" [filter]="true" filterBy="name,ruc" />
                    </div>

                    <div class="md:col-span-2 xl:col-span-4 flex items-end justify-end gap-3">
                        <p-button type="button" label="Limpiar" icon="pi pi-filter-slash" severity="secondary" [outlined]="true" (onClick)="clearFilters()" />
                        <p-button type="submit" label="Filtrar" icon="pi pi-search" />
                    </div>
                </form>

                <p-table
                    [value]="certificates()"
                    [lazy]="true"
                    (onLazyLoad)="loadCertificates($event)"
                    [loading]="loading()"
                    [paginator]="true"
                    [rows]="10"
                    [totalRecords]="totalRecords()"
                    [rowsPerPageOptions]="[10, 20, 50]"
                    [rowHover]="true"
                    dataKey="id"
                    sortField="created_at"
                    [sortOrder]="-1"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} certificados"
                    [showCurrentPageReport]="true"
                    responsiveLayout="scroll"
                    [tableStyle]="{ 'min-width': '82rem' }"
                >
                    <ng-template #header>
                        <tr>
                            <th style="width: 6rem">ID</th>
                            <th pSortableColumn="certificate_number" style="min-width: 12rem">Numero <p-sortIcon field="certificate_number" /></th>
                            <th style="min-width: 20rem">Empresa Generadora</th>
                            <th style="min-width: 20rem">Empresa Transportista</th>
                            <th pSortableColumn="issue_date" style="min-width: 10rem">Fecha Emision <p-sortIcon field="issue_date" /></th>
                            <th pSortableColumn="status" style="min-width: 10rem">Estado <p-sortIcon field="status" /></th>
                            <th style="width: 12rem"></th>
                        </tr>
                    </ng-template>

                    <ng-template #body let-certificate let-rowIndex="rowIndex">
                        <tr>
                            <td>{{ displayRowId(rowIndex) }}</td>
                            <td>
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <i class="pi pi-file-check"></i>
                                    </div>
                                    <div>
                                        <div class="font-medium text-surface-900 dark:text-surface-0">{{ certificate.certificate_number }}</div>
                                        <small class="text-muted-color">{{ certificate.guide_number }}</small>
                                    </div>
                                </div>
                            </td>
                            <td>{{ certificate.generator_company?.business_name || 'Sin empresa' }}</td>
                            <td>{{ certificate.transporter_company?.business_name || 'Sin transportista' }}</td>
                            <td>{{ certificate.issue_date | date: 'dd/MM/yyyy' }}</td>
                            <td><p-tag [value]="statusLabel(certificate.status)" [severity]="statusSeverity(certificate.status)" /></td>
                            <td>
                                <div class="flex justify-end gap-2">
                                    <p-button icon="pi pi-eye" [rounded]="true" [outlined]="true" severity="secondary" [routerLink]="['/certificates', certificate.id]" />
                                    <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" [routerLink]="['/certificates', certificate.id, 'edit']" [disabled]="!auth.hasPermission('certificates.update')" />
                                    <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (onClick)="confirmDelete(certificate)" [disabled]="!auth.hasPermission('certificates.delete')" />
                                </div>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="7">No se encontraron certificados.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </div>
    `
})
export class Certificates implements OnInit {
    readonly auth = inject(AuthService);
    private readonly fb = inject(FormBuilder);
    private readonly certificatesService = inject(CertificatesService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);

    readonly certificates = signal<ManagedCertificate[]>([]);
    readonly options = signal<CertificateFormOptions>({ companies: [], generationTypes: [], templateVersions: [], companyAddresses: [], items: [], quantityTypes: [], documentTypes: [] });
    readonly totalRecords = signal(0);
    readonly loading = signal(false);

    private lastLazyEvent: TableLazyLoadEvent = { first: 0, rows: 10, sortField: 'created_at', sortOrder: -1 };

    readonly statusFilterOptions: { label: string; value: CertificateStatus }[] = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' }
    ];

    readonly filtersForm = this.fb.group({
        series: [''],
        number: [''],
        status: [null as CertificateStatus | null],
        generatorCompanyId: [null as string | null]
    });

    async ngOnInit(): Promise<void> {
        await this.loadOptions();
    }

    async loadCertificates(event: TableLazyLoadEvent): Promise<void> {
        this.lastLazyEvent = event;
        this.loading.set(true);

        try {
            const result = await this.certificatesService.listCertificates({
                first: event.first ?? 0,
                rows: event.rows ?? 10,
                sortField: this.normalizeSortField(event.sortField),
                sortOrder: event.sortOrder === 1 ? 1 : -1,
                filters: this.filtersForm.getRawValue()
            });

            this.certificates.set(result.certificates);
            this.totalRecords.set(result.total);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el listado de certificados.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }

    async reload(): Promise<void> {
        await this.loadCertificates(this.lastLazyEvent);
    }

    async applyFilters(): Promise<void> {
        await this.loadCertificates({ ...this.lastLazyEvent, first: 0 });
    }

    async clearFilters(): Promise<void> {
        this.filtersForm.reset({ series: '', number: '', status: null, generatorCompanyId: null });
        await this.applyFilters();
    }

    displayRowId(rowIndex: number): number {
        return (this.lastLazyEvent.first ?? 0) + rowIndex + 1;
    }

    confirmDelete(certificate: ManagedCertificate): void {
        this.confirmationService.confirm({
            message: `Deseas eliminar el certificado ${certificate.certificate_number}?`,
            header: 'Eliminar certificado',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                void this.deleteCertificate(certificate);
            }
        });
    }

    async deleteCertificate(certificate: ManagedCertificate): Promise<void> {
        try {
            await this.certificatesService.deleteCertificate(certificate);
            this.messageService.add({ severity: 'success', summary: 'Certificado eliminado', detail: 'El certificado fue eliminado correctamente.', life: 3000 });
            await this.reload();
        } catch (error) {
            const detail = error instanceof Error ? error.message : 'No se pudo eliminar el certificado.';
            this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 4000 });
        }
    }

    statusLabel(status: CertificateStatus): string {
        const labels: Record<CertificateStatus, string> = {
            active: 'Activo',
            inactive: 'Inactivo'
        };

        return labels[status];
    }

    statusSeverity(status: CertificateStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const severities: Record<CertificateStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
            active: 'success',
            inactive: 'danger'
        };

        return severities[status];
    }

    private async loadOptions(): Promise<void> {
        try {
            this.options.set(await this.certificatesService.getFormOptions());
        } catch {
            this.messageService.add({ severity: 'warn', summary: 'Catalogos', detail: 'No se pudieron cargar catalogos para filtros.', life: 3500 });
        }
    }

    private normalizeSortField(sortField: string | string[] | undefined | null): string {
        return Array.isArray(sortField) ? (sortField[0] ?? 'created_at') : (sortField ?? 'created_at');
    }
}
