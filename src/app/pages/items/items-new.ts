import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ItemsForm } from './items-form';
import { ItemFormOptions, ItemsService, SaveItemPayload } from './items.service';

@Component({
    selector: 'app-items-new',
    standalone: true,
    imports: [CommonModule, ItemsForm, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Operacion</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Nuevo item</h1>
                <p class="text-muted-color max-w-3xl">Crea un item valorizable o residuo disponible para certificados.</p>
            </div>

            <div class="card">
                <app-items-form mode="create" [options]="options()" [saving]="saving()" (save)="createItem($event)" />
            </div>
        </div>
    `
})
export class ItemsNew implements OnInit {
    private readonly itemsService = inject(ItemsService);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    readonly options = signal<ItemFormOptions>({ units: [], categories: [], itemTypes: [], baselCodes: [] });
    readonly saving = signal(false);

    async ngOnInit(): Promise<void> {
        await this.loadOptions();
    }

    async createItem(payload: SaveItemPayload): Promise<void> {
        this.saving.set(true);

        try {
            await this.itemsService.createItem(payload);
            this.messageService.add({ severity: 'success', summary: 'Item creado', detail: 'El item fue creado correctamente.', life: 2500 });
            await this.router.navigate(['/items']);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el item. Revisa codigo unico, catalogos y RLS.', life: 4500 });
        } finally {
            this.saving.set(false);
        }
    }

    private async loadOptions(): Promise<void> {
        try {
            this.options.set(await this.itemsService.getFormOptions());
        } catch {
            this.messageService.add({ severity: 'warn', summary: 'Catalogos', detail: 'No se pudieron cargar catalogos activos para el formulario.', life: 3500 });
        }
    }
}
