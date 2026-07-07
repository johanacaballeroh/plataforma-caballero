import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '@/app/core/auth/auth.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { CertificateReportRow, CertificateReportStatus, ReportCompanyOption, ReportExportLog, ReportsService } from './reports.service';

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [ButtonModule, CommonModule, DatePipe, DatePickerModule, DecimalPipe, InputTextModule, ReactiveFormsModule, SelectModule, TableModule, TagModule, ToastModule, ToolbarModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Operacion</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Reportes</h1>
                <p class="text-muted-color max-w-3xl">Consulta y exporta el reporte operacional de certificados respetando permisos y alcance por empresa.</p>
            </div>

            <p-toolbar>
                <ng-template #start>
                    <div class="flex flex-wrap gap-2">
                        <p-button label="Exportar Excel" icon="pi pi-file-excel" severity="success" (onClick)="exportReport()" [loading]="exporting()" [disabled]="!auth.hasPermission('reports.export')" />
                    </div>
                </ng-template>
                <ng-template #end>
                    <p-button label="Actualizar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="reload()" [loading]="loading()" />
                </ng-template>
            </p-toolbar>

            <div class="card">
                <form [formGroup]="filtersForm" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 mb-5" (ngSubmit)="applyFilters()">
                    <div class="flex flex-col gap-2 xl:col-span-2">
                        <label for="search" class="font-medium">Buscar</label>
                        <input pInputText id="search" formControlName="search" placeholder="Ticket, cliente, RUC, placa o residuo" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="dateFrom" class="font-medium">Desde</label>
                        <p-datepicker inputId="dateFrom" formControlName="dateFrom" dateFormat="dd/mm/yy" [showIcon]="true" [showButtonBar]="true" placeholder="dd/mm/aaaa" appendTo="body" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="dateTo" class="font-medium">Hasta</label>
                        <p-datepicker inputId="dateTo" formControlName="dateTo" dateFormat="dd/mm/yy" [showIcon]="true" [showButtonBar]="true" placeholder="dd/mm/aaaa" appendTo="body" />
                    </div>

                    <div class="flex flex-col gap-2 xl:col-span-2">
                        <label for="generatorCompanyFilter" class="font-medium">Empresa generadora</label>
                        <p-select inputId="generatorCompanyFilter" formControlName="generatorCompanyId" [options]="companies()" optionLabel="name" optionValue="id" placeholder="Todas" class="w-full" [showClear]="true" [filter]="true" filterBy="name,ruc" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="statusFilter" class="font-medium">Estado</label>
                        <p-select inputId="statusFilter" formControlName="status" [options]="statusFilterOptions" optionLabel="label" optionValue="value" placeholder="Todos" class="w-full" [showClear]="true" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="baselCode" class="font-medium">Codigo Basilea</label>
                        <input pInputText id="baselCode" formControlName="baselCode" placeholder="Ej: A4130" />
                    </div>

                    <div class="md:col-span-2 xl:col-span-4 flex items-end justify-end gap-3">
                        <p-button type="button" label="Limpiar" icon="pi pi-filter-slash" severity="secondary" [outlined]="true" (onClick)="clearFilters()" />
                        <p-button type="submit" label="Filtrar" icon="pi pi-search" />
                    </div>
                </form>

                <p-table
                    [value]="rows()"
                    [lazy]="true"
                    (onLazyLoad)="loadReport($event)"
                    [loading]="loading()"
                    [paginator]="true"
                    [rows]="15"
                    [totalRecords]="totalRecords()"
                    [rowsPerPageOptions]="[15, 30, 50]"
                    [rowHover]="true"
                    sortField="fecha"
                    [sortOrder]="-1"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                    [showCurrentPageReport]="true"
                    responsiveLayout="scroll"
                    [tableStyle]="{ 'min-width': '118rem' }"
                >
                    <ng-template #header>
                        <tr>
                            <th pSortableColumn="fecha" style="min-width: 9rem">Fecha <p-sortIcon field="fecha" /></th>
                            <th pSortableColumn="numero_ticket" style="min-width: 11rem">Nro Ticket <p-sortIcon field="numero_ticket" /></th>
                            <th pSortableColumn="cliente" style="min-width: 20rem">Cliente <p-sortIcon field="cliente" /></th>
                            <th pSortableColumn="ruc" style="min-width: 10rem">RUC <p-sortIcon field="ruc" /></th>
                            <th pSortableColumn="placa" style="min-width: 9rem">Placa <p-sortIcon field="placa" /></th>
                            <th pSortableColumn="fuente_generacion" style="min-width: 22rem">Fuente de generacion <p-sortIcon field="fuente_generacion" /></th>
                            <th pSortableColumn="direccion_llegada" style="min-width: 24rem">Direccion de llegada <p-sortIcon field="direccion_llegada" /></th>
                            <th pSortableColumn="tipo" style="min-width: 15rem">Tipo <p-sortIcon field="tipo" /></th>
                            <th pSortableColumn="cantidad" style="min-width: 9rem">Cantidad <p-sortIcon field="cantidad" /></th>
                            <th pSortableColumn="unidad_medida" style="min-width: 12rem">UM <p-sortIcon field="unidad_medida" /></th>
                            <th pSortableColumn="peso" style="min-width: 9rem">Peso <p-sortIcon field="peso" /></th>
                            <th pSortableColumn="codigo_basilea" style="min-width: 11rem">Codigo Basilea <p-sortIcon field="codigo_basilea" /></th>
                            <th pSortableColumn="estado_certificado" style="min-width: 10rem">Estado <p-sortIcon field="estado_certificado" /></th>
                        </tr>
                    </ng-template>

                    <ng-template #body let-row>
                        <tr>
                            <td>{{ displayDate(row.fecha) }}</td>
                            <td>
                                <span class="font-medium text-primary">{{ row.numero_ticket || '-' }}</span>
                            </td>
                            <td>{{ row.cliente || '-' }}</td>
                            <td>{{ row.ruc || '-' }}</td>
                            <td>{{ row.placa || '-' }}</td>
                            <td>{{ row.fuente_generacion || '-' }}</td>
                            <td>{{ row.direccion_llegada || '-' }}</td>
                            <td>{{ row.tipo || '-' }}</td>
                            <td>{{ row.cantidad === null ? '-' : (row.cantidad | number: '1.0-3') }}</td>
                            <td>{{ row.unidad_medida || '-' }}</td>
                            <td>{{ row.peso === null ? '-' : (row.peso | number: '1.0-3') }}</td>
                            <td>{{ row.codigo_basilea || '-' }}</td>
                            <td>
                                <p-tag [value]="statusLabel(row.estado_certificado)" [severity]="statusSeverity(row.estado_certificado)" />
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="13">No se encontraron registros para los filtros seleccionados.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>

            <div class="card">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                    <div>
                        <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0">Exportaciones recientes</h2>
                        <p class="text-muted-color mt-1">Metadata registrada para auditoria de descargas del reporte de certificados.</p>
                    </div>
                    <p-button label="Actualizar historial" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="loadRecentExports()" [loading]="exportsLoading()" />
                </div>

                <p-table [value]="recentExports()" [loading]="exportsLoading()" responsiveLayout="scroll" [tableStyle]="{ 'min-width': '72rem' }">
                    <ng-template #header>
                        <tr>
                            <th style="min-width: 14rem">Fecha</th>
                            <th style="min-width: 22rem">Archivo</th>
                            <th style="min-width: 26rem">Filtros</th>
                            <th style="min-width: 14rem">Generado por</th>
                            <th style="min-width: 10rem">Storage</th>
                        </tr>
                    </ng-template>

                    <ng-template #body let-exportLog>
                        <tr>
                            <td>{{ exportLog.generated_at | date: 'dd/MM/yyyy HH:mm' }}</td>
                            <td>
                                <span class="font-medium text-surface-900 dark:text-surface-0">{{ exportLog.file_name || 'Sin archivo' }}</span>
                            </td>
                            <td>{{ exportFiltersSummary(exportLog.filters) }}</td>
                            <td>{{ exportLog.generated_by || '-' }}</td>
                            <td>
                                <p-tag [value]="exportLog.storage_bucket ? 'Archivo privado' : 'Descarga local'" [severity]="exportLog.storage_bucket ? 'info' : 'secondary'" />
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="5">Todavia no hay exportaciones registradas.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </div>
    `
})
export class Reports implements OnInit {
    readonly auth = inject(AuthService);
    private readonly fb = inject(FormBuilder);
    private readonly reportsService = inject(ReportsService);
    private readonly messageService = inject(MessageService);

    readonly rows = signal<CertificateReportRow[]>([]);
    readonly companies = signal<ReportCompanyOption[]>([]);
    readonly recentExports = signal<ReportExportLog[]>([]);
    readonly totalRecords = signal(0);
    readonly loading = signal(false);
    readonly exporting = signal(false);
    readonly exportsLoading = signal(false);

    private lastLazyEvent: TableLazyLoadEvent = { first: 0, rows: 15, sortField: 'fecha', sortOrder: -1 };

    readonly statusFilterOptions: { label: string; value: CertificateReportStatus }[] = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' }
    ];

    readonly filtersForm = this.fb.group({
        search: [''],
        dateFrom: [null as Date | null],
        dateTo: [null as Date | null],
        generatorCompanyId: [null as string | null],
        status: [null as CertificateReportStatus | null],
        baselCode: ['']
    });

    async ngOnInit(): Promise<void> {
        await Promise.all([this.loadCompanies(), this.loadRecentExports()]);
    }

    async loadReport(event: TableLazyLoadEvent): Promise<void> {
        this.lastLazyEvent = event;
        this.loading.set(true);

        try {
            const result = await this.reportsService.listCertificateReport({
                first: event.first ?? 0,
                rows: event.rows ?? 15,
                sortField: this.normalizeSortField(event.sortField),
                sortOrder: event.sortOrder === 1 ? 1 : -1,
                filters: this.getNormalizedFilters()
            });

            this.rows.set(result.rows);
            this.totalRecords.set(result.total);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el reporte de certificados.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }

    async reload(): Promise<void> {
        await this.loadReport(this.lastLazyEvent);
    }

    async applyFilters(): Promise<void> {
        const { dateFrom, dateTo } = this.filtersForm.getRawValue();

        if (dateFrom && dateTo && dateFrom > dateTo) {
            this.messageService.add({ severity: 'warn', summary: 'Fechas invalidas', detail: 'La fecha desde no puede ser mayor que la fecha hasta.', life: 3500 });
            return;
        }

        await this.loadReport({ ...this.lastLazyEvent, first: 0 });
    }

    async clearFilters(): Promise<void> {
        this.filtersForm.reset({ search: '', dateFrom: null, dateTo: null, generatorCompanyId: null, status: null, baselCode: '' });
        await this.applyFilters();
    }

    async exportReport(): Promise<void> {
        if (!this.auth.hasPermission('reports.export')) {
            return;
        }

        this.exporting.set(true);

        try {
            const result = await this.reportsService.exportCertificateReport(this.getNormalizedFilters(), this.normalizeSortField(this.lastLazyEvent.sortField), this.lastLazyEvent.sortOrder === 1 ? 1 : -1);
            this.downloadExcelFile(result.fileName, result.rows);
            await this.loadRecentExports();
            this.messageService.add({ severity: 'success', summary: 'Reporte exportado', detail: 'La exportacion fue registrada y descargada.', life: 3500 });
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo exportar el reporte. Revisa permisos de reportes.', life: 4000 });
        } finally {
            this.exporting.set(false);
        }
    }

    statusLabel(status: CertificateReportStatus | null): string {
        if (status === 'active') {
            return 'Activo';
        }

        if (status === 'inactive') {
            return 'Inactivo';
        }

        return 'Sin estado';
    }

    statusSeverity(status: CertificateReportStatus | null): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        if (status === 'active') {
            return 'success';
        }

        if (status === 'inactive') {
            return 'danger';
        }

        return 'secondary';
    }

    displayDate(value: string | null): string {
        return this.formatDisplayDate(value) || '-';
    }

    async loadRecentExports(): Promise<void> {
        this.exportsLoading.set(true);

        try {
            this.recentExports.set(await this.reportsService.listRecentExports());
        } catch {
            this.messageService.add({ severity: 'warn', summary: 'Exportaciones', detail: 'No se pudo cargar el historial de exportaciones.', life: 3500 });
        } finally {
            this.exportsLoading.set(false);
        }
    }

    exportFiltersSummary(filters: ReportExportLog['filters']): string {
        const reportFilters = filters as Record<string, unknown>;
        const labels: string[] = [];
        const companyName = typeof reportFilters['generatorCompanyId'] === 'string' ? this.companyName(reportFilters['generatorCompanyId']) : null;

        if (reportFilters['dateFrom'] || reportFilters['dateTo']) {
            labels.push(`Fechas: ${this.formatDisplayDate(String(reportFilters['dateFrom'] || '')) || 'inicio'} - ${this.formatDisplayDate(String(reportFilters['dateTo'] || '')) || 'fin'}`);
        }

        if (typeof reportFilters['search'] === 'string' && reportFilters['search']) {
            labels.push(`Busqueda: ${reportFilters['search']}`);
        }

        if (companyName) {
            labels.push(`Empresa: ${companyName}`);
        }

        if (reportFilters['status']) {
            labels.push(`Estado: ${this.statusLabel(reportFilters['status'] as CertificateReportStatus)}`);
        }

        if (typeof reportFilters['baselCode'] === 'string' && reportFilters['baselCode']) {
            labels.push(`Basilea: ${reportFilters['baselCode']}`);
        }

        return labels.length ? labels.join(' | ') : 'Sin filtros';
    }

    private async loadCompanies(): Promise<void> {
        try {
            this.companies.set(await this.reportsService.listGeneratorCompanies());
        } catch {
            this.messageService.add({ severity: 'warn', summary: 'Empresas', detail: 'No se pudieron cargar empresas para filtros.', life: 3500 });
        }
    }

    private companyName(companyId: string): string | null {
        const company = this.companies().find((option) => option.id === companyId);
        return company ? `${company.name} (${company.ruc})` : companyId;
    }

    private getNormalizedFilters() {
        const filters = this.filtersForm.getRawValue();

        return {
            search: filters.search?.trim() || null,
            dateFrom: this.formatDate(filters.dateFrom),
            dateTo: this.formatDate(filters.dateTo),
            generatorCompanyId: filters.generatorCompanyId,
            status: filters.status,
            baselCode: filters.baselCode?.trim() || null
        };
    }

    private normalizeSortField(sortField: string | string[] | undefined | null): string {
        return Array.isArray(sortField) ? (sortField[0] ?? 'fecha') : (sortField ?? 'fecha');
    }

    private formatDate(value: Date | null | undefined): string | null {
        if (!value) {
            return null;
        }

        const pad = (datePart: number): string => String(datePart).padStart(2, '0');
        return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
    }

    private downloadExcelFile(fileName: string, rows: CertificateReportRow[]): void {
        const html = this.buildExcelHtml(rows);
        const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');

        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
    }

    private buildExcelHtml(rows: CertificateReportRow[]): string {
        const headers = ['FECHA', 'NRO TICKET', 'CLIENTE', 'RUC', 'PLACA', 'FUENTE DE GENERACION', 'DIRECCION DE LLEGADA', 'TIPO', 'CANTIDAD', 'UM', 'PESO', 'CODIGO BASILEA', 'ESTADO'];
        const bodyRows = rows
            .map((row) =>
                [
                    this.formatDisplayDate(row.fecha),
                    row.numero_ticket,
                    row.cliente,
                    row.ruc,
                    row.placa,
                    row.fuente_generacion,
                    row.direccion_llegada,
                    row.tipo,
                    row.cantidad,
                    row.unidad_medida,
                    row.peso,
                    row.codigo_basilea,
                    this.statusLabel(row.estado_certificado)
                ]
                    .map((value) => `<td>${this.escapeHtml(value === null || value === undefined || value === '' ? '-' : String(value))}</td>`)
                    .join('')
            )
            .map((cells) => `<tr>${cells}</tr>`)
            .join('');

        return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
</head>
<body>
<table>
<thead><tr>${headers.map((header) => `<th>${this.escapeHtml(header)}</th>`).join('')}</tr></thead>
<tbody>${bodyRows}</tbody>
</table>
</body>
</html>`;
    }

    private formatDisplayDate(value: string | null): string {
        if (!value) {
            return '';
        }

        const [year, month, day] = value.split('-');
        return year && month && day ? `${day}/${month}/${year}` : value;
    }

    private escapeHtml(value: string): string {
        return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
    }
}
