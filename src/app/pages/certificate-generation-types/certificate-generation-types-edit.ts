import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CertificateGenerationTypesForm } from './certificate-generation-types-form';
import { CertificateGenerationTypesService, ManagedCertificateGenerationType, SaveCertificateGenerationTypePayload } from './certificate-generation-types.service';

@Component({
    selector: 'app-certificate-generation-types-edit',
    standalone: true,
    imports: [ButtonModule, CertificateGenerationTypesForm, CommonModule, RouterModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Catalogos</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Editar tipo de generacion</h1>
                <p class="text-muted-color max-w-3xl">Actualiza datos operativos y reglas de campos de destino.</p>
            </div>

            @if (loading()) {
                <div class="card">Cargando tipo de generacion...</div>
            } @else if (generationType(); as currentGenerationType) {
                <div class="card">
                    <app-certificate-generation-types-form mode="edit" [generationType]="currentGenerationType" [saving]="saving()" (save)="updateGenerationType($event)" />
                </div>
            } @else {
                <div class="card flex flex-col gap-4">
                    <h2 class="text-xl font-semibold">Tipo de generacion no encontrado</h2>
                    <p class="text-muted-color">No se pudo cargar el tipo solicitado.</p>
                    <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/certificate-generation-types" />
                </div>
            }
        </div>
    `
})
export class CertificateGenerationTypesEdit implements OnInit {
    private readonly generationTypesService = inject(CertificateGenerationTypesService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    readonly generationType = signal<ManagedCertificateGenerationType | null>(null);
    readonly loading = signal(true);
    readonly saving = signal(false);

    async ngOnInit(): Promise<void> {
        const generationTypeId = this.route.snapshot.paramMap.get('id');

        if (!generationTypeId) {
            this.loading.set(false);
            return;
        }

        try {
            this.generationType.set(await this.generationTypesService.getGenerationType(generationTypeId));
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el tipo de generacion.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }

    async updateGenerationType(payload: SaveCertificateGenerationTypePayload): Promise<void> {
        const generationType = this.generationType();

        if (!generationType) {
            return;
        }

        this.saving.set(true);

        try {
            await this.generationTypesService.updateGenerationType(generationType.id, payload);
            this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Tipo de generacion actualizado correctamente.', life: 2500 });
            await this.router.navigate(['/certificate-generation-types']);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el tipo de generacion. Revisa permisos, nombre unico y RLS.', life: 4500 });
        } finally {
            this.saving.set(false);
        }
    }
}
