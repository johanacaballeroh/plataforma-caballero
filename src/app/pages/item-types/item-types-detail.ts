import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '@/app/core/auth/auth.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ItemTypesForm } from './item-types-form';
import { ItemTypesService, ManagedItemType } from './item-types.service';

@Component({
    selector: 'app-item-types-detail',
    standalone: true,
    imports: [ButtonModule, CommonModule, ItemTypesForm, RouterModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Catalogos</span>
                <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Detalle de tipo de item</h1>
                        <p class="text-muted-color max-w-3xl mt-2">Consulta los datos del tipo y su uso en items.</p>
                    </div>
                    @if (itemType(); as currentItemType) {
                        <p-button label="Editar" icon="pi pi-pencil" [routerLink]="['/item-types', currentItemType.id, 'edit']" [disabled]="!auth.hasPermission('item_types.update')" />
                    }
                </div>
            </div>

            @if (loading()) {
                <div class="card">Cargando tipo de item...</div>
            } @else if (itemType(); as currentItemType) {
                <div class="card">
                    <app-item-types-form mode="detail" [itemType]="currentItemType" />
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
export class ItemTypesDetail implements OnInit {
    readonly auth = inject(AuthService);
    private readonly itemTypesService = inject(ItemTypesService);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);

    readonly itemType = signal<ManagedItemType | null>(null);
    readonly loading = signal(true);

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
}
