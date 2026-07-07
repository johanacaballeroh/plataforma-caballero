import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CertificatesForm } from './certificates-form';
import { CertificateFormOptions, CertificatesService, SaveCertificatePayload } from './certificates.service';

@Component({
    selector: 'app-certificates-new',
    standalone: true,
    imports: [CertificatesForm, CommonModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Operacion</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Nuevo certificado</h1>
                <p class="text-muted-color max-w-3xl">Registra la ficha base del certificado. Luego podras agregar items y documentos desde la edicion.</p>
            </div>

            @if (loading()) {
                <div class="card">Cargando catalogos...</div>
            } @else {
                <div class="card">
                    <app-certificates-form mode="create" [options]="options()" [nextCertificateNumber]="nextCertificateNumber()" [saving]="saving()" (save)="createCertificate($event)" />
                </div>
            }
        </div>
    `
})
export class CertificatesNew implements OnInit {
    private readonly certificatesService = inject(CertificatesService);
    private readonly messageService = inject(MessageService);
    private readonly router = inject(Router);

    readonly options = signal<CertificateFormOptions>({ companies: [], generationTypes: [], templateVersions: [], companyAddresses: [], items: [], quantityTypes: [], documentTypes: [] });
    readonly nextCertificateNumber = signal<string | null>(null);
    readonly loading = signal(true);
    readonly saving = signal(false);

    async ngOnInit(): Promise<void> {
        try {
            const today = new Date().toISOString().slice(0, 10);
            const [options, nextCertificateNumber] = await Promise.all([this.certificatesService.getFormOptions(), this.certificatesService.previewNextCertificateNumber(today)]);
            this.options.set(options);
            this.nextCertificateNumber.set(nextCertificateNumber);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar catalogos.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }

    async createCertificate(payload: SaveCertificatePayload): Promise<void> {
        this.saving.set(true);

        try {
            const certificate = await this.certificatesService.createCertificate(payload);
            this.messageService.add({ severity: 'success', summary: 'Certificado creado', detail: 'El certificado fue registrado correctamente.', life: 2500 });
            await this.router.navigate(['/certificates', certificate.id, 'edit']);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el certificado. Revisa numero unico, permisos y RLS.', life: 4000 });
        } finally {
            this.saving.set(false);
        }
    }
}
