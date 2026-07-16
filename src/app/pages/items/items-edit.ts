import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ItemsForm } from './items-form';
import { ItemFormOptions, ItemsService, ManagedItem, SaveItemPayload } from './items.service';

@Component({
    selector: 'app-items-edit',
    standalone: true,
    imports: [ButtonModule, CommonModule, ItemsForm, RouterModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Operacion</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Editar item</h1>
                <p class="text-muted-color max-w-3xl">Actualiza datos, clasificacion y estado operativo del item.</p>
            </div>

            @if (loading()) {
                <div class="card">Cargando item...</div>
            } @else if (item(); as currentItem) {
                <div class="card">
                    <app-items-form mode="edit" [item]="currentItem" [options]="options()" [saving]="saving()" (save)="updateItem($event)" />
                </div>
            } @else {
                <div class="card flex flex-col gap-4">
                    <h2 class="text-xl font-semibold">Item no encontrado</h2>
                    <p class="text-muted-color">No se pudo cargar el item solicitado.</p>
                    <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/items" />
                </div>
            }
        </div>
    `
})
export class ItemsEdit implements OnInit {
    private readonly itemsService = inject(ItemsService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    readonly item = signal<ManagedItem | null>(null);
    readonly options = signal<ItemFormOptions>({ units: [], categories: [], itemTypes: [], baselCodes: [] });
    readonly loading = signal(true);
    readonly saving = signal(false);

    async ngOnInit(): Promise<void> {
        await this.loadPageData();
    }

    async updateItem(payload: SaveItemPayload): Promise<void> {
        const item = this.item();

        if (!item) {
            return;
        }

        this.saving.set(true);

        try {
            await this.itemsService.updateItem(item.id, payload);
            this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Item actualizado correctamente.', life: 2500 });
            await this.router.navigate(['/items']);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el item. Revisa permisos, codigo unico, catalogos y RLS.', life: 4500 });
        } finally {
            this.saving.set(false);
        }
    }

    private async loadPageData(): Promise<void> {
        const itemId = this.route.snapshot.paramMap.get('id');

        if (!itemId) {
            this.loading.set(false);

            return;
        }

        try {
            const [item, options] = await Promise.all([this.itemsService.getItem(itemId), this.itemsService.getFormOptions()]);

            this.item.set(item);
            this.options.set(options);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el item.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }
}
