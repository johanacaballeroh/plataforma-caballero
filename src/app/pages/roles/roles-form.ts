import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ManagedRole, Permission, RoleStatus, SaveRolePayload } from './roles.service';

export type RoleFormMode = 'create' | 'edit' | 'detail';

interface PermissionGroup {
    moduleKey: string;
    label: string;
    permissions: Permission[];
}

@Component({
    selector: 'app-roles-form',
    standalone: true,
    imports: [ButtonModule, CheckboxModule, CommonModule, DatePipe, FormsModule, InputTextModule, MessageModule, ReactiveFormsModule, RouterModule, SelectModule, TagModule, TextareaModule],
    template: `
        <form [formGroup]="form" (ngSubmit)="submit()" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-1 flex flex-col gap-5">
                <div class="flex flex-col gap-2">
                    <label for="name" class="font-medium">Nombre</label>
                    <input pInputText id="name" formControlName="name" [readonly]="readonlyIdentity()" />
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
                </div>

                @if (role) {
                    <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4 flex flex-col gap-3">
                        <div>
                            <span class="text-sm text-muted-color">Tipo</span>
                            <div class="mt-1"><p-tag [value]="role.is_system_role ? 'Sistema' : 'Personalizado'" [severity]="role.is_system_role ? 'info' : 'secondary'" /></div>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Usuarios asociados</span>
                            <p class="font-medium">{{ role.users_count }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Creado</span>
                            <p class="font-medium">{{ role.created_at | date: 'dd/MM/yyyy HH:mm' }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Actualizado</span>
                            <p class="font-medium">{{ role.updated_at | date: 'dd/MM/yyyy HH:mm' }}</p>
                        </div>
                    </div>
                }

                @if (selectedPermissionIds.length === 0) {
                    <p-message severity="warn" text="Rol sin permisos. Pendiente de validacion para roles personalizados." />
                }
            </div>

            <div class="lg:col-span-2 flex flex-col gap-4">
                <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Matriz de permisos</h2>
                        <p class="text-muted-color text-sm">{{ selectedPermissionIds.length }} de {{ permissions.length }} permisos seleccionados</p>
                    </div>
                    @if (mode !== 'detail') {
                        <div class="flex gap-2">
                            <p-button type="button" label="Todos" icon="pi pi-check-square" severity="secondary" [outlined]="true" size="small" (onClick)="selectAllPermissions()" />
                            <p-button type="button" label="Ninguno" icon="pi pi-minus-circle" severity="secondary" [outlined]="true" size="small" (onClick)="clearSelectedPermissions()" />
                        </div>
                    }
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    @for (group of permissionGroups(); track group.moduleKey) {
                        <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                            <div class="flex items-center justify-between gap-3 mb-3">
                                <h3 class="font-semibold text-surface-900 dark:text-surface-0">{{ group.label }}</h3>
                                <p-tag [value]="selectedInGroup(group) + '/' + group.permissions.length" severity="secondary" />
                            </div>

                            <div class="flex flex-col gap-3">
                                @for (permission of group.permissions; track permission.id) {
                                    <label class="flex items-start gap-3 cursor-pointer">
                                        <p-checkbox [binary]="true" [ngModel]="isPermissionSelected(permission.id)" [ngModelOptions]="{ standalone: true }" (onChange)="togglePermission(permission.id, $event.checked)" [disabled]="mode === 'detail'" />
                                        <span class="flex flex-col">
                                            <span class="font-medium">{{ actionLabel(permission.action_key) }}</span>
                                            <small class="text-muted-color">{{ permission.description || permission.module_key + '.' + permission.action_key }}</small>
                                        </span>
                                    </label>
                                }
                            </div>
                        </div>
                    }
                </div>
            </div>

            <div class="lg:col-span-3 flex justify-end gap-3">
                <p-button type="button" label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/roles" />
                @if (mode !== 'detail') {
                    <p-button type="submit" label="Guardar" icon="pi pi-save" [loading]="saving" [disabled]="form.invalid || saving" />
                }
            </div>
        </form>
    `
})
export class RolesForm implements OnChanges {
    private readonly fb = inject(FormBuilder);

