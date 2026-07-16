import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '@/app/core/auth/auth.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { UnitsForm } from './units-form';
import { ManagedUnit, UnitsService } from './units.service';

@Component({
    selector: 'app-units-detail',
    standalone: true,
    imports: [ButtonModule, CommonModule, RouterModule, ToastModule, UnitsForm],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Catalogos</span>
                <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Detalle de unidad</h1>
                        <p class="text-muted-color max-w-3xl mt-2">Consulta los datos de la unidad y su uso en items.</p>
                    </div>
                    @if (unit(); as currentUnit) {
                        <p-button label="Editar" icon="pi pi-pencil" [routerLink]="['/units', currentUnit.id, 'edit']" [disabled]="!auth.hasPermission('units.update')" />
                    }
                </div>
            </div>

            @if (loading()) {
                <div class="card">Cargando unidad...</div>
            } @else if (unit(); as currentUnit) {
                <div class="card">
                    <app-units-form mode="detail" [unit]="currentUnit" />
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
export class UnitsDetail implements OnInit {
    readonly auth = inject(AuthService);
    private readonly unitsService = inject(UnitsService);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);

    readonly unit = signal<ManagedUnit | null>(null);
    readonly loading = signal(true);

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
}
