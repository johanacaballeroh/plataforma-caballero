import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DocumentTypesForm } from './document-types-form';
import { DocumentTypesService, SaveDocumentTypePayload } from './document-types.service';

@Component({
    selector: 'app-document-types-new',
    standalone: true,
    imports: [CommonModule, DocumentTypesForm, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Catalogos</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Nuevo tipo de documento</h1>
                <p class="text-muted-color max-w-3xl">Crea un tipo disponible para clasificar documentos adjuntos de certificados.</p>
            </div>

            <div class="card">
                <app-document-types-form mode="create" [saving]="saving()" (save)="createDocumentType($event)" />
            </div>
        </div>
    `
})
export class DocumentTypesNew {
    private readonly documentTypesService = inject(DocumentTypesService);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    readonly saving = signal(false);

    async createDocumentType(payload: SaveDocumentTypePayload): Promise<void> {
        this.saving.set(true);

        try {
            await this.documentTypesService.createDocumentType(payload);
            this.messageService.add({ severity: 'success', summary: 'Tipo creado', detail: 'El tipo de documento fue creado correctamente.', life: 2500 });
            await this.router.navigate(['/document-types']);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el tipo de documento. Revisa nombre unico y RLS.', life: 4500 });
        } finally {
            this.saving.set(false);
        }
    }
}
