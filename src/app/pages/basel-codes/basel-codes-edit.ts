import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { BaselCodesForm } from './basel-codes-form';
import { BaselCodesService, ManagedBaselCode, SaveBaselCodePayload } from './basel-codes.service';

@Component({
    selector: 'app-basel-codes-edit',
    standalone: true,
    imports: [BaselCodesForm, ButtonModule, CommonModule, RouterModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Catalogos</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Editar codigo Basilea</h1>
                <p class="text-muted-color max-w-3xl">Actualiza codigo, descripcion y estado operativo.</p>
            </div>

            @if (loading()) {
                <div class="card">Cargando codigo Basilea...</div>
            } @else if (baselCode(); as currentBaselCode) {
                <div class="card">
                    <app-basel-codes-form mode="edit" [baselCode]="currentBaselCode" [saving]="saving()" (save)="updateBaselCode($event)" />
                </div>
            } @else {
                <div class="card flex flex-col gap-4">
                    <h2 class="text-xl font-semibold">Codigo Basilea no encontrado</h2>
                    <p class="text-muted-color">No se pudo cargar el codigo solicitado.</p>
                    <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/basel-codes" />
                </div>
            }
        </div>
    `
})
export class BaselCodesEdit implements OnInit {
    private readonly baselCodesService = inject(BaselCodesService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    readonly baselCode = signal<ManagedBaselCode | null>(null);
    readonly loading = signal(true);
    readonly saving = signal(false);

    async ngOnInit(): Promise<void> {
        const baselCodeId = this.route.snapshot.paramMap.get('id');

        if (!baselCodeId) {
            this.loading.set(false);

            return;
        }

        try {
            this.baselCode.set(await this.baselCodesService.getBaselCode(baselCodeId));
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el codigo Basilea.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }

    async updateBaselCode(payload: SaveBaselCodePayload): Promise<void> {
        const baselCode = this.baselCode();

        if (!baselCode) {
            return;
        }

        this.saving.set(true);

        try {
            await this.baselCodesService.updateBaselCode(baselCode.id, payload);
            this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Codigo Basilea actualizado correctamente.', life: 2500 });
            await this.router.navigate(['/basel-codes']);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el codigo Basilea. Revisa permisos, codigo unico y RLS.', life: 4500 });
        } finally {
            this.saving.set(false);
        }
    }
}
