import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CertificateCompleteForm, CertificateCompleteSaveEvent } from './certificate-complete-form';
import { CertificateFormOptions, CertificatesService, ManagedCertificate } from './certificates.service';

@Component({
    selector: 'app-certificates-edit',
    standalone: true,
    imports: [ButtonModule, CertificateCompleteForm, CommonModule, RouterModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Operacion</span>
                <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Editar certificado</h1>
                        <p class="text-muted-color max-w-3xl mt-2">Actualiza la ficha, items y documentos del certificado.</p>
                    </div>
                    <p-button label="Ver detalle" icon="pi pi-eye" severity="secondary" [outlined]="true" [routerLink]="['/certificates', certificate()?.id]" [disabled]="!certificate()" />
                </div>
            </div>

            @if (loading()) {
                <div class="card">Cargando certificado...</div>
            } @else if (certificate(); as currentCertificate) {
                <app-certificate-complete-form mode="edit" [certificate]="currentCertificate" [options]="options()" [saving]="saving()" (save)="updateCertificate($event)" />
            } @else {
                <div class="card flex flex-col gap-4">
                    <h2 class="text-xl font-semibold">Certificado no encontrado</h2>
                    <p class="text-muted-color">No se pudo cargar el certificado solicitado.</p>
                    <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/certificates" />
                </div>
            }
        </div>
    `
})
export class CertificatesEdit implements OnInit {
    private readonly certificatesService = inject(CertificatesService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    readonly certificate = signal<ManagedCertificate | null>(null);
    readonly options = signal<CertificateFormOptions>({ companies: [], generationTypes: [], templateVersions: [], companyAddresses: [], items: [], quantityTypes: [], documentTypes: [] });
    readonly loading = signal(true);
    readonly saving = signal(false);

    async ngOnInit(): Promise<void> {
        const certificateId = this.route.snapshot.paramMap.get('id');

        if (!certificateId) {
            this.loading.set(false);

            return;
        }

        try {
            const [certificate, options] = await Promise.all([this.certificatesService.getCertificate(certificateId), this.certificatesService.getFormOptions()]);

            this.certificate.set(certificate);
            this.options.set(options);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el certificado.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }

    async updateCertificate(event: CertificateCompleteSaveEvent): Promise<void> {
        const currentCertificate = this.certificate();

        if (!currentCertificate) {
            return;
        }

        this.saving.set(true);

        try {
            const certificate = await this.certificatesService.updateCertificate(currentCertificate.id, event.certificate);

            await this.certificatesService.generateAndStoreCertificatePdf(certificate.id);
            this.certificate.set(certificate);
            this.messageService.add({ severity: 'success', summary: 'Certificado actualizado', detail: 'El certificado fue actualizado correctamente.', life: 2500 });
            await this.router.navigate(['/certificates', certificate.id]);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el certificado.', life: 3500 });
        } finally {
            this.saving.set(false);
        }
    }
}
