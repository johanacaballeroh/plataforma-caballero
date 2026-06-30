import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { QuantityTypesForm } from './quantity-types-form';
import { QuantityTypesService, SaveQuantityTypePayload } from './quantity-types.service';

@Component({
    selector: 'app-quantity-types-new',
    standalone: true,
    imports: [CommonModule, QuantityTypesForm, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Catalogos</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Nuevo tipo de cantidad</h1>
                <p class="text-muted-color max-w-3xl">Crea un tipo disponible para clasificar cantidades en items de certificados.</p>
            </div>

            <div class="card">
                <app-quantity-types-form mode="create" [saving]="saving()" (save)="createQuantityType($event)" />
            </div>
        </div>
    `
})
export class QuantityTypesNew {
    private readonly quantityTypesService = inject(QuantityTypesService);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    readonly saving = signal(false);

    async createQuantityType(payload: SaveQuantityTypePayload): Promise<void> {
        this.saving.set(true);

        try {
            await this.quantityTypesService.createQuantityType(payload);
            this.messageService.add({ severity: 'success', summary: 'Tipo creado', detail: 'El tipo de cantidad fue creado correctamente.', life: 2500 });
            await this.router.navigate(['/quantity-types']);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el tipo de cantidad. Revisa nombre unico y RLS.', life: 4500 });
        } finally {
            this.saving.set(false);
        }
    }
}
