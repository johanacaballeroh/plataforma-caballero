import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '@/app/core/auth/auth.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CertificateCompleteForm } from './certificate-complete-form';
import { CertificateFormOptions, CertificatesService, ManagedCertificate } from './certificates.service';

@Component({
    selector: 'app-certificates-detail',
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
                        <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Detalle de certificado</h1>
                        <p class="text-muted-color max-w-3xl mt-2">Consulta ficha, items, documentos adjuntos y PDF del certificado.</p>
                    </div>
                    @if (certificate(); as currentCertificate) {
                        <div class="flex flex-wrap gap-2">
                            <p-button label="Ver PDF" icon="pi pi-file-pdf" severity="danger" (onClick)="openCurrentPdf(currentCertificate)" [disabled]="!currentCertificate.files_count || !auth.hasPermission('certificates.print')" />
                            <p-button label="Editar" icon="pi pi-pencil" [routerLink]="['/certificates', currentCertificate.id, 'edit']" [disabled]="!auth.hasPermission('certificates.update')" />
                        </div>
                    }
                </div>
            </div>

            @if (loading()) {
                <div class="card">Cargando certificado...</div>
            } @else if (certificate(); as currentCertificate) {
                <app-certificate-complete-form mode="detail" [certificate]="currentCertificate" [options]="options()" />
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
export class CertificatesDetail implements OnInit {
    readonly auth = inject(AuthService);
    private readonly certificatesService = inject(CertificatesService);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);

    readonly certificate = signal<ManagedCertificate | null>(null);
    readonly options = signal<CertificateFormOptions>({ companies: [], generationTypes: [], templateVersions: [], companyAddresses: [], items: [], quantityTypes: [], documentTypes: [] });
    readonly loading = signal(true);

    async ngOnInit(): Promise<void> {
        const certificateId = this.route.snapshot.paramMap.get('id');

        if (!certificateId) {
            this.loading.set(false);

            return;
        }

        await this.loadCertificate(certificateId);
    }

    async openCurrentPdf(certificate: ManagedCertificate): Promise<void> {
        try {
            const pdf = await this.certificatesService.getCertificatePdf(certificate.id);

            if (!pdf) {
                this.messageService.add({ severity: 'warn', summary: 'PDF', detail: 'No hay PDF generado para este certificado.', life: 3000 });

                return;
            }

            const url = await this.certificatesService.createSignedUrl(pdf.storage_bucket, pdf.storage_path);

            window.open(url, '_blank', 'noopener,noreferrer');
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo abrir el PDF.', life: 3500 });
        }
    }

    private async loadCertificate(certificateId: string): Promise<void> {
        this.loading.set(true);

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
}
