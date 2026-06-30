import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '@/app/core/auth/auth.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CategoriesForm } from './categories-form';
import { CategoriesService, ManagedCategory } from './categories.service';

@Component({
    selector: 'app-categories-detail',
    standalone: true,
    imports: [ButtonModule, CategoriesForm, CommonModule, RouterModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Catalogos</span>
                <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Detalle de categoria</h1>
                        <p class="text-muted-color max-w-3xl mt-2">Consulta los datos de la categoria y su uso en items.</p>
                    </div>
                    @if (category(); as currentCategory) {
                        <p-button label="Editar" icon="pi pi-pencil" [routerLink]="['/categories', currentCategory.id, 'edit']" [disabled]="!auth.hasPermission('categories.update')" />
                    }
                </div>
            </div>

            @if (loading()) {
                <div class="card">Cargando categoria...</div>
            } @else if (category(); as currentCategory) {
                <div class="card">
                    <app-categories-form mode="detail" [category]="currentCategory" />
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
export class CategoriesDetail implements OnInit {
    readonly auth = inject(AuthService);
    private readonly categoriesService = inject(CategoriesService);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);

    readonly category = signal<ManagedCategory | null>(null);
    readonly loading = signal(true);

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
}
