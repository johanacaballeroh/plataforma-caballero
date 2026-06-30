import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '@/app/core/auth/auth.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ItemsForm } from './items-form';
import { ItemFormOptions, ItemsService, ManagedItem } from './items.service';

@Component({
    selector: 'app-items-detail',
    standalone: true,
    imports: [ButtonModule, CommonModule, ItemsForm, RouterModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Operacion</span>
                <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Detalle de item</h1>
                        <p class="text-muted-color max-w-3xl mt-2">Consulta datos, clasificacion y uso del item en certificados.</p>
                    </div>
                    @if (item(); as currentItem) {
                        <p-button label="Editar" icon="pi pi-pencil" [routerLink]="['/items', currentItem.id, 'edit']" [disabled]="!auth.hasPermission('items.update')" />
                    }
                </div>
            </div>

            @if (loading()) {
                <div class="card">Cargando item...</div>
            } @else if (item(); as currentItem) {
                <div class="card">
                    <app-items-form mode="detail" [item]="currentItem" [options]="options()" />
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
export class ItemsDetail implements OnInit {
    readonly auth = inject(AuthService);
    private readonly itemsService = inject(ItemsService);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);

    readonly item = signal<ManagedItem | null>(null);
    readonly options = signal<ItemFormOptions>({ units: [], categories: [], itemTypes: [], baselCodes: [] });
    readonly loading = signal(true);

    async ngOnInit(): Promise<void> {
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
