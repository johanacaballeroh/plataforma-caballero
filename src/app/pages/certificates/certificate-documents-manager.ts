import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { CertificateDocument, CertificateFormOptions, CertificatesService } from './certificates.service';

@Component({
    selector: 'app-certificate-documents-manager',
    standalone: true,
    imports: [ButtonModule, CommonModule, ConfirmDialogModule, DatePipe, InputTextModule, ReactiveFormsModule, SelectModule, TableModule, ToastModule],
    providers: [ConfirmationService, MessageService],
    template: `
        <p-toast />
        <p-confirmdialog [style]="{ width: '450px' }" />

        <div class="card flex flex-col gap-4">
            <div class="flex items-center justify-between gap-3">
                <div>
                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0">Documentos adjuntos</h2>
                    <p class="text-muted-color text-sm">Guias, anexos y otros archivos privados asociados al certificado.</p>
                </div>
            </div>

            @if (!isReadonly) {
                <form [formGroup]="form" class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div class="flex flex-col gap-2">
                        <label for="documentType" class="font-medium">Tipo documento</label>
                        <p-select inputId="documentType" formControlName="document_type_id" [options]="options.documentTypes" optionLabel="name" optionValue="id" class="w-full" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="documentFile" class="font-medium">Archivo</label>
                        <input #fileInput pInputText id="documentFile" type="file" (change)="selectFile($event)" />
                    </div>

                    <div class="flex justify-end">
                        <p-button label="Agregar Documento" icon="pi pi-upload" (onClick)="upload()" [loading]="uploading()" [disabled]="form.invalid || !selectedFile() || uploading()" />
                    </div>
                </form>
            }

            <p-table [value]="documents()" [loading]="loading()" responsiveLayout="scroll" [tableStyle]="{ 'min-width': '64rem' }">
                <ng-template #header>
                    <tr>
                        <th style="min-width: 14rem">Tipo</th>
                        <th style="min-width: 20rem">Archivo</th>
                        <th style="min-width: 10rem">Estado</th>
                        <th style="min-width: 10rem">Tamano</th>
                        <th style="min-width: 10rem">Creado</th>
                        <th style="width: 8rem"></th>
                    </tr>
                </ng-template>
                <ng-template #body let-document>
                    <tr>
                        <td>{{ document.document_type?.name || 'Sin tipo' }}</td>
                        <td>
                            <div class="flex flex-col gap-1">
                                <span class="font-medium">{{ document.file_name }}</span>
                                <small class="text-muted-color">{{ document.mime_type || 'MIME no registrado' }}</small>
                            </div>
                        </td>
                        <td><span class="text-primary font-medium">Subido</span></td>
                        <td>{{ formatSize(document.size_bytes) }}</td>
                        <td>{{ document.created_at | date: 'dd/MM/yyyy HH:mm' }}</td>
                        <td>
                            <div class="flex justify-end gap-2">
                                <p-button icon="pi pi-download" label="Ver/Descargar" [outlined]="true" severity="secondary" (onClick)="download(document)" />
                                @if (!isReadonly) {
                                    <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (onClick)="confirmDelete(document)" />
                                }
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="6">No hay documentos adjuntos.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>
    `
})
export class CertificateDocumentsManager implements OnChanges {
    private readonly fb = inject(FormBuilder);
    private readonly certificatesService = inject(CertificatesService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);

    @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
    @Input({ required: true }) certificateId = '';
    @Input() options: CertificateFormOptions = { companies: [], generationTypes: [], templateVersions: [], companyAddresses: [], items: [], quantityTypes: [], documentTypes: [] };
    @Input({ alias: 'readonly' }) isReadonly = false;

    readonly documents = signal<CertificateDocument[]>([]);
    readonly selectedFile = signal<File | null>(null);
    readonly loading = signal(false);
    readonly uploading = signal(false);

    readonly form = this.fb.group({
        document_type_id: ['', Validators.required]
    });

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes['certificateId'] && this.certificateId) {
            await this.reload();
        }
    }

    async reload(): Promise<void> {
        this.loading.set(true);

        try {
            this.documents.set(await this.certificatesService.listDocuments(this.certificateId));
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar documentos.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }

    selectFile(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.selectedFile.set(input.files?.[0] ?? null);
    }

    async upload(): Promise<void> {
        this.form.markAllAsTouched();

        const file = this.selectedFile();
        const documentTypeId = this.form.controls.document_type_id.value;
        if (this.form.invalid || !file || !documentTypeId) {
            return;
        }

        this.uploading.set(true);

        try {
            await this.certificatesService.uploadDocument(this.certificateId, documentTypeId, file);
            this.messageService.add({ severity: 'success', summary: 'Documento subido', detail: 'El documento fue registrado correctamente.', life: 2500 });
            this.selectedFile.set(null);
            this.form.reset({ document_type_id: '' });
            if (this.fileInput?.nativeElement) {
                this.fileInput.nativeElement.value = '';
            }
            await this.reload();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo subir el documento. Revisa permisos, Storage y RLS.', life: 4000 });
        } finally {
            this.uploading.set(false);
        }
    }

    async download(document: CertificateDocument): Promise<void> {
        try {
            const url = await this.certificatesService.createSignedUrl(document.storage_bucket, document.storage_path);
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar enlace de descarga.', life: 3500 });
        }
    }

    confirmDelete(document: CertificateDocument): void {
        this.confirmationService.confirm({
            message: `Deseas eliminar el documento ${document.file_name}?`,
            header: 'Eliminar documento',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                void this.delete(document);
            }
        });
    }

    async delete(document: CertificateDocument): Promise<void> {
        try {
            await this.certificatesService.deleteDocument(document);
            this.messageService.add({ severity: 'success', summary: 'Documento eliminado', detail: 'El documento fue eliminado correctamente.', life: 2500 });
            await this.reload();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el documento.', life: 3500 });
        }
    }

    formatSize(size: number | null): string {
        if (!size) {
            return '-';
        }

        if (size < 1024 * 1024) {
            return `${(size / 1024).toFixed(1)} KB`;
        }

        return `${(size / 1024 / 1024).toFixed(1)} MB`;
    }
}
