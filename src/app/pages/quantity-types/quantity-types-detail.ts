import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '@/app/core/auth/auth.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { QuantityTypesForm } from './quantity-types-form';
import { ManagedQuantityType, QuantityTypesService } from './quantity-types.service';

@Component({
    selector: 'app-quantity-types-detail',
    standalone: true,
    imports: [ButtonModule, CommonModule, QuantityTypesForm, RouterModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Catalogos</span>
                <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Detalle de tipo de cantidad</h1>
                        <p class="text-muted-color max-w-3xl mt-2">Consulta los datos del tipo de cantidad y su uso en items de certificados.</p>
                    </div>
                    @if (quantityType(); as currentQuantityType) {
                        <p-button label="Editar" icon="pi pi-pencil" [routerLink]="['/quantity-types', currentQuantityType.id, 'edit']" [disabled]="!auth.hasPermission('quantity_types.update')" />
                    }
                </div>
            </div>

            @if (loading()) {
                <div class="card">Cargando tipo de cantidad...</div>
            } @else if (quantityType(); as currentQuantityType) {
                <div class="card">
                    <app-quantity-types-form mode="detail" [quantityType]="currentQuantityType" />
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
export class QuantityTypesDetail implements OnInit {
    readonly auth = inject(AuthService);
    private readonly quantityTypesService = inject(QuantityTypesService);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);

    readonly quantityType = signal<ManagedQuantityType | null>(null);
    readonly loading = signal(true);

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
}
