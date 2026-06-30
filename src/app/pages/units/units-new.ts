import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { UnitsForm } from './units-form';
import { SaveUnitPayload, UnitsService } from './units.service';

@Component({
    selector: 'app-units-new',
    standalone: true,
    imports: [CommonModule, ToastModule, UnitsForm],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Catalogos</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Nueva unidad</h1>
                <p class="text-muted-color max-w-3xl">Crea una unidad de medida disponible para items.</p>
            </div>

            <div class="card">
                <app-units-form mode="create" [saving]="saving()" (save)="createUnit($event)" />
            </div>
        </div>
    `
})
export class UnitsNew {
    private readonly unitsService = inject(UnitsService);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    readonly saving = signal(false);

    async createUnit(payload: SaveUnitPayload): Promise<void> {
        this.saving.set(true);

        try {
            await this.unitsService.createUnit(payload);
            this.messageService.add({ severity: 'success', summary: 'Unidad creada', detail: 'La unidad fue creada correctamente.', life: 2500 });
            await this.router.navigate(['/units']);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la unidad. Revisa codigo unico y RLS.', life: 4500 });
        } finally {
            this.saving.set(false);
        }
    }
}
