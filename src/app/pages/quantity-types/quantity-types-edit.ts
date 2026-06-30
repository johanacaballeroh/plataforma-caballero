import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { QuantityTypesForm } from './quantity-types-form';
import { ManagedQuantityType, QuantityTypesService, SaveQuantityTypePayload } from './quantity-types.service';

@Component({
    selector: 'app-quantity-types-edit',
    standalone: true,
    imports: [ButtonModule, CommonModule, QuantityTypesForm, RouterModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Catalogos</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Editar tipo de cantidad</h1>
                <p class="text-muted-color max-w-3xl">Actualiza nombre, visibilidad de valor/cantidad y estado operativo.</p>
            </div>

            @if (loading()) {
                <div class="card">Cargando tipo de cantidad...</div>
            } @else if (quantityType(); as currentQuantityType) {
                <div class="card">
                    <app-quantity-types-form mode="edit" [quantityType]="currentQuantityType" [saving]="saving()" (save)="updateQuantityType($event)" />
                </div>
            } @else {
                <div class="card flex flex-col gap-4">
                    <h2 class="text-xl font-semibold">Tipo de cantidad no encontrado</h2>
                    <p class="text-muted-color">No se pudo cargar el tipo solicitado.</p>
                    <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/quantity-types" />
                </div>
            }
        </div>
    `
})
export class QuantityTypesEdit implements OnInit {
    private readonly quantityTypesService = inject(QuantityTypesService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    readonly quantityType = signal<ManagedQuantityType | null>(null);
    readonly loading = signal(true);
    readonly saving = signal(false);

    async ngOnInit(): Promise<void> {
        const quantityTypeId = this.route.snapshot.paramMap.get('id');

        if (!quantityTypeId) {
            this.loading.set(false);
            return;
        }

        try {
            this.quantityType.set(await this.quantityTypesService.getQuantityType(quantityTypeId));
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el tipo de cantidad.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }

    async updateQuantityType(payload: SaveQuantityTypePayload): Promise<void> {
        const quantityType = this.quantityType();

        if (!quantityType) {
            return;
        }

        this.saving.set(true);

        try {
            await this.quantityTypesService.updateQuantityType(quantityType.id, payload);
            this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Tipo de cantidad actualizado correctamente.', life: 2500 });
            await this.router.navigate(['/quantity-types']);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el tipo de cantidad. Revisa permisos, nombre unico y RLS.', life: 4500 });
        } finally {
            this.saving.set(false);
        }
    }
}
