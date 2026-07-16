import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ManagedUnit, SaveUnitPayload, UnitStatus } from './units.service';

export type UnitFormMode = 'create' | 'edit' | 'detail';

@Component({
    selector: 'app-units-form',
    standalone: true,
    imports: [ButtonModule, CommonModule, DatePipe, InputTextModule, MessageModule, ReactiveFormsModule, RouterModule, SelectModule, TagModule],
    template: `
        <form [formGroup]="form" (ngSubmit)="submit()" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 flex flex-col gap-5">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex flex-col gap-2">
                        <label for="code" class="font-medium">Codigo</label>
                        <input pInputText id="code" formControlName="code" />
                        @if (form.controls.code.touched && form.controls.code.invalid) {
                            <small class="text-red-500">El codigo es obligatorio.</small>
                        }
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="abbreviation" class="font-medium">Abreviatura</label>
                        <input pInputText id="abbreviation" formControlName="abbreviation" />
                    </div>
                </div>

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
                    <p-message severity="info" text="Las unidades inactivas no deberian seleccionarse en nuevos items." />
                }
            </div>

            <div class="lg:col-span-1">
                @if (unit) {
                    <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4 flex flex-col gap-3">
                        <div>
                            <span class="text-sm text-muted-color">Estado actual</span>
                            <div class="mt-1"><p-tag [value]="statusLabel(unit.status)" [severity]="unit.status === 'active' ? 'success' : 'danger'" /></div>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Items asociados</span>
                            <p class="font-medium">{{ unit.items_count }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Creado</span>
                            <p class="font-medium">{{ unit.created_at | date: 'dd/MM/yyyy HH:mm' }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Actualizado</span>
                            <p class="font-medium">{{ unit.updated_at | date: 'dd/MM/yyyy HH:mm' }}</p>
                        </div>
                    </div>
                } @else {
                    <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                        <span class="text-sm text-muted-color">Tabla Supabase</span>
                        <p class="font-medium">units</p>
                    </div>
                }
            </div>

            <div class="lg:col-span-3 flex justify-end gap-3">
                <p-button type="button" label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/units" />
                @if (mode !== 'detail') {
                    <p-button type="submit" label="Guardar" icon="pi pi-save" [loading]="saving" [disabled]="form.invalid || saving" />
                }
            </div>
        </form>
    `
})
export class UnitsForm implements OnChanges {
    private readonly fb = inject(FormBuilder);

    @Input() mode: UnitFormMode = 'create';
    @Input() unit: ManagedUnit | null = null;
    @Input() saving = false;
    @Output() save = new EventEmitter<SaveUnitPayload>();

    readonly statusOptions: { label: string; value: UnitStatus }[] = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' }
    ];

    readonly form = this.fb.nonNullable.group({
        code: ['', Validators.required],
        name: ['', Validators.required],
        abbreviation: [''],
        status: ['active' as UnitStatus, Validators.required]
    });

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['unit'] || changes['mode']) {
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
            name: value.name,
            abbreviation: value.abbreviation || null,
            status: value.status
        });
    }

    statusLabel(status: UnitStatus): string {
        return status === 'active' ? 'Activo' : 'Inactivo';
    }

    private syncForm(): void {
        if (this.unit) {
            this.form.reset({
                code: this.unit.code,
                name: this.unit.name,
                abbreviation: this.unit.abbreviation ?? '',
                status: this.unit.status
            });
        } else {
            this.form.reset({ code: '', name: '', abbreviation: '', status: 'active' });
        }

        if (this.mode === 'detail') {
            this.form.disable();

            return;
        }

        this.form.enable();
    }
}
