import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CategoriesForm } from './categories-form';
import { CategoriesService, SaveCategoryPayload } from './categories.service';

@Component({
    selector: 'app-categories-new',
    standalone: true,
    imports: [CategoriesForm, CommonModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Catalogos</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Nueva categoria</h1>
                <p class="text-muted-color max-w-3xl">Crea una categoria disponible para clasificar items.</p>
            </div>

            <div class="card">
                <app-categories-form mode="create" [saving]="saving()" (save)="createCategory($event)" />
            </div>
        </div>
    `
})
export class CategoriesNew {
    private readonly categoriesService = inject(CategoriesService);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    readonly saving = signal(false);

    async createCategory(payload: SaveCategoryPayload): Promise<void> {
        this.saving.set(true);

        try {
            await this.categoriesService.createCategory(payload);
            this.messageService.add({ severity: 'success', summary: 'Categoria creada', detail: 'La categoria fue creada correctamente.', life: 2500 });
            await this.router.navigate(['/categories']);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la categoria. Revisa nombre unico y RLS.', life: 4500 });
        } finally {
            this.saving.set(false);
        }
    }
}