    @Input() mode: RoleFormMode = 'create';
    @Input() role: ManagedRole | null = null;
    @Input() permissions: Permission[] = [];
    @Input() saving = false;
    @Output() save = new EventEmitter<SaveRolePayload>();

    selectedPermissionIds: string[] = [];

    readonly statusOptions: { label: string; value: RoleStatus }[] = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' }
    ];

    readonly form = this.fb.nonNullable.group({
        name: ['', Validators.required],
        description: [''],
        status: ['active' as RoleStatus, Validators.required]
    });

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['role'] || changes['mode']) {
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
            status: value.status,
            permissionIds: this.selectedPermissionIds
        });
    }

    permissionGroups(): PermissionGroup[] {
        const groups = new Map<string, Permission[]>();

        for (const permission of this.permissions) {
            const list = groups.get(permission.module_key) ?? [];
            list.push(permission);
            groups.set(permission.module_key, list);
        }

        return [...groups.entries()].map(([moduleKey, permissions]) => ({
            moduleKey,
            label: this.moduleLabel(moduleKey),
            permissions
        }));
    }

    togglePermission(permissionId: string, checked: boolean): void {
        if (this.mode === 'detail') {
            return;
        }

        const selected = new Set(this.selectedPermissionIds);

        if (checked) {
            selected.add(permissionId);
        } else {
            selected.delete(permissionId);
        }

        this.selectedPermissionIds = [...selected];
    }

    isPermissionSelected(permissionId: string): boolean {
        return this.selectedPermissionIds.includes(permissionId);
    }

    selectAllPermissions(): void {
        this.selectedPermissionIds = this.permissions.map((permission) => permission.id);
    }

    clearSelectedPermissions(): void {
        this.selectedPermissionIds = [];
    }

    selectedInGroup(group: PermissionGroup): number {
        const selected = new Set(this.selectedPermissionIds);
        return group.permissions.filter((permission) => selected.has(permission.id)).length;
    }

    readonlyIdentity(): boolean {
        return this.mode === 'detail' || !!this.role?.is_system_role;
    }

    moduleLabel(moduleKey: string): string {
        const labels: Record<string, string> = {
            dashboard: 'Dashboard',
            users: 'Usuarios',
            roles: 'Roles',
            companies: 'Empresas',
            items: 'Items',
            units: 'Unidades',
            categories: 'Categorias',
            item_types: 'Tipos de items',
            basel_codes: 'Codigos Basilea',
            certificate_generation_types: 'Tipos de generacion',
            certificate_templates: 'Plantillas PDF',
            quantity_types: 'Tipos de cantidad',
            document_types: 'Tipos de documentos',
            certificates: 'Certificados',
            reports: 'Reportes',
            logs: 'Logs'
        };

        return labels[moduleKey] ?? moduleKey;
    }

    actionLabel(actionKey: string): string {
        const labels: Record<string, string> = {
            view: 'Ver',
            view_own: 'Ver propios',
            create: 'Crear',
            update: 'Editar',
            delete: 'Eliminar',
            issue: 'Emitir',
            print: 'Imprimir PDF',
            export: 'Exportar'
        };

        return labels[actionKey] ?? actionKey;
    }

    private syncForm(): void {
        if (this.role) {
            this.form.reset({
                name: this.role.name,
                description: this.role.description ?? '',
                status: this.role.status
            });
            this.selectedPermissionIds = this.role.permissions.map((permission) => permission.id);
        } else {
            this.form.reset({ name: '', description: '', status: 'active' });
            this.selectedPermissionIds = [];
        }

        if (this.mode === 'detail') {
            this.form.disable();
            return;
        }

        this.form.enable();

        if (this.role?.is_system_role) {
            this.form.controls.name.disable();
            this.form.controls.status.disable();
        }
    }
}
