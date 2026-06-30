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
import { ItemFormOptions, ItemStatus, ManagedItem, SaveItemPayload } from './items.service';

export type ItemFormMode = 'create' | 'edit' | 'detail';

@Component({
    selector: 'app-items-form',
    standalone: true,
    imports: [ButtonModule, CommonModule, DatePipe, InputTextModule, MessageModule, ReactiveFormsModule, RouterModule, SelectModule, TagModule, TextareaModule],
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
                        <label for="status" class="font-medium">Estado</label>
                        <p-select inputId="status" formControlName="status" [options]="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
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
                    <label for="description" class="font-medium">Descripcion</label>
                    <textarea pTextarea id="description" formControlName="description" rows="4" [readonly]="mode === 'detail'"></textarea>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex flex-col gap-2">
                        <label for="unit" class="font-medium">Unidad</label>
                        <p-select inputId="unit" formControlName="unit_id" [options]="options.units" optionLabel="name" optionValue="id" placeholder="Seleccionar unidad" class="w-full" />
                        @if (form.controls.unit_id.touched && form.controls.unit_id.invalid) {
                            <small class="text-red-500">Selecciona una unidad.</small>
                        }
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="category" class="font-medium">Categoria</label>
                        <p-select inputId="category" formControlName="category_id" [options]="options.categories" optionLabel="name" optionValue="id" placeholder="Seleccionar categoria" class="w-full" />
                        @if (form.controls.category_id.touched && form.controls.category_id.invalid) {
                            <small class="text-red-500">Selecciona una categoria.</small>
                        }
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="itemType" class="font-medium">Tipo de item</label>
                        <p-select inputId="itemType" formControlName="item_type_id" [options]="options.itemTypes" optionLabel="name" optionValue="id" placeholder="Seleccionar tipo" class="w-full" />
                        @if (form.controls.item_type_id.touched && form.controls.item_type_id.invalid) {
                            <small class="text-red-500">Selecciona un tipo de item.</small>
                        }
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="baselCode" class="font-medium">Codigo Basilea</label>
                        <p-select inputId="baselCode" formControlName="basel_code_id" [options]="options.baselCodes" optionLabel="code" optionValue="id" placeholder="Sin codigo Basilea" class="w-full" [showClear]="true" />
                    </div>
                </div>

                @if (mode !== 'detail') {
                    <p-message severity="info" text="Los selects cargan catalogos activos desde Supabase. El formato exacto del codigo queda pendiente de validacion." />
                }
            </div>

            <div class="lg:col-span-1">
                @if (item) {
                    <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4 flex flex-col gap-3">
                        <div>
                            <span class="text-sm text-muted-color">Estado actual</span>
                            <div class="mt-1"><p-tag [value]="statusLabel(item.status)" [severity]="item.status === 'active' ? 'success' : 'danger'" /></div>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Unidad</span>
                            <p class="font-medium">{{ item.unit?.name || 'Sin unidad' }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Categoria</span>
                            <p class="font-medium">{{ item.category?.name || 'Sin categoria' }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Tipo</span>
                            <p class="font-medium">{{ item.item_type?.name || 'Sin tipo' }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Codigo Basilea</span>
                            <p class="font-medium">{{ item.basel_code?.code || 'Sin codigo' }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Certificados asociados</span>
                            <p class="font-medium">{{ item.certificate_items_count }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Creado</span>
                            <p class="font-medium">{{ item.created_at | date: 'dd/MM/yyyy HH:mm' }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Actualizado</span>
                            <p class="font-medium">{{ item.updated_at | date: 'dd/MM/yyyy HH:mm' }}</p>
                        </div>
                    </div>
                } @else {
                    <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                        <span class="text-sm text-muted-color">Tabla Supabase</span>
                        <p class="font-medium">items</p>
                    </div>
                }
            </div>

            <div class="lg:col-span-3 flex justify-end gap-3">
                <p-button type="button" label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/items" />
                @if (mode !== 'detail') {
                    <p-button type="submit" label="Guardar" icon="pi pi-save" [loading]="saving" [disabled]="form.invalid || saving" />
                }
            </div>
        </form>
    `
})
export class ItemsForm implements OnChanges {
    private readonly fb = inject(FormBuilder);

    @Input() mode: ItemFormMode = 'create';
    @Input() item: ManagedItem | null = null;
    @Input() options: ItemFormOptions = { units: [], categories: [], itemTypes: [], baselCodes: [] };
    @Input() saving = false;
    @Output() save = new EventEmitter<SaveItemPayload>();

    readonly statusOptions: { label: string; value: ItemStatus }[] = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' }
    ];

    readonly form = this.fb.group({
        code: ['', Validators.required],
        name: ['', Validators.required],
        description: [''],
        unit_id: [null as string | null, Validators.required],
        category_id: [null as string | null, Validators.required],
        item_type_id: [null as string | null, Validators.required],
        basel_code_id: [null as string | null],
        status: ['active' as ItemStatus, Validators.required]
    });

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['item'] || changes['mode']) {
            this.syncForm();
        }
    }

    submit(): void {
        this.form.markAllAsTouched();

        if (this.mode === 'detail' || this.form.invalid) {
            return;
        }

        const value = this.form.getRawValue();
        if (!value.code || !value.name || !value.unit_id || !value.category_id || !value.item_type_id || !value.status) {
            return;
        }

        this.save.emit({
            code: value.code,
            name: value.name,
            description: value.description || null,
            unit_id: value.unit_id,
            category_id: value.category_id,
            item_type_id: value.item_type_id,
            basel_code_id: value.basel_code_id || null,
            status: value.status
        });
    }

    statusLabel(status: ItemStatus): string {
        return status === 'active' ? 'Activo' : 'Inactivo';
    }

    private syncForm(): void {
        if (this.item) {
            this.form.reset({
                code: this.item.code,
                name: this.item.name,
                description: this.item.description ?? '',
                unit_id: this.item.unit_id,
                category_id: this.item.category_id,
                item_type_id: this.item.item_type_id,
                basel_code_id: this.item.basel_code_id,
                status: this.item.status
            });
        } else {
            this.form.reset({ code: '', name: '', description: '', unit_id: null, category_id: null, item_type_id: null, basel_code_id: null, status: 'active' });
        }

        if (this.mode === 'detail') {
            this.form.disable();
            return;
        }

        this.form.enable();
    }
}
