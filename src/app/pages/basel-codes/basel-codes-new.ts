import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { BaselCodesForm } from './basel-codes-form';
import { BaselCodesService, SaveBaselCodePayload } from './basel-codes.service';

@Component({
    selector: 'app-basel-codes-new',
    standalone: true,
    imports: [BaselCodesForm, CommonModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Catalogos</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Nuevo codigo Basilea</h1>
                <p class="text-muted-color max-w-3xl">Crea un codigo Basilea disponible para asociarlo a items.</p>
            </div>

            <div class="card">
                <app-basel-codes-form mode="create" [saving]="saving()" (save)="createBaselCode($event)" />
            </div>
        </div>
    `
})
export class BaselCodesNew {
    private readonly baselCodesService = inject(BaselCodesService);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    readonly saving = signal(false);

    async createBaselCode(payload: SaveBaselCodePayload): Promise<void> {
        this.saving.set(true);

        try {
            await this.baselCodesService.createBaselCode(payload);
            this.messageService.add({ severity: 'success', summary: 'Codigo creado', detail: 'El codigo Basilea fue creado correctamente.', life: 2500 });
            await this.router.navigate(['/basel-codes']);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el codigo Basilea. Revisa codigo unico y RLS.', life: 4500 });
        } finally {
            this.saving.set(false);
        }
    }
}
