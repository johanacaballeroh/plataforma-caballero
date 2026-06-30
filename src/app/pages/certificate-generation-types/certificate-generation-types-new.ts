import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CertificateGenerationTypesForm } from './certificate-generation-types-form';
import { CertificateGenerationTypesService, SaveCertificateGenerationTypePayload } from './certificate-generation-types.service';

@Component({
    selector: 'app-certificate-generation-types-new',
    standalone: true,
    imports: [CertificateGenerationTypesForm, CommonModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Catalogos</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Nuevo tipo de generacion</h1>
                <p class="text-muted-color max-w-3xl">Crea un tipo de generacion con reglas de destino para certificados.</p>
            </div>

            <div class="card">
                <app-certificate-generation-types-form mode="create" [saving]="saving()" (save)="createGenerationType($event)" />
            </div>
        </div>
    `
})
export class CertificateGenerationTypesNew {
    private readonly generationTypesService = inject(CertificateGenerationTypesService);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    readonly saving = signal(false);

    async createGenerationType(payload: SaveCertificateGenerationTypePayload): Promise<void> {
        this.saving.set(true);

        try {
            await this.generationTypesService.createGenerationType(payload);
            this.messageService.add({ severity: 'success', summary: 'Tipo creado', detail: 'El tipo de generacion fue creado correctamente.', life: 2500 });
            await this.router.navigate(['/certificate-generation-types']);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el tipo de generacion. Revisa nombre unico y RLS.', life: 4500 });
        } finally {
            this.saving.set(false);
        }
    }
}
