import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '@/app/core/auth/auth.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DocumentTypesForm } from './document-types-form';
import { DocumentTypesService, ManagedDocumentType } from './document-types.service';

@Component({
    selector: 'app-document-types-detail',
    standalone: true,
    imports: [ButtonModule, CommonModule, DocumentTypesForm, RouterModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Catalogos</span>
                <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Detalle de tipo de documento</h1>
                        <p class="text-muted-color max-w-3xl mt-2">Consulta los datos del tipo de documento y su uso en certificados.</p>
                    </div>
                    @if (documentType(); as currentDocumentType) {
                        <p-button label="Editar" icon="pi pi-pencil" [routerLink]="['/document-types', currentDocumentType.id, 'edit']" [disabled]="!auth.hasPermission('document_types.update')" />
                    }
                </div>
            </div>

            @if (loading()) {
                <div class="card">Cargando tipo de documento...</div>
            } @else if (documentType(); as currentDocumentType) {
                <div class="card">
                    <app-document-types-form mode="detail" [documentType]="currentDocumentType" />
                </div>
            } @else {
                <div class="card flex flex-col gap-4">
                    <h2 class="text-xl font-semibold">Tipo de documento no encontrado</h2>
                    <p class="text-muted-color">No se pudo cargar el tipo solicitado.</p>
                    <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/document-types" />
                </div>
            }
        </div>
    `
})
export class DocumentTypesDetail implements OnInit {
    readonly auth = inject(AuthService);
    private readonly documentTypesService = inject(DocumentTypesService);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);

    readonly documentType = signal<ManagedDocumentType | null>(null);
    readonly loading = signal(true);

    async ngOnInit(): Promise<void> {
        const documentTypeId = this.route.snapshot.paramMap.get('id');

        if (!documentTypeId) {
            this.loading.set(false);

            return;
        }

        try {
            this.documentType.set(await this.documentTypesService.getDocumentType(documentTypeId));
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el tipo de documento.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }
}
