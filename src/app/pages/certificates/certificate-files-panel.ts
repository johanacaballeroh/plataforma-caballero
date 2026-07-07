import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { CertificateFile, CertificatesService } from './certificates.service';

@Component({
    selector: 'app-certificate-files-panel',
    standalone: true,
    imports: [ButtonModule, CommonModule, DatePipe, TableModule, TagModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="card flex flex-col gap-4">
            <div class="flex items-center justify-between gap-3">
                <div>
                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0">PDFs generados</h2>
                    <p class="text-muted-color text-sm">Versiones registradas en Supabase Storage para este certificado.</p>
                </div>
                <p-button label="Actualizar" icon="pi pi-refresh" size="small" severity="secondary" [outlined]="true" (onClick)="reload()" [loading]="loading()" />
            </div>

            <p-table [value]="files()" [loading]="loading()" responsiveLayout="scroll" [tableStyle]="{ 'min-width': '58rem' }">
                <ng-template #header>
                    <tr>
                        <th style="min-width: 8rem">Version</th>
                        <th style="min-width: 20rem">Archivo</th>
                        <th style="min-width: 14rem">Plantilla</th>
                        <th style="min-width: 10rem">Actual</th>
                        <th style="min-width: 12rem">Generado</th>
                        <th style="width: 6rem"></th>
                    </tr>
                </ng-template>
                <ng-template #body let-file>
                    <tr>
                        <td>{{ file.version_number }}</td>
                        <td>{{ file.file_name }}</td>
                        <td>{{ file.template_version ? file.template_version.name + ' v' + file.template_version.version_number : 'Sin plantilla' }}</td>
                        <td><p-tag [value]="file.is_current ? 'Actual' : 'Historico'" [severity]="file.is_current ? 'success' : 'secondary'" /></td>
                        <td>{{ file.generated_at | date: 'dd/MM/yyyy HH:mm' }}</td>
                        <td>
                            <div class="flex justify-end">
                                <p-button icon="pi pi-download" [rounded]="true" [outlined]="true" severity="secondary" (onClick)="download(file)" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="6">No hay PDFs generados.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>
    `
})
export class CertificateFilesPanel implements OnChanges {
    private readonly certificatesService = inject(CertificatesService);
    private readonly messageService = inject(MessageService);

    @Input({ required: true }) certificateId = '';

    readonly files = signal<CertificateFile[]>([]);
    readonly loading = signal(false);

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes['certificateId'] && this.certificateId) {
            await this.reload();
        }
    }

    async reload(): Promise<void> {
        this.loading.set(true);

        try {
            this.files.set(await this.certificatesService.listFiles(this.certificateId));
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar PDFs generados.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }

    async download(file: CertificateFile): Promise<void> {
        try {
            const url = await this.certificatesService.createSignedUrl(file.storage_bucket, file.storage_path);
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar enlace de descarga.', life: 3500 });
        }
    }
}
