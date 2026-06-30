import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ItemTypesForm } from './item-types-form';
import { ItemTypesService, SaveItemTypePayload } from './item-types.service';

@Component({
    selector: 'app-item-types-new',
    standalone: true,
    imports: [CommonModule, ItemTypesForm, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Catalogos</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Nuevo tipo de item</h1>
                <p class="text-muted-color max-w-3xl">Crea un tipo disponible para clasificar items valorizables o residuos.</p>
            </div>

            <div class="card">
                <app-item-types-form mode="create" [saving]="saving()" (save)="createItemType($event)" />
            </div>
        </div>
    `
})
export class ItemTypesNew {
    private readonly itemTypesService = inject(ItemTypesService);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    readonly saving = signal(false);

    async createItemType(payload: SaveItemTypePayload): Promise<void> {
        this.saving.set(true);

        try {
            await this.itemTypesService.createItemType(payload);
            this.messageService.add({ severity: 'success', summary: 'Tipo creado', detail: 'El tipo de item fue creado correctamente.', life: 2500 });
            await this.router.navigate(['/item-types']);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el tipo de item. Revisa nombre unico y RLS.', life: 4500 });
        } finally {
            this.saving.set(false);
        }
    }
}
