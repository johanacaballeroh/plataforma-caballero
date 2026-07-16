import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { UnitsForm } from './units-form';
import { ManagedUnit, SaveUnitPayload, UnitsService } from './units.service';

@Component({
    selector: 'app-units-edit',
    standalone: true,
    imports: [ButtonModule, CommonModule, RouterModule, ToastModule, UnitsForm],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Catalogos</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Editar unidad</h1>
                <p class="text-muted-color max-w-3xl">Actualiza codigo, nombre, abreviatura y estado operativo.</p>
            </div>

            @if (loading()) {
                <div class="card">Cargando unidad...</div>
            } @else if (unit(); as currentUnit) {
                <div class="card">
                    <app-units-form mode="edit" [unit]="currentUnit" [saving]="saving()" (save)="updateUnit($event)" />
                </div>
            } @else {
                <div class="card flex flex-col gap-4">
                    <h2 class="text-xl font-semibold">Unidad no encontrada</h2>
                    <p class="text-muted-color">No se pudo cargar la unidad solicitada.</p>
                    <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/units" />
                </div>
            }
        </div>
    `
})
export class UnitsEdit implements OnInit {
    private readonly unitsService = inject(UnitsService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    readonly unit = signal<ManagedUnit | null>(null);
    readonly loading = signal(true);
    readonly saving = signal(false);

    async ngOnInit(): Promise<void> {
        const unitId = this.route.snapshot.paramMap.get('id');

        if (!unitId) {
            this.loading.set(false);

            return;
        }

        try {
            this.unit.set(await this.unitsService.getUnit(unitId));
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la unidad.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }

    async updateUnit(payload: SaveUnitPayload): Promise<void> {
        const unit = this.unit();

        if (!unit) {
            return;
        }

        this.saving.set(true);

        try {
            await this.unitsService.updateUnit(unit.id, payload);
            this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Unidad actualizada correctamente.', life: 2500 });
            await this.router.navigate(['/units']);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la unidad. Revisa permisos, codigo unico y RLS.', life: 4500 });
        } finally {
            this.saving.set(false);
        }
    }
}
