import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '@/app/core/auth/auth.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { BaselCodesForm } from './basel-codes-form';
import { BaselCodesService, ManagedBaselCode } from './basel-codes.service';

@Component({
    selector: 'app-basel-codes-detail',
    standalone: true,
    imports: [BaselCodesForm, ButtonModule, CommonModule, RouterModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Catalogos</span>
                <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Detalle de codigo Basilea</h1>
                        <p class="text-muted-color max-w-3xl mt-2">Consulta el codigo Basilea, descripcion y uso en items.</p>
                    </div>
                    @if (baselCode(); as currentBaselCode) {
                        <p-button label="Editar" icon="pi pi-pencil" [routerLink]="['/basel-codes', currentBaselCode.id, 'edit']" [disabled]="!auth.hasPermission('basel_codes.update')" />
                    }
                </div>
            </div>

            @if (loading()) {
                <div class="card">Cargando codigo Basilea...</div>
            } @else if (baselCode(); as currentBaselCode) {
                <div class="card">
                    <app-basel-codes-form mode="detail" [baselCode]="currentBaselCode" />
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
export class BaselCodesDetail implements OnInit {
    readonly auth = inject(AuthService);
    private readonly baselCodesService = inject(BaselCodesService);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);

    readonly baselCode = signal<ManagedBaselCode | null>(null);
    readonly loading = signal(true);

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
}
