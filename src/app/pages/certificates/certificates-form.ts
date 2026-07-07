import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { CertificateFormOptions, CertificateStatus, ManagedCertificate, SaveCertificatePayload } from './certificates.service';

export type CertificateFormMode = 'create' | 'edit' | 'detail';

@Component({
    selector: 'app-certificates-form',
    standalone: true,
    imports: [ButtonModule, CommonModule, InputTextModule, ReactiveFormsModule, RouterModule, SelectModule, TextareaModule],
    template: `
        <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-8">
            <section class="flex flex-col gap-4">
                <div>
                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0">Informacion General</h2>
                    @if (certificate) {
                        <p class="text-muted-color mt-1">Documento: <span class="text-primary font-medium">{{ certificate.certificate_number }}</span></p>
                    } @else {
                        <p class="text-muted-color mt-1">Documento: <span class="text-primary font-medium">{{ nextCertificateNumber || 'se genera automaticamente' }}</span></p>
                    }
                </div>

                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="flex flex-col gap-2">
                        <label for="generationType" class="font-medium">Tipo de Generacion <span class="text-red-500">*</span></label>
                        <p-select inputId="generationType" formControlName="generation_type_id" [options]="options.generationTypes" optionLabel="name" optionValue="id" placeholder="Seleccione un tipo" class="w-full" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="operationDate" class="font-medium">Fecha de Operacion <span class="text-red-500">*</span></label>
                        <input pInputText id="operationDate" type="date" formControlName="operation_date" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="issueDate" class="font-medium">Fecha de Emision <span class="text-red-500">*</span></label>
                        <input pInputText id="issueDate" type="date" formControlName="issue_date" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="guideNumber" class="font-medium">Numero de Guia <span class="text-red-500">*</span></label>
                        <input pInputText id="guideNumber" formControlName="guide_number" placeholder="Ej: EG07-00001782" />
                    </div>
                </div>
            </section>

            <section class="flex flex-col gap-4">
                <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0">Empresa Generadora</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex flex-col gap-2">
                        <label for="generatorCompany" class="font-medium">Empresa <span class="text-red-500">*</span></label>
                        <p-select inputId="generatorCompany" formControlName="generator_company_id" [options]="options.companies" optionLabel="name" optionValue="id" placeholder="Buscar empresa por RUC o nombre..." class="w-full" [filter]="true" filterBy="name,ruc" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="generatorAddressSelect" class="font-medium">Seleccionar Direccion</label>
                        <p-select inputId="generatorAddressSelect" formControlName="generator_address_id" [options]="generatorAddressOptions()" optionLabel="name" optionValue="id" placeholder="Direccion de la Empresa" class="w-full" [showClear]="true" />
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <label for="generatorAddress" class="font-medium">Direccion</label>
                    <textarea pTextarea id="generatorAddress" formControlName="generator_address" rows="3"></textarea>
                </div>

                <div class="flex flex-col gap-2">
                    <label for="generationSource" class="font-medium">Origen de la Generacion</label>
                    <textarea pTextarea id="generationSource" formControlName="generation_source" rows="3"></textarea>
                </div>
            </section>

            <section class="flex flex-col gap-4">
                <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0">Empresa Transportista</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex flex-col gap-2">
                        <label for="transporterCompany" class="font-medium">Empresa <span class="text-red-500">*</span></label>
                        <p-select inputId="transporterCompany" formControlName="transporter_company_id" [options]="options.companies" optionLabel="name" optionValue="id" placeholder="Buscar empresa por RUC o nombre..." class="w-full" [filter]="true" filterBy="name,ruc" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="transporterAddressSelect" class="font-medium">Seleccionar Direccion</label>
                        <p-select inputId="transporterAddressSelect" formControlName="transporter_address_id" [options]="transporterAddressOptions()" optionLabel="name" optionValue="id" placeholder="Direccion de la Empresa" class="w-full" [showClear]="true" />
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <label for="transporterAddress" class="font-medium">Direccion</label>
                    <textarea pTextarea id="transporterAddress" formControlName="transporter_address" rows="3"></textarea>
                </div>
            </section>

            <section class="flex flex-col gap-4">
                <div class="flex flex-wrap items-center gap-3">
                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0">Informacion Adicional de Operacion</h2>
                    <p-button type="button" label="Informacion de la operacion" icon="pi pi-plus" size="small" severity="secondary" [outlined]="true" (onClick)="showAdditional.set(!showAdditional())" />
                </div>

                @if (showAdditional()) {
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex flex-col gap-2">
                            <label for="status" class="font-medium">Estado <span class="text-red-500">*</span></label>
                            <p-select inputId="status" formControlName="status" [options]="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="observations" class="font-medium">Observaciones</label>
                            <input pInputText id="observations" formControlName="observations" />
                        </div>
                    </div>
                }
            </section>

            @if (showActions) {
                <div class="flex justify-end gap-3">
                    <p-button type="button" label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/certificates" />
                    @if (mode !== 'detail') {
                        <p-button type="submit" [label]="mode === 'create' ? 'Guardar Certificado' : 'Actualizar Certificado'" icon="pi pi-check" [loading]="saving" [disabled]="form.invalid || saving" />
                    }
                </div>
            }
        </form>
    `
})
export class CertificatesForm implements OnChanges, OnInit {
    private readonly fb = inject(FormBuilder);

