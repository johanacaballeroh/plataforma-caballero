import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '@/app/core/auth/auth.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CertificateGenerationTypesForm } from './certificate-generation-types-form';
import { CertificateGenerationTypesService, ManagedCertificateGenerationType } from './certificate-generation-types.service';

@Component({
    selector: 'app-certificate-generation-types-detail',
    standalone: true,
    imports: [ButtonModule, CertificateGenerationTypesForm, CommonModule, RouterModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Catalogos</span>
                <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Detalle de tipo de generacion</h1>
                        <p class="text-muted-color max-w-3xl mt-2">Consulta datos, reglas de destino y relaciones con certificados o plantillas.</p>
                    </div>
                    @if (generationType(); as currentGenerationType) {
                        <p-button label="Editar" icon="pi pi-pencil" [routerLink]="['/certificate-generation-types', currentGenerationType.id, 'edit']" [disabled]="!auth.hasPermission('certificate_generation_types.update')" />
                    }
                </div>
            </div>

            @if (loading()) {
                <div class="card">Cargando tipo de generacion...</div>
            } @else if (generationType(); as currentGenerationType) {
                <div class="card">
                    <app-certificate-generation-types-form mode="detail" [generationType]="currentGenerationType" />
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
export class CertificateGenerationTypesDetail implements OnInit {
    readonly auth = inject(AuthService);
    private readonly generationTypesService = inject(CertificateGenerationTypesService);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);

    readonly generationType = signal<ManagedCertificateGenerationType | null>(null);
    readonly loading = signal(true);

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
}
