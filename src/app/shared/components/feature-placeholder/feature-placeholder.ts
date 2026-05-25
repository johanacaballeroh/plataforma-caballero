import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

@Component({
    selector: 'app-feature-placeholder',
    standalone: true,
    imports: [ButtonModule, RouterModule, TagModule],
    template: `
        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <div class="flex items-center gap-3">
                    <p-tag value="Preparado" severity="info" />
                    <span class="text-sm text-muted-color">{{ permissionLabel() }}</span>
                </div>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">{{ title() }}</h1>
                <!-- <p class="text-muted-color max-w-3xl">{{ description() }}</p> -->
            </div>

            <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-6 bg-surface-0 dark:bg-surface-900">
                <!-- <h2 class="text-xl font-medium mb-3">Base lista para implementacion</h2>
                <p class="text-muted-color mb-5">
                    Esta ruta ya usa el layout Sakai NG y guards de autenticacion/permisos. La pantalla CRUD se implementara en una tarea posterior segun el SDD.
                </p>
                <p-button label="Volver al dashboard" icon="pi pi-arrow-left" routerLink="/" /> -->
            </div>
        </div>
    `
})
export class FeaturePlaceholder {
    private readonly route = inject(ActivatedRoute);

    readonly title = computed(() => this.route.snapshot.data['title'] ?? 'Modulo');
    readonly description = computed(() => this.route.snapshot.data['description'] ?? 'Modulo preparado para una futura pantalla funcional.');
    readonly permissionLabel = computed(() => {
        const permissions = this.route.snapshot.data['permissions'] as string[] | undefined;
        return permissions?.length ? permissions.join(' / ') : 'Usuario autenticado';
    });
}