    @Input() mode: CertificateFormMode = 'create';
    @Input() certificate: ManagedCertificate | null = null;
    @Input() options: CertificateFormOptions = { companies: [], generationTypes: [], templateVersions: [], companyAddresses: [], items: [], quantityTypes: [], documentTypes: [] };
    @Input() nextCertificateNumber: string | null = null;
    @Input() saving = false;
    @Input() showActions = true;
    @Output() save = new EventEmitter<SaveCertificatePayload>();

    readonly showAdditional = signal(false);

    readonly statusOptions: { label: string; value: CertificateStatus }[] = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' }
    ];

    readonly form = this.fb.group({
        generation_type_id: ['', Validators.required],
        issue_date: ['', Validators.required],
        operation_date: ['', Validators.required],
        guide_number: ['', Validators.required],
        generator_company_id: ['', Validators.required],
        generator_address_id: [null as string | null],
        generator_address: [''],
        generation_source: [''],
        transporter_company_id: ['', Validators.required],
        transporter_address_id: [null as string | null],
        transporter_address: [''],
        observations: [''],
        status: ['active' as CertificateStatus, Validators.required]
    });

    ngOnInit(): void {
        this.form.controls.generator_company_id.valueChanges.subscribe(() => this.syncCompanyAddress('generator'));
        this.form.controls.generator_address_id.valueChanges.subscribe(() => this.syncSelectedAddress('generator'));
        this.form.controls.transporter_company_id.valueChanges.subscribe(() => this.syncCompanyAddress('transporter'));
        this.form.controls.transporter_address_id.valueChanges.subscribe(() => this.syncSelectedAddress('transporter'));
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['certificate'] || changes['mode']) {
            this.syncForm();
        }
    }

    generatorAddressOptions(): CertificateFormOptions['companyAddresses'] {
        const companyId = this.form.controls.generator_company_id.value;
        return this.options.companyAddresses.filter((address) => address.company_id === companyId);
    }

    transporterAddressOptions(): CertificateFormOptions['companyAddresses'] {
        const companyId = this.form.controls.transporter_company_id.value;
        return this.options.companyAddresses.filter((address) => address.company_id === companyId);
    }

    submit(): void {
        this.form.markAllAsTouched();

        if (this.mode === 'detail' || this.form.invalid) {
            return;
        }

        const value = this.form.getRawValue();
        if (!value.generation_type_id || !value.issue_date || !value.operation_date || !value.guide_number || !value.generator_company_id || !value.transporter_company_id || !value.status) {
            return;
        }

        this.save.emit({
            generation_type_id: value.generation_type_id,
            issue_date: value.issue_date,
            operation_date: value.operation_date,
            guide_number: value.guide_number,
            generation_source: value.generation_source || null,
            generator_address: value.generator_address || null,
            generator_company_id: value.generator_company_id,
            transporter_company_id: value.transporter_company_id,
            transporter_address: value.transporter_address || null,
            final_destination_company_id: null,
            destination_place: null,
            observations: value.observations || null,
            status: value.status
        });
    }

    private syncForm(): void {
        if (this.certificate) {
            this.form.reset({
                generation_type_id: this.certificate.generation_type_id,
                issue_date: this.certificate.issue_date,
                operation_date: this.certificate.operation_date,
                guide_number: this.certificate.guide_number,
                generator_company_id: this.certificate.generator_company_id,
                generator_address_id: null,
                generator_address: this.certificate.generator_address ?? '',
                generation_source: this.certificate.generation_source ?? '',
                transporter_company_id: this.certificate.transporter_company_id ?? '',
                transporter_address_id: null,
                transporter_address: this.certificate.transporter_address ?? '',
                observations: this.certificate.observations ?? '',
                status: this.certificate.status
            });
        } else {
            const today = new Date().toISOString().slice(0, 10);
            this.form.reset({
                generation_type_id: '',
                issue_date: today,
                operation_date: '',
                guide_number: '',
                generator_company_id: '',
                generator_address_id: null,
                generator_address: '',
                generation_source: '',
                transporter_company_id: '',
                transporter_address_id: null,
                transporter_address: '',
                observations: '',
                status: 'active'
            });
        }

        if (this.mode === 'detail') {
            this.form.disable();
            this.showAdditional.set(true);
            return;
        }

        this.form.enable();
    }

    private syncCompanyAddress(kind: 'generator' | 'transporter'): void {
        if (this.mode === 'detail') {
            return;
        }

        const companyControl = kind === 'generator' ? this.form.controls.generator_company_id : this.form.controls.transporter_company_id;
        const addressIdControl = kind === 'generator' ? this.form.controls.generator_address_id : this.form.controls.transporter_address_id;
        const addressControl = kind === 'generator' ? this.form.controls.generator_address : this.form.controls.transporter_address;
        const companyId = companyControl.value;
        const firstAddress = this.options.companyAddresses.find((address) => address.company_id === companyId);

        addressIdControl.setValue(firstAddress?.id ?? null, { emitEvent: false });
        addressControl.setValue(firstAddress?.address ?? '', { emitEvent: false });
    }

    private syncSelectedAddress(kind: 'generator' | 'transporter'): void {
        if (this.mode === 'detail') {
            return;
        }

        const addressId = kind === 'generator' ? this.form.controls.generator_address_id.value : this.form.controls.transporter_address_id.value;
        const addressControl = kind === 'generator' ? this.form.controls.generator_address : this.form.controls.transporter_address;
        const address = this.options.companyAddresses.find((option) => option.id === addressId);
        addressControl.setValue(address?.address ?? '', { emitEvent: false });
    }
}
