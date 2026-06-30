import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ItemTypesForm } from './item-types-form';
import { ItemTypesService, ManagedItemType, SaveItemTypePayload } from './item-types.service';

@Component({
    selector: 'app-item-types-edit',
    standalone: true,
    imports: [ButtonModule, CommonModule, ItemTypesForm, RouterModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Catalogos</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Editar tipo de item</h1>
                <p class="text-muted-color max-w-3xl">Actualiza el nombre y estado operativo del tipo de item.</p>
            </div>

            @if (loading()) {
                <div class="card">Cargando tipo de item...</div>
            } @else if (itemType(); as currentItemType) {
                <div class="card">
                    <app-item-types-form mode="edit" [itemType]="currentItemType" [saving]="saving()" (save)="updateItemType($event)" />
                </div>
            } @else {
                <div class="card flex flex-col gap-4">
                    <h2 class="text-xl font-semibold">Tipo de item no encontrado</h2>
                    <p class="text-muted-color">No se pudo cargar el tipo solicitado.</p>
                    <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/item-types" />
                </div>
            }
        </div>
    `
})
export class ItemTypesEdit implements OnInit {
    private readonly itemTypesService = inject(ItemTypesService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    readonly itemType = signal<ManagedItemType | null>(null);
    readonly loading = signal(true);
    readonly saving = signal(false);

    async ngOnInit(): Promise<void> {
        const itemTypeId = this.route.snapshot.paramMap.get('id');

        if (!itemTypeId) {
            this.loading.set(false);
            return;
        }

        try {
            this.itemType.set(await this.itemTypesService.getItemType(itemTypeId));
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el tipo de item.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }

    async updateItemType(payload: SaveItemTypePayload): Promise<void> {
        const itemType = this.itemType();

        if (!itemType) {
            return;
        }

        this.saving.set(true);

        try {
            await this.itemTypesService.updateItemType(itemType.id, payload);
            this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Tipo de item actualizado correctamente.', life: 2500 });
            await this.router.navigate(['/item-types']);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el tipo de item. Revisa permisos, nombre unico y RLS.', life: 4500 });
        } finally {
            this.saving.set(false);
        }
    }
}
