import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { CompanyStatus, CompanyType, ManagedCompany, SaveCompanyPayload } from './companies.service';

export type CompanyFormMode = 'create' | 'edit' | 'detail';

@Component({
    selector: 'app-companies-form',
    standalone: true,
    imports: [ButtonModule, CommonModule, DatePipe, InputTextModule, MessageModule, ReactiveFormsModule, RouterModule, SelectModule, TagModule, TextareaModule],
    template: `
        <form [formGroup]="form" (ngSubmit)="submit()" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 flex flex-col gap-5">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex flex-col gap-2">
                        <label for="ruc" class="font-medium">RUC</label>
                        <input pInputText id="ruc" formControlName="ruc" maxlength="11" />
                        @if (form.controls.ruc.touched && form.controls.ruc.invalid) {
                            <small class="text-red-500">El RUC debe tener 11 digitos.</small>
                        }
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="companyType" class="font-medium">Tipo de empresa</label>
                        <p-select inputId="companyType" formControlName="company_type" [options]="companyTypeOptions" optionLabel="label" optionValue="value" class="w-full" />
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <label for="businessName" class="font-medium">Razon social</label>
                    <input pInputText id="businessName" formControlName="business_name" />
                    @if (form.controls.business_name.touched && form.controls.business_name.invalid) {
                        <small class="text-red-500">La razon social es obligatoria.</small>
                    }
                </div>

                <div class="flex flex-col gap-2">
                    <label for="tradeName" class="font-medium">Nombre comercial</label>
                    <input pInputText id="tradeName" formControlName="trade_name" />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="fiscalAddress" class="font-medium">Direccion fiscal</label>
                    <textarea pTextarea id="fiscalAddress" formControlName="fiscal_address" rows="4" [readonly]="mode === 'detail'"></textarea>
                </div>

                <div class="flex flex-col gap-2">
                    <label for="status" class="font-medium">Estado</label>
                    <p-select inputId="status" formControlName="status" [options]="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
                </div>

                @if (mode !== 'detail') {
                    <p-message severity="info" text="Las empresas inactivas no deberian seleccionarse en nuevos certificados." />
                }
            </div>

            <div class="lg:col-span-1">
                @if (company) {
                    <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4 flex flex-col gap-3">
                        <div>
                            <span class="text-sm text-muted-color">Tipo</span>
                            <p class="font-medium">{{ companyTypeLabel(company.company_type) }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Estado actual</span>
                            <div class="mt-1"><p-tag [value]="statusLabel(company.status)" [severity]="company.status === 'active' ? 'success' : 'danger'" /></div>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Sedes</span>
                            <p class="font-medium">{{ company.branches_count }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Contactos</span>
                            <p class="font-medium">{{ company.contacts_count }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Certificados asociados</span>
                            <p class="font-medium">{{ company.certificates_count }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Creado</span>
                            <p class="font-medium">{{ company.created_at | date: 'dd/MM/yyyy HH:mm' }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Actualizado</span>
                            <p class="font-medium">{{ company.updated_at | date: 'dd/MM/yyyy HH:mm' }}</p>
                        </div>
                    </div>
                } @else {
                    <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                        <span class="text-sm text-muted-color">Tabla Supabase</span>
                        <p class="font-medium">companies</p>
                    </div>
                }
            </div>

            <div class="lg:col-span-3 flex justify-end gap-3">
                <p-button type="button" label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/companies" />
                @if (mode !== 'detail') {
                    <p-button type="submit" label="Guardar" icon="pi pi-save" [loading]="saving" [disabled]="form.invalid || saving" />
                }
            </div>
        </form>
    `
})
export class CompaniesForm implements OnChanges {
    private readonly fb = inject(FormBuilder);

    @Input() mode: CompanyFormMode = 'create';
    @Input() company: ManagedCompany | null = null;
    @Input() saving = false;
    @Output() save = new EventEmitter<SaveCompanyPayload>();

    readonly companyTypeOptions: { label: string; value: CompanyType }[] = [
        { label: 'Generador', value: 'generator' },
        { label: 'Transportista', value: 'transporter' },
        { label: 'Destino final', value: 'final_destination' },
        { label: 'Mixta', value: 'both' }
    ];

    readonly statusOptions: { label: string; value: CompanyStatus }[] = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' }
    ];

    readonly form = this.fb.group({
        company_type: ['generator' as CompanyType, Validators.required],
        ruc: ['', [Validators.required, Validators.pattern(/^[0-9]{11}$/)]],
        business_name: ['', Validators.required],
        trade_name: [''],
        fiscal_address: [''],
        status: ['active' as CompanyStatus, Validators.required]
    });

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['company'] || changes['mode']) {
            this.syncForm();
        }
    }

    submit(): void {
        this.form.markAllAsTouched();

        if (this.mode === 'detail' || this.form.invalid) {
            return;
        }

        const value = this.form.getRawValue();

        if (!value.company_type || !value.ruc || !value.business_name || !value.status) {
            return;
        }

        this.save.emit({
            company_type: value.company_type,
            ruc: value.ruc,
            business_name: value.business_name,
            trade_name: value.trade_name || null,
            fiscal_address: value.fiscal_address || null,
            status: value.status
        });
    }

    companyTypeLabel(type: CompanyType): string {
        const labels: Record<CompanyType, string> = {
            generator: 'Generador',
            transporter: 'Transportista',
            final_destination: 'Destino final',
            both: 'Mixta'
        };

        return labels[type];
    }

    statusLabel(status: CompanyStatus): string {
        return status === 'active' ? 'Activo' : 'Inactivo';
    }

    private syncForm(): void {
        if (this.company) {
            this.form.reset({
                company_type: this.company.company_type,
                ruc: this.company.ruc,
                business_name: this.company.business_name,
                trade_name: this.company.trade_name ?? '',
                fiscal_address: this.company.fiscal_address ?? '',
                status: this.company.status
            });
        } else {
            this.form.reset({ company_type: 'generator', ruc: '', business_name: '', trade_name: '', fiscal_address: '', status: 'active' });
        }

        if (this.mode === 'detail') {
            this.form.disable();

            return;
        }

        this.form.enable();
    }
}
