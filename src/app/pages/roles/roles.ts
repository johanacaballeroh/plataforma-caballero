import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '@/app/core/auth/auth.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ManagedRole, Permission, RoleStatus, RolesService } from './roles.service';

interface PermissionGroup {
    moduleKey: string;
    label: string;
}

@Component({
    selector: 'app-roles',
    standalone: true,
    imports: [ButtonModule, CommonModule, ConfirmDialogModule, DatePipe, InputTextModule, ReactiveFormsModule, RouterModule, SelectModule, TableModule, TagModule, ToastModule, ToolbarModule],
    providers: [ConfirmationService, MessageService],
    template: `
        <p-toast />
        <p-confirmdialog [style]="{ width: '450px' }" />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Administracion</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Roles</h1>
                <p class="text-muted-color max-w-3xl">Gestiona roles, estado operativo y matriz de permisos por modulo.</p>
            </div>

            <p-toolbar>
                <ng-template #start>
                    <p-button label="Nuevo rol" icon="pi pi-plus" routerLink="/roles/new" [disabled]="!auth.hasPermission('roles.create')" />
                </ng-template>
                <ng-template #end>
                    <p-button label="Actualizar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="reload()" [loading]="loading()" />
                </ng-template>
            </p-toolbar>

            <div class="card">
                <form [formGroup]="filtersForm" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-5" (ngSubmit)="applyFilters()">
                    <div class="flex flex-col gap-2 xl:col-span-2">
                        <label for="search" class="font-medium">Buscar</label>
                        <input pInputText id="search" formControlName="search" placeholder="Nombre o descripcion" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="statusFilter" class="font-medium">Estado</label>
                        <p-select inputId="statusFilter" formControlName="status" [options]="statusFilterOptions" optionLabel="label" optionValue="value" placeholder="Todos" class="w-full" [showClear]="true" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="systemFilter" class="font-medium">Tipo</label>
                        <p-select inputId="systemFilter" formControlName="systemRole" [options]="systemRoleOptions" optionLabel="label" optionValue="value" placeholder="Todos" class="w-full" [showClear]="true" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="moduleFilter" class="font-medium">Modulo</label>
                        <p-select inputId="moduleFilter" formControlName="moduleKey" [options]="moduleOptions()" optionLabel="label" optionValue="value" placeholder="Todos" class="w-full" [showClear]="true" />
                    </div>

                    <div class="md:col-span-2 xl:col-span-5 flex justify-end gap-3">
                        <p-button type="button" label="Limpiar" icon="pi pi-filter-slash" severity="secondary" [outlined]="true" (onClick)="clearFilters()" />
                        <p-button type="submit" label="Filtrar" icon="pi pi-search" />
                    </div>
                </form>

                <p-table
                    [value]="roles()"
                    [lazy]="true"
                    (onLazyLoad)="loadRoles($event)"
                    [loading]="loading()"
                    [paginator]="true"
                    [rows]="10"
                    [totalRecords]="totalRecords()"
                    [rowsPerPageOptions]="[10, 20, 50]"
                    [rowHover]="true"
                    dataKey="id"
                    sortField="created_at"
                    [sortOrder]="-1"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} roles"
                    [showCurrentPageReport]="true"
                    responsiveLayout="scroll"
                    [tableStyle]="{ 'min-width': '76rem' }"
                >
                    <ng-template #header>
                        <tr>
                            <th pSortableColumn="name" style="min-width: 16rem">Rol <p-sortIcon field="name" /></th>
                            <th style="min-width: 18rem">Descripcion</th>
                            <th pSortableColumn="is_system_role" style="min-width: 10rem">Tipo <p-sortIcon field="is_system_role" /></th>
                            <th style="min-width: 12rem">Permisos</th>
                            <th style="min-width: 10rem">Usuarios</th>
                            <th pSortableColumn="status" style="min-width: 10rem">Estado <p-sortIcon field="status" /></th>
                            <th pSortableColumn="created_at" style="min-width: 12rem">Creacion <p-sortIcon field="created_at" /></th>
                            <th style="width: 12rem"></th>
                        </tr>
                    </ng-template>

                    <ng-template #body let-role>
                        <tr>
                            <td>
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <i class="pi pi-shield"></i>
                                    </div>
                                    <div>
                                        <div class="font-medium text-surface-900 dark:text-surface-0">{{ role.name }}</div>
                                        @if (role.is_system_role) {
                                            <small class="text-muted-color">Rol base protegido</small>
                                        } @else {
                                            <small class="text-muted-color">Rol personalizado</small>
                                        }
                                    </div>
                                </div>
                            </td>
                            <td>{{ role.description || 'Sin descripcion' }}</td>
                            <td><p-tag [value]="role.is_system_role ? 'Sistema' : 'Personalizado'" [severity]="role.is_system_role ? 'info' : 'secondary'" /></td>
                            <td>
                                <div class="flex flex-col gap-1">
                                    <span class="font-medium">{{ role.permissions.length }} permiso(s)</span>
                                    <small class="text-muted-color">{{ moduleSummary(role) }}</small>
                                </div>
                            </td>
                            <td>{{ role.users_count }}</td>
                            <td><p-tag [value]="statusLabel(role.status)" [severity]="role.status === 'active' ? 'success' : 'danger'" /></td>
                            <td>{{ role.created_at | date: 'dd/MM/yyyy HH:mm' }}</td>
                            <td>
                                <div class="flex justify-end gap-2">
                                    <p-button icon="pi pi-eye" [rounded]="true" [outlined]="true" severity="secondary" [routerLink]="['/roles', role.id]" />
                                    <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" [routerLink]="['/roles', role.id, 'edit']" [disabled]="!auth.hasPermission('roles.update')" />
                                    <p-button
                                        [icon]="role.status === 'active' ? 'pi pi-ban' : 'pi pi-check'"
                                        [rounded]="true"
                                        [outlined]="true"
                                        [severity]="role.status === 'active' ? 'danger' : 'success'"
                                        (onClick)="confirmStatusChange(role)"
                                        [disabled]="role.is_system_role || !auth.hasPermission('roles.update')"
                                    />
                                    <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (onClick)="confirmDelete(role)" [disabled]="role.is_system_role || role.users_count > 0 || !auth.hasPermission('roles.delete')" />
                                </div>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="8">No se encontraron roles.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </div>
    `
})
export class Roles implements OnInit {
    readonly auth = inject(AuthService);
    private readonly fb = inject(FormBuilder);
    private readonly rolesService = inject(RolesService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);

