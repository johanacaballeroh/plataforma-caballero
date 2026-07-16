import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ManagedQuantityType, QuantityTypeStatus, SaveQuantityTypePayload } from './quantity-types.service';

export type QuantityTypeFormMode = 'create' | 'edit' | 'detail';

@Component({
    selector: 'app-quantity-types-form',
    standalone: true,
    imports: [ButtonModule, CommonModule, DatePipe, InputTextModule, MessageModule, ReactiveFormsModule, RouterModule, SelectModule, TagModule, ToggleSwitchModule],
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
                    <label for="showValue" class="font-medium">Mostrar valor/cantidad</label>
                    <div class="flex items-center gap-3 min-h-10">
                        <p-toggleswitch inputId="showValue" formControlName="show_value" />
                        <span class="text-muted-color">{{ form.controls.show_value.value ? 'Si se solicita valor/cantidad' : 'No se solicita valor/cantidad' }}</span>
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <label for="status" class="font-medium">Estado</label>
                    <p-select inputId="status" formControlName="status" [options]="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
                    @if (form.controls.status.touched && form.controls.status.invalid) {
                        <small class="text-red-500">Selecciona un estado valido.</small>
                    }
                </div>

                @if (mode !== 'detail') {
                    <p-message severity="info" text="Las reglas exactas que activa show_value en certificados quedan pendiente de validacion." />
                }
            </div>

            <div class="lg:col-span-1">
                @if (quantityType) {
                    <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4 flex flex-col gap-3">
                        <div>
                            <span class="text-sm text-muted-color">Estado actual</span>
                            <div class="mt-1"><p-tag [value]="statusLabel(quantityType.status)" [severity]="quantityType.status === 'active' ? 'success' : 'danger'" /></div>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Mostrar valor/cantidad</span>
                            <div class="mt-1"><p-tag [value]="quantityType.show_value ? 'Si' : 'No'" [severity]="quantityType.show_value ? 'info' : 'secondary'" /></div>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Items de certificado</span>
                            <p class="font-medium">{{ quantityType.certificate_items_count }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Creado</span>
                            <p class="font-medium">{{ quantityType.created_at | date: 'dd/MM/yyyy HH:mm' }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Actualizado</span>
                            <p class="font-medium">{{ quantityType.updated_at | date: 'dd/MM/yyyy HH:mm' }}</p>
                        </div>
                    </div>
                } @else {
                    <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                        <span class="text-sm text-muted-color">Tabla Supabase</span>
                        <p class="font-medium">quantity_types</p>
                    </div>
                }
            </div>

            <div class="lg:col-span-3 flex justify-end gap-3">
                <p-button type="button" label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/quantity-types" />
                @if (mode !== 'detail') {
                    <p-button type="submit" label="Guardar" icon="pi pi-save" [loading]="saving" [disabled]="form.invalid || saving" />
                }
            </div>
        </form>
    `
})
export class QuantityTypesForm implements OnChanges {
    private readonly fb = inject(FormBuilder);

    @Input() mode: QuantityTypeFormMode = 'create';
    @Input() quantityType: ManagedQuantityType | null = null;
    @Input() saving = false;
    @Output() save = new EventEmitter<SaveQuantityTypePayload>();

    readonly statusOptions: { label: string; value: QuantityTypeStatus }[] = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' }
    ];

    readonly form = this.fb.nonNullable.group({
        name: ['', Validators.required],
        show_value: [true, Validators.required],
        status: ['active' as QuantityTypeStatus, Validators.required]
    });

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['quantityType'] || changes['mode']) {
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
            show_value: value.show_value,
            status: value.status
        });
    }

    statusLabel(status: QuantityTypeStatus): string {
        return status === 'active' ? 'Activo' : 'Inactivo';
    }

    private syncForm(): void {
        if (this.quantityType) {
            this.form.reset({
                name: this.quantityType.name,
                show_value: this.quantityType.show_value,
                status: this.quantityType.status
            });
        } else {
            this.form.reset({ name: '', show_value: true, status: 'active' });
        }

        if (this.mode === 'detail') {
            this.form.disable();

            return;
        }

        this.form.enable();
    }
}
