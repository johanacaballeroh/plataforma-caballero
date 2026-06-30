import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { DocumentTypeStatus, ManagedDocumentType, SaveDocumentTypePayload } from './document-types.service';

export type DocumentTypeFormMode = 'create' | 'edit' | 'detail';

@Component({
    selector: 'app-document-types-form',
    standalone: true,
    imports: [ButtonModule, CommonModule, DatePipe, InputTextModule, MessageModule, ReactiveFormsModule, RouterModule, SelectModule, TagModule],
    template: `
        <form [formGroup]="form" (ngSubmit)="submit()" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 flex flex-col gap-5">
                <div class="flex flex-col gap-2">
                    <label for="name" class="font-medium">Nombre</label>
                    <input pInputText id="name" formControlName="name" />
                    @if (form.controls.name.touched && form.controls.name.invalid) {
                        <small class="text-red-500">El nombre es obligatorio.</small>
                    }
                </div>

                <div class="flex flex-col gap-2">
                    <label for="status" class="font-medium">Estado</label>
                    <p-select inputId="status" formControlName="status" [options]="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
                    @if (form.controls.status.touched && form.controls.status.invalid) {
                        <small class="text-red-500">Selecciona un estado valido.</small>
                    }
                </div>

                @if (mode !== 'detail') {
                    <p-message severity="info" text="Los tipos inactivos no deberian seleccionarse al adjuntar nuevos documentos." />
                }
            </div>

            <div class="lg:col-span-1">
                @if (documentType) {
                    <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4 flex flex-col gap-3">
                        <div>
                            <span class="text-sm text-muted-color">Estado actual</span>
                            <div class="mt-1"><p-tag [value]="statusLabel(documentType.status)" [severity]="documentType.status === 'active' ? 'success' : 'danger'" /></div>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Documentos asociados</span>
                            <p class="font-medium">{{ documentType.documents_count }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Creado</span>
                            <p class="font-medium">{{ documentType.created_at | date: 'dd/MM/yyyy HH:mm' }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Actualizado</span>
                            <p class="font-medium">{{ documentType.updated_at | date: 'dd/MM/yyyy HH:mm' }}</p>
                        </div>
                    </div>
                } @else {
                    <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                        <span class="text-sm text-muted-color">Tabla Supabase</span>
                        <p class="font-medium">document_types</p>
                    </div>
                }
            </div>

            <div class="lg:col-span-3 flex justify-end gap-3">
                <p-button type="button" label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/document-types" />
                @if (mode !== 'detail') {
                    <p-button type="submit" label="Guardar" icon="pi pi-save" [loading]="saving" [disabled]="form.invalid || saving" />
                }
            </div>
        </form>
    `
})
export class DocumentTypesForm implements OnChanges {
    private readonly fb = inject(FormBuilder);

    @Input() mode: DocumentTypeFormMode = 'create';
    @Input() documentType: ManagedDocumentType | null = null;
    @Input() saving = false;
    @Output() save = new EventEmitter<SaveDocumentTypePayload>();

    readonly statusOptions: { label: string; value: DocumentTypeStatus }[] = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' }
    ];

    readonly form = this.fb.nonNullable.group({
        name: ['', Validators.required],
        status: ['active' as DocumentTypeStatus, Validators.required]
    });

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['documentType'] || changes['mode']) {
            this.syncForm();
        }
    }

    submit(): void {
        this.form.markAllAsTouched();

        if (this.mode === 'detail' || this.form.invalid) {
            return;
        }

        const value = this.form.getRawValue();
        this.save.emit({
            name: value.name,
            status: value.status
        });
    }

    statusLabel(status: DocumentTypeStatus): string {
        return status === 'active' ? 'Activo' : 'Inactivo';
    }

    private syncForm(): void {
        if (this.documentType) {
            this.form.reset({
                name: this.documentType.name,
                status: this.documentType.status
            });
        } else {
            this.form.reset({ name: '', status: 'active' });
        }

        if (this.mode === 'detail') {
            this.form.disable();
            return;
        }

        this.form.enable();
    }
}
