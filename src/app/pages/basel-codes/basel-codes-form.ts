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
import { BaselCodeStatus, ManagedBaselCode, SaveBaselCodePayload } from './basel-codes.service';

export type BaselCodeFormMode = 'create' | 'edit' | 'detail';

@Component({
    selector: 'app-basel-codes-form',
    standalone: true,
    imports: [ButtonModule, CommonModule, DatePipe, InputTextModule, MessageModule, ReactiveFormsModule, RouterModule, SelectModule, TagModule, TextareaModule],
    template: `
        <form [formGroup]="form" (ngSubmit)="submit()" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 flex flex-col gap-5">
                <div class="flex flex-col gap-2">
                    <label for="code" class="font-medium">Codigo</label>
                    <input pInputText id="code" formControlName="code" />
                    @if (form.controls.code.touched && form.controls.code.invalid) {
                        <small class="text-red-500">El codigo es obligatorio.</small>
                    }
                </div>

                <div class="flex flex-col gap-2">
                    <label for="description" class="font-medium">Descripcion</label>
                    <textarea pTextarea id="description" formControlName="description" rows="5" [readonly]="mode === 'detail'"></textarea>
                    @if (form.controls.description.touched && form.controls.description.invalid) {
                        <small class="text-red-500">La descripcion es obligatoria.</small>
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
                    <p-message severity="info" text="El formato exacto permitido para el codigo queda pendiente de validacion." />
                }
            </div>

            <div class="lg:col-span-1">
                @if (baselCode) {
                    <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4 flex flex-col gap-3">
                        <div>
                            <span class="text-sm text-muted-color">Estado actual</span>
                            <div class="mt-1"><p-tag [value]="statusLabel(baselCode.status)" [severity]="baselCode.status === 'active' ? 'success' : 'danger'" /></div>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Items asociados</span>
                            <p class="font-medium">{{ baselCode.items_count }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Creado</span>
                            <p class="font-medium">{{ baselCode.created_at | date: 'dd/MM/yyyy HH:mm' }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Actualizado</span>
                            <p class="font-medium">{{ baselCode.updated_at | date: 'dd/MM/yyyy HH:mm' }}</p>
                        </div>
                    </div>
                } @else {
                    <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                        <span class="text-sm text-muted-color">Tabla Supabase</span>
                        <p class="font-medium">basel_codes</p>
                    </div>
                }
            </div>

            <div class="lg:col-span-3 flex justify-end gap-3">
                <p-button type="button" label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/basel-codes" />
                @if (mode !== 'detail') {
                    <p-button type="submit" label="Guardar" icon="pi pi-save" [loading]="saving" [disabled]="form.invalid || saving" />
                }
            </div>
        </form>
    `
})
export class BaselCodesForm implements OnChanges {
    private readonly fb = inject(FormBuilder);

    @Input() mode: BaselCodeFormMode = 'create';
    @Input() baselCode: ManagedBaselCode | null = null;
    @Input() saving = false;
    @Output() save = new EventEmitter<SaveBaselCodePayload>();

    readonly statusOptions: { label: string; value: BaselCodeStatus }[] = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' }
    ];

    readonly form = this.fb.nonNullable.group({
        code: ['', Validators.required],
        description: ['', Validators.required],
        status: ['active' as BaselCodeStatus, Validators.required]
    });

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['baselCode'] || changes['mode']) {
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
            code: value.code,
            description: value.description,
            status: value.status
        });
    }

    statusLabel(status: BaselCodeStatus): string {
        return status === 'active' ? 'Activo' : 'Inactivo';
    }

    private syncForm(): void {
        if (this.baselCode) {
            this.form.reset({
                code: this.baselCode.code,
                description: this.baselCode.description,
                status: this.baselCode.status
            });
        } else {
            this.form.reset({ code: '', description: '', status: 'active' });
        }

        if (this.mode === 'detail') {
            this.form.disable();

            return;
        }

        this.form.enable();
    }
}
