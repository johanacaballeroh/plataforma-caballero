import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CertificateDocumentsManager } from './certificate-documents-manager';
import { CertificateItemsManager } from './certificate-items-manager';
import { CertificatesForm, CertificateFormMode } from './certificates-form';
import { CertificateDraftDocument, CertificateFormOptions, ManagedCertificate, SaveCertificateItemPayload, SaveCertificatePayload } from './certificates.service';

export interface CertificateCompleteSaveEvent {
    certificate: SaveCertificatePayload;
    items: SaveCertificateItemPayload[];
    documents: CertificateDraftDocument[];
}

@Component({
    selector: 'app-certificate-complete-form',
    standalone: true,
    imports: [ButtonModule, CertificateDocumentsManager, CertificateItemsManager, CertificatesForm, CommonModule, RouterModule],
    template: `
        <div class="card flex flex-col gap-8">
            <app-certificates-form
                [mode]="mode"
                [certificate]="certificate"
                [options]="options"
                [nextCertificateNumber]="nextCertificateNumber"
                [saving]="saving"
                [showActions]="false"
                (save)="emitSave($event)"
            />

            <app-certificate-items-manager [certificateId]="certificate?.id ?? ''" [options]="options" [readOnly]="mode === 'detail'" [embedded]="true" />
            <app-certificate-documents-manager [certificateId]="certificate?.id ?? ''" [options]="options" [readOnly]="mode === 'detail'" [embedded]="true" />

            <div class="flex justify-end gap-3 border-t border-surface-200 pt-6 dark:border-surface-700">
                <p-button type="button" label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/certificates" />
                @if (mode !== 'detail') {
                    <p-button type="button" [label]="mode === 'create' ? 'Guardar Certificado' : 'Actualizar Certificado'" icon="pi pi-check" [loading]="saving" [disabled]="saving" (onClick)="submit()" />
                }
            </div>
        </div>
    `
})
export class CertificateCompleteForm {
    @Input() mode: CertificateFormMode = 'create';
    @Input() certificate: ManagedCertificate | null = null;
    @Input() options: CertificateFormOptions = { companies: [], generationTypes: [], templateVersions: [], companyAddresses: [], items: [], quantityTypes: [], documentTypes: [] };
    @Input() nextCertificateNumber: string | null = null;
    @Input() saving = false;
    @Output() save = new EventEmitter<CertificateCompleteSaveEvent>();

    @ViewChild(CertificatesForm) private certificatesForm?: CertificatesForm;
    @ViewChild(CertificateItemsManager) private itemsManager?: CertificateItemsManager;
    @ViewChild(CertificateDocumentsManager) private documentsManager?: CertificateDocumentsManager;

    submit(): void {
        this.certificatesForm?.submit();
    }

    emitSave(certificate: SaveCertificatePayload): void {
        this.save.emit({
            certificate,
            items: this.itemsManager?.getDraftItems() ?? [],
            documents: this.documentsManager?.getDraftDocuments() ?? []
        });
    }
}
