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
import { CategoryStatus, ManagedCategory, SaveCategoryPayload } from './categories.service';

export type CategoryFormMode = 'create' | 'edit' | 'detail';

@Component({
    selector: 'app-categories-form',
    standalone: true,
    imports: [ButtonModule, CommonModule, DatePipe, InputTextModule, MessageModule, ReactiveFormsModule, RouterModule, SelectModule, TagModule, TextareaModule],
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
                    <label for="description" class="font-medium">Descripcion</label>
                    <textarea pTextarea id="description" formControlName="description" rows="5" [readonly]="mode === 'detail'"></textarea>
                </div>

                <div class="flex flex-col gap-2">
                    <label for="status" class="font-medium">Estado</label>
                    <p-select inputId="status" formControlName="status" [options]="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
                    @if (form.controls.status.touched && form.controls.status.invalid) {
                        <small class="text-red-500">Selecciona un estado valido.</small>
                    }
                </div>

                @if (mode !== 'detail') {
                    <p-message severity="info" text="Las categorias inactivas no deberian seleccionarse en nuevos items." />
                }
            </div>

            <div class="lg:col-span-1">
                @if (category) {
                    <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4 flex flex-col gap-3">
                        <div>
                            <span class="text-sm text-muted-color">Estado actual</span>
                            <div class="mt-1"><p-tag [value]="statusLabel(category.status)" [severity]="category.status === 'active' ? 'success' : 'danger'" /></div>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Items asociados</span>
                            <p class="font-medium">{{ category.items_count }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Creado</span>
                            <p class="font-medium">{{ category.created_at | date: 'dd/MM/yyyy HH:mm' }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Actualizado</span>
                            <p class="font-medium">{{ category.updated_at | date: 'dd/MM/yyyy HH:mm' }}</p>
                        </div>
                    </div>
                } @else {
                    <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                        <span class="text-sm text-muted-color">Tabla Supabase</span>
                        <p class="font-medium">categories</p>
                    </div>
                }
            </div>

            <div class="lg:col-span-3 flex justify-end gap-3">
                <p-button type="button" label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/categories" />
                @if (mode !== 'detail') {
                    <p-button type="submit" label="Guardar" icon="pi pi-save" [loading]="saving" [disabled]="form.invalid || saving" />
                }
            </div>
        </form>
    `
})
export class CategoriesForm implements OnChanges {
    private readonly fb = inject(FormBuilder);

    @Input() mode: CategoryFormMode = 'create';
    @Input() category: ManagedCategory | null = null;
    @Input() saving = false;
    @Output() save = new EventEmitter<SaveCategoryPayload>();

    readonly statusOptions: { label: string; value: CategoryStatus }[] = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' }
    ];

    readonly form = this.fb.nonNullable.group({
        name: ['', Validators.required],
        description: [''],
        status: ['active' as CategoryStatus, Validators.required]
    });

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['category'] || changes['mode']) {
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
            description: value.description || null,
            status: value.status
        });
    }

    statusLabel(status: CategoryStatus): string {
        return status === 'active' ? 'Activo' : 'Inactivo';
    }

    private syncForm(): void {
        if (this.category) {
            this.form.reset({
                name: this.category.name,
                description: this.category.description ?? '',
                status: this.category.status
            });
        } else {
            this.form.reset({ name: '', description: '', status: 'active' });
        }

        if (this.mode === 'detail') {
            this.form.disable();
            return;
        }

        this.form.enable();
    }
}
