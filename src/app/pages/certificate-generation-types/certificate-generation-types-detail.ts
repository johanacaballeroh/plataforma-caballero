import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '@/app/core/auth/auth.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CertificateGenerationTypesForm } from './certificate-generation-types-form';
import { CertificateGenerationTypesService, CertificateTemplateVersion, ManagedCertificateGenerationType } from './certificate-generation-types.service';

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
                        <div class="flex flex-wrap gap-2">
                            <p-button label="Ver PDF" icon="pi pi-file-pdf" severity="danger" (onClick)="openActiveTemplate(currentGenerationType)" [disabled]="!currentGenerationType.active_template || !auth.hasPermission('certificate_templates.view')" />
                            <p-button label="Editar" icon="pi pi-pencil" [routerLink]="['/certificate-generation-types', currentGenerationType.id, 'edit']" [disabled]="!auth.hasPermission('certificate_generation_types.update')" />
                        </div>
                    }
                </div>
            </div>

            @if (loading()) {
                <div class="card">Cargando tipo de generacion...</div>
            } @else if (generationType(); as currentGenerationType) {
                <div class="card">
                    <app-certificate-generation-types-form mode="detail" [generationType]="currentGenerationType" [canViewTemplates]="auth.hasPermission('certificate_templates.view')" (viewTemplate)="openTemplate(currentGenerationType, $event)" />
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

    async openActiveTemplate(generationType: ManagedCertificateGenerationType): Promise<void> {
        const template = generationType.active_template;

        if (!template) {
            this.messageService.add({ severity: 'warn', summary: 'PDF', detail: 'Este tipo no tiene plantilla de certificado activa.', life: 3000 });

            return;
        }

        await this.openTemplate(generationType, template);
    }

    async openTemplate(generationType: ManagedCertificateGenerationType, template: CertificateTemplateVersion): Promise<void> {
        try {
            const pdf = await this.generationTypesService.createTemplatePdfUrl(generationType.id, template);

            window.open(pdf.url, '_blank', 'noopener,noreferrer');

            if (pdf.usedFallback) {
                this.messageService.add({ severity: 'warn', summary: 'PDF', detail: `La plantilla activa no se encontro en Storage. Se abrio ${pdf.template.name} v${pdf.template.version_number}.`, life: 5000 });
            }
        } catch (error) {
            const detail = error instanceof Error ? error.message : 'No se pudo abrir la plantilla PDF.';

            this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 5000 });
        }
    }
}