    readonly roles = signal<ManagedRole[]>([]);
    readonly permissions = signal<Permission[]>([]);
    readonly totalRecords = signal(0);
    readonly loading = signal(false);

    private lastLazyEvent: TableLazyLoadEvent = { first: 0, rows: 10, sortField: 'created_at', sortOrder: -1 };

    readonly statusFilterOptions: { label: string; value: RoleStatus }[] = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' }
    ];

    readonly systemRoleOptions = [
        { label: 'Sistema', value: true },
        { label: 'Personalizado', value: false }
    ];

    readonly filtersForm = this.fb.group({
        search: [''],
        status: [null as RoleStatus | null],
        systemRole: [null as boolean | null],
        moduleKey: [null as string | null]
    });

    readonly moduleOptions = computed(() => this.permissionGroups().map((group) => ({ label: group.label, value: group.moduleKey })));

    async ngOnInit(): Promise<void> {
        await this.loadPermissions();
    }

    async loadRoles(event: TableLazyLoadEvent): Promise<void> {
        this.lastLazyEvent = event;
        this.loading.set(true);

        try {
            const result = await this.rolesService.listRoles({
                first: event.first ?? 0,
                rows: event.rows ?? 10,
                sortField: this.normalizeSortField(event.sortField),
                sortOrder: event.sortOrder === 1 ? 1 : -1,
                filters: this.filtersForm.getRawValue()
            });

            this.roles.set(result.roles);
            this.totalRecords.set(result.total);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el listado de roles.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }

    async reload(): Promise<void> {
        await this.loadRoles(this.lastLazyEvent);
    }

    async applyFilters(): Promise<void> {
        await this.loadRoles({ ...this.lastLazyEvent, first: 0 });
    }

    async clearFilters(): Promise<void> {
        this.filtersForm.reset({ search: '', status: null, systemRole: null, moduleKey: null });
        await this.applyFilters();
    }

    confirmStatusChange(role: ManagedRole): void {
        const nextStatus: RoleStatus = role.status === 'active' ? 'inactive' : 'active';
        const action = nextStatus === 'inactive' ? 'inactivar' : 'activar';

        this.confirmationService.confirm({
            message: `Deseas ${action} el rol ${role.name}?`,
            header: 'Confirmar cambio de estado',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Confirmar',
            rejectLabel: 'Cancelar',
            accept: () => {
                void this.changeStatus(role, nextStatus);
            }
        });
    }

    async changeStatus(role: ManagedRole, status: RoleStatus): Promise<void> {
        if (role.is_system_role) {
            this.messageService.add({ severity: 'warn', summary: 'Rol protegido', detail: 'Los roles base no se pueden inactivar desde el frontend.', life: 3500 });
            return;
        }

        try {
            await this.rolesService.updateStatus(role.id, status);
            this.messageService.add({ severity: 'success', summary: 'Estado actualizado', detail: `${role.name} ahora esta ${this.statusLabel(status).toLowerCase()}.`, life: 3000 });
            await this.reload();
            await this.auth.refreshCurrentUser();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado del rol.', life: 3500 });
        }
    }

    confirmDelete(role: ManagedRole): void {
        this.confirmationService.confirm({
            message: `Deseas eliminar el rol ${role.name}? Esta accion no se permite para roles base ni roles asignados a usuarios.`,
            header: 'Eliminar rol',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                void this.deleteRole(role);
            }
        });
    }

    async deleteRole(role: ManagedRole): Promise<void> {
        try {
            await this.rolesService.deleteRole(role);
            this.messageService.add({ severity: 'success', summary: 'Rol eliminado', detail: 'El rol fue eliminado correctamente.', life: 3000 });
            await this.reload();
        } catch (error) {
            const detail = error instanceof Error ? error.message : 'No se pudo eliminar el rol.';
            this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 4000 });
        }
    }

    statusLabel(status: RoleStatus): string {
        return status === 'active' ? 'Activo' : 'Inactivo';
    }

    moduleSummary(role: ManagedRole): string {
        const modules = [...new Set(role.permissions.map((permission) => this.moduleLabel(permission.module_key)))];
        return modules.length ? modules.slice(0, 3).join(', ') + (modules.length > 3 ? ` +${modules.length - 3}` : '') : 'Sin modulos';
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

    private permissionGroups(): PermissionGroup[] {
        return [...new Set(this.permissions().map((permission) => permission.module_key))].map((moduleKey) => ({
            moduleKey,
            label: this.moduleLabel(moduleKey)
        }));
    }

    private async loadPermissions(): Promise<void> {
        try {
            this.permissions.set(await this.rolesService.listPermissions());
        } catch {
            this.messageService.add({ severity: 'warn', summary: 'Permisos', detail: 'No se pudo cargar la lista de modulos para filtros.', life: 3500 });
        }
    }

    private normalizeSortField(sortField: string | string[] | undefined | null): string {
        return Array.isArray(sortField) ? (sortField[0] ?? 'created_at') : (sortField ?? 'created_at');
    }
}
