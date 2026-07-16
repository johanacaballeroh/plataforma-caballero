import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CategoriesForm } from './categories-form';
import { CategoriesService, ManagedCategory, SaveCategoryPayload } from './categories.service';

@Component({
    selector: 'app-categories-edit',
    standalone: true,
    imports: [ButtonModule, CategoriesForm, CommonModule, RouterModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Catalogos</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Editar categoria</h1>
                <p class="text-muted-color max-w-3xl">Actualiza nombre, descripcion y estado operativo.</p>
            </div>

            @if (loading()) {
                <div class="card">Cargando categoria...</div>
            } @else if (category(); as currentCategory) {
                <div class="card">
                    <app-categories-form mode="edit" [category]="currentCategory" [saving]="saving()" (save)="updateCategory($event)" />
                </div>
            } @else {
                <div class="card flex flex-col gap-4">
                    <h2 class="text-xl font-semibold">Categoria no encontrada</h2>
                    <p class="text-muted-color">No se pudo cargar la categoria solicitada.</p>
                    <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/categories" />
                </div>
            }
        </div>
    `
})
export class CategoriesEdit implements OnInit {
    private readonly categoriesService = inject(CategoriesService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    readonly category = signal<ManagedCategory | null>(null);
    readonly loading = signal(true);
    readonly saving = signal(false);

    async ngOnInit(): Promise<void> {
        const categoryId = this.route.snapshot.paramMap.get('id');

        if (!categoryId) {
            this.loading.set(false);

            return;
        }

        try {
            this.category.set(await this.categoriesService.getCategory(categoryId));
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la categoria.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }

    async updateCategory(payload: SaveCategoryPayload): Promise<void> {
        const category = this.category();

        if (!category) {
            return;
        }

        this.saving.set(true);

        try {
            await this.categoriesService.updateCategory(category.id, payload);
            this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Categoria actualizada correctamente.', life: 2500 });
            await this.router.navigate(['/categories']);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la categoria. Revisa permisos, nombre unico y RLS.', life: 4500 });
        } finally {
            this.saving.set(false);
        }
    }
}
