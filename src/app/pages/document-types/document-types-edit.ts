import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DocumentTypesForm } from './document-types-form';
import { DocumentTypesService, ManagedDocumentType, SaveDocumentTypePayload } from './document-types.service';

@Component({
    selector: 'app-document-types-edit',
    standalone: true,
    imports: [ButtonModule, CommonModule, DocumentTypesForm, RouterModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Catalogos</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Editar tipo de documento</h1>
                <p class="text-muted-color max-w-3xl">Actualiza el nombre y estado operativo del tipo de documento.</p>
            </div>

            @if (loading()) {
                <div class="card">Cargando tipo de documento...</div>
            } @else if (documentType(); as currentDocumentType) {
                <div class="card">
                    <app-document-types-form mode="edit" [documentType]="currentDocumentType" [saving]="saving()" (save)="updateDocumentType($event)" />
                </div>
            } @else {
                <div class="card flex flex-col gap-4">
                    <h2 class="text-xl font-semibold">Tipo de documento no encontrado</h2>
                    <p class="text-muted-color">No se pudo cargar el tipo solicitado.</p>
                    <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/document-types" />
                </div>
            }
        </div>
    `
})
export class DocumentTypesEdit implements OnInit {
    private readonly documentTypesService = inject(DocumentTypesService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    readonly documentType = signal<ManagedDocumentType | null>(null);
    readonly loading = signal(true);
    readonly saving = signal(false);

    async ngOnInit(): Promise<void> {
        const documentTypeId = this.route.snapshot.paramMap.get('id');

        if (!documentTypeId) {
            this.loading.set(false);

            return;
        }

        try {
            this.documentType.set(await this.documentTypesService.getDocumentType(documentTypeId));
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el tipo de documento.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }

    async updateDocumentType(payload: SaveDocumentTypePayload): Promise<void> {
        const documentType = this.documentType();

        if (!documentType) {
            return;
        }

        this.saving.set(true);

        try {
            await this.documentTypesService.updateDocumentType(documentType.id, payload);
            this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Tipo de documento actualizado correctamente.', life: 2500 });
            await this.router.navigate(['/document-types']);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el tipo de documento. Revisa permisos, nombre unico y RLS.', life: 4500 });
        } finally {
            this.saving.set(false);
        }
    }
}
