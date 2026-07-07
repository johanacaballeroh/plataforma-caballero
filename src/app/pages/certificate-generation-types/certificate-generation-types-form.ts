import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { CertificateGenerationTypeStatus, CertificateTemplateVersion, ManagedCertificateGenerationType, SaveCertificateGenerationTypePayload } from './certificate-generation-types.service';

export type CertificateGenerationTypeFormMode = 'create' | 'edit' | 'detail';

@Component({
    selector: 'app-certificate-generation-types-form',
    standalone: true,
    imports: [ButtonModule, CommonModule, DatePipe, InputTextModule, MessageModule, ReactiveFormsModule, RouterModule, SelectModule, TableModule, TagModule, TextareaModule, ToggleSwitchModule],
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
                    <label for="description" class="font-medium">Declaracion Legal</label>
                    <textarea pTextarea id="description" formControlName="description" rows="5" [readonly]="mode === 'detail'"></textarea>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex flex-col gap-2">
                        <label for="showFinalDestinationCompany" class="font-medium">Mostrar empresa destino final</label>
                        <div class="flex items-center gap-3 min-h-10">
                            <p-toggleswitch inputId="showFinalDestinationCompany" formControlName="show_final_destination_company" />
                            <span class="text-muted-color">{{ form.controls.show_final_destination_company.value ? 'Visible en certificado' : 'Oculto en certificado' }}</span>
                        </div>
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="showDestinationPlace" class="font-medium">Mostrar lugar de destino</label>
                        <div class="flex items-center gap-3 min-h-10">
                            <p-toggleswitch inputId="showDestinationPlace" formControlName="show_destination_place" />
                            <span class="text-muted-color">{{ form.controls.show_destination_place.value ? 'Visible en certificado' : 'Oculto en certificado' }}</span>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <label for="status" class="font-medium">Estado</label>
                    <p-select inputId="status" formControlName="status" [options]="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
                    @if (form.controls.status.touched && form.controls.status.invalid) {
                        <small class="text-red-500">Selecciona un estado valido.</small>
                    }
                </div>

                <div class="flex flex-col gap-3 border-t border-surface-200 pt-5 dark:border-surface-700">
                    <div class="flex flex-col gap-1">
                        <label for="templateFile" class="font-medium">Plantilla de certificado</label>
                        @if (generationType?.active_template) {
                            <small class="text-muted-color">Template activo: {{ generationType?.active_template?.name }} v{{ generationType?.active_template?.version_number }}</small>
                        } @else {
                            <small class="text-muted-color">Adjunta el PDF que se usara posteriormente como template en la generacion de certificados.</small>
                        }
                    </div>

                    @if (mode !== 'detail') {
                        <input #templateFileInput pInputText id="templateFile" type="file" accept="application/pdf,.pdf" (change)="selectTemplateFile($event)" />
                        @if (selectedTemplateFile(); as file) {
                            <small class="text-primary">Nuevo PDF seleccionado: {{ file.name }} ({{ formatSize(file.size) }})</small>
                        }
                        @if (templateFileError()) {
                            <small class="text-red-500">{{ templateFileError() }}</small>
                        }
                        @if (mode === 'create') {
                            <p-message severity="info" text="Al guardar, este PDF quedara como la version activa de la plantilla de certificado." />
                        } @else {
                            <p-message severity="info" text="Si adjuntas un nuevo PDF, se creara una nueva version activa sin modificar plantillas historicas." />
                        }
                    } @else if (generationType?.active_template) {
                        <p-message severity="success" text="Este tipo tiene una plantilla de certificado activa." />
                    } @else {
                        <p-message severity="warn" text="Este tipo aun no tiene plantilla de certificado activa." />
                    }

                    @if (generationType?.template_versions?.length) {
                        <div class="flex flex-col gap-3 mt-2">
                            <div>
                                <h3 class="text-base font-semibold text-surface-900 dark:text-surface-0">Historial de plantillas</h3>
                                <p class="text-sm text-muted-color">Versiones subidas para este tipo y certificados que usan cada plantilla.</p>
                            </div>

                            <p-table [value]="generationType?.template_versions ?? []" responsiveLayout="scroll" [tableStyle]="{ 'min-width': '52rem' }">
                                <ng-template #header>
                                    <tr>
                                        <th style="min-width: 7rem">Version</th>
                                        <th style="min-width: 18rem">Plantilla</th>
                                        <th style="min-width: 10rem">Actualizada</th>
                                        <th style="min-width: 9rem">Certificados</th>
                                        <th style="width: 8rem"></th>
                                    </tr>
                                </ng-template>
                                <ng-template #body let-template>
                                    <tr>
                                        <td>
                                            <div class="flex items-center gap-2">
                                                <span class="font-medium">v{{ template.version_number }}</span>
                                                @if (template.is_active) {
                                                    <p-tag value="Activa" severity="success" />
                                                }
                                            </div>
                                        </td>
                                        <td>
                                            <div class="flex flex-col gap-1">
                                                <span class="font-medium">{{ template.name }}</span>
                                                <small class="text-muted-color">{{ template.storage_path }}</small>
                                            </div>
                                        </td>
                                        <td>{{ template.created_at | date: 'dd/MM/yyyy HH:mm' }}</td>
                                        <td>{{ template.certificates_count }}</td>
                                        <td>
                                            <div class="flex justify-end">
                                                <p-button type="button" label="Ver" icon="pi pi-file-pdf" severity="danger" [outlined]="true" size="small" (onClick)="requestTemplateView(template)" [disabled]="!canViewTemplates" />
                                            </div>
                                        </td>
                                    </tr>
                                </ng-template>
                            </p-table>
                        </div>
                    }
                </div>
            </div>

            <div class="lg:col-span-1">
                @if (generationType) {
                    <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4 flex flex-col gap-3">
                        <div>
                            <span class="text-sm text-muted-color">Estado actual</span>
                            <div class="mt-1"><p-tag [value]="statusLabel(generationType.status)" [severity]="generationType.status === 'active' ? 'success' : 'danger'" /></div>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Empresa destino final</span>
                            <div class="mt-1"><p-tag [value]="generationType.show_final_destination_company ? 'Visible' : 'Oculta'" [severity]="generationType.show_final_destination_company ? 'info' : 'secondary'" /></div>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Lugar de destino</span>
                            <div class="mt-1"><p-tag [value]="generationType.show_destination_place ? 'Visible' : 'Oculto'" [severity]="generationType.show_destination_place ? 'info' : 'secondary'" /></div>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Certificados asociados</span>
                            <p class="font-medium">{{ generationType.certificates_count }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Plantillas versionadas</span>
                            <p class="font-medium">{{ generationType.templates_count }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Creado</span>
                            <p class="font-medium">{{ generationType.created_at | date: 'dd/MM/yyyy HH:mm' }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Actualizado</span>
                            <p class="font-medium">{{ generationType.updated_at | date: 'dd/MM/yyyy HH:mm' }}</p>
                        </div>
                    </div>
                } @else {
                    <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                        <span class="text-sm text-muted-color">Tabla Supabase</span>
                        <p class="font-medium">certificate_generation_types</p>
                    </div>
                }
            </div>

            <div class="lg:col-span-3 flex justify-end gap-3">
                <p-button type="button" label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/certificate-generation-types" />
                @if (mode !== 'detail') {
                    <p-button type="submit" label="Guardar" icon="pi pi-save" [loading]="saving" [disabled]="form.invalid || !isTemplateSelectionValid() || saving" />
                }
            </div>
        </form>
    `
})
export class CertificateGenerationTypesForm implements OnChanges {
    private readonly fb = inject(FormBuilder);

    @ViewChild('templateFileInput') templateFileInput?: ElementRef<HTMLInputElement>;
    @Input() mode: CertificateGenerationTypeFormMode = 'create';
    @Input() generationType: ManagedCertificateGenerationType | null = null;
    @Input() saving = false;
    @Input() canViewTemplates = false;
    @Output() save = new EventEmitter<SaveCertificateGenerationTypePayload>();
    @Output() viewTemplate = new EventEmitter<CertificateTemplateVersion>();

    readonly selectedTemplateFile = signal<File | null>(null);
    readonly templateFileError = signal<string | null>(null);

    readonly statusOptions: { label: string; value: CertificateGenerationTypeStatus }[] = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' }
    ];

    readonly form = this.fb.nonNullable.group({
        name: ['', Validators.required],
        description: [''],
        show_final_destination_company: [true, Validators.required],
        show_destination_place: [true, Validators.required],
        status: ['active' as CertificateGenerationTypeStatus, Validators.required]
    });

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['generationType'] || changes['mode']) {
            this.syncForm();
        }
    }

    submit(): void {
        this.form.markAllAsTouched();

        if (this.mode === 'detail' || this.form.invalid || !this.isTemplateSelectionValid()) {
            return;
        }

        const value = this.form.getRawValue();
        this.save.emit({
            name: value.name,
            description: value.description || null,
            show_final_destination_company: value.show_final_destination_company,
            show_destination_place: value.show_destination_place,
            status: value.status,
            template_file: this.selectedTemplateFile()
        });
    }

    selectTemplateFile(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0] ?? null;

        this.selectedTemplateFile.set(file);
        this.templateFileError.set(this.validateTemplateFile(file));
    }

    isTemplateSelectionValid(): boolean {
        return !this.validateTemplateFile(this.selectedTemplateFile());
    }

    formatSize(size: number): string {
        if (size < 1024 * 1024) {
            return `${(size / 1024).toFixed(1)} KB`;
        }

        return `${(size / 1024 / 1024).toFixed(1)} MB`;
    }

    requestTemplateView(template: CertificateTemplateVersion): void {
        this.viewTemplate.emit(template);
    }

    statusLabel(status: CertificateGenerationTypeStatus): string {
        return status === 'active' ? 'Activo' : 'Inactivo';
    }

    private syncForm(): void {
        this.resetTemplateFile();

        if (this.generationType) {
            this.form.reset({
                name: this.generationType.name,
                description: this.generationType.description ?? '',
                show_final_destination_company: this.generationType.show_final_destination_company,
                show_destination_place: this.generationType.show_destination_place,
                status: this.generationType.status
            });
        } else {
            this.form.reset({
                name: '',
                description: '',
                show_final_destination_company: true,
                show_destination_place: true,
                status: 'active'
            });
        }

        if (this.mode === 'detail') {
            this.form.disable();
            return;
        }

        this.form.enable();
    }

    private resetTemplateFile(): void {
        this.selectedTemplateFile.set(null);
        this.templateFileError.set(this.validateTemplateFile(null));
        if (this.templateFileInput?.nativeElement) {
            this.templateFileInput.nativeElement.value = '';
        }
    }

    private validateTemplateFile(file: File | null): string | null {
        if (this.mode === 'detail') {
            return null;
        }

        if (!file) {
            return this.mode === 'create' ? 'Adjunta la plantilla de certificado en PDF.' : null;
        }

        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        if (!isPdf) {
            return 'La plantilla debe ser un archivo PDF.';
        }

        if (file.size > 10 * 1024 * 1024) {
            return 'El PDF no debe superar 10 MB.';
        }

        return null;
    }
}
