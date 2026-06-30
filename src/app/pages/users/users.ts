import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@/app/core/auth/auth.service';
import { Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { CompanyType, ManagedUser, UserCompanyOption, UserRoleOption, UserStatus, UsersService } from './users.service';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [ButtonModule, CommonModule, ConfirmDialogModule, DatePipe, DialogModule, InputTextModule, MessageModule, MultiSelectModule, ReactiveFormsModule, RouterModule, SelectModule, TableModule, TagModule, ToastModule, ToolbarModule],
    providers: [ConfirmationService, MessageService],
    template: `
        <p-toast />
        <p-confirmdialog [style]="{ width: '450px' }" />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Administracion</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Usuarios</h1>
                <p class="text-muted-color max-w-3xl">Gestiona perfiles, estados, roles y empresas asociadas de los usuarios del sistema.</p>
            </div>

            <p-toolbar>
                <ng-template #start>
                    <p-button label="Nuevo usuario" icon="pi pi-plus" (onClick)="openCreate()" [disabled]="!auth.hasPermission('users.create')" />
                </ng-template>
                <ng-template #end>
                    <p-button label="Actualizar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="reload()" [loading]="loading()" />
                </ng-template>
            </p-toolbar>

            <div class="card">
                <form [formGroup]="filtersForm" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-5" (ngSubmit)="applyFilters()">
                    <div class="flex flex-col gap-2 xl:col-span-2">
                        <label for="search" class="font-medium">Buscar</label>
                        <input pInputText id="search" formControlName="search" placeholder="Nombre o email" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="statusFilter" class="font-medium">Estado</label>
                        <p-select inputId="statusFilter" formControlName="status" [options]="statusFilterOptions" optionLabel="label" optionValue="value" placeholder="Todos" class="w-full" [showClear]="true" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="roleFilter" class="font-medium">Rol</label>
                        <p-select inputId="roleFilter" formControlName="roleId" [options]="roles()" optionLabel="name" optionValue="id" placeholder="Todos" class="w-full" [showClear]="true" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="companyFilter" class="font-medium">Empresa</label>
                        <p-select inputId="companyFilter" formControlName="companyId" [options]="companies()" optionLabel="business_name" optionValue="id" placeholder="Todas" class="w-full" [showClear]="true" />
                    </div>

                    <div class="md:col-span-2 xl:col-span-5 flex justify-end gap-3">
                        <p-button type="button" label="Limpiar" icon="pi pi-filter-slash" severity="secondary" [outlined]="true" (onClick)="clearFilters()" />
                        <p-button type="submit" label="Filtrar" icon="pi pi-search" />
                    </div>
                </form>

                <p-table
                    [value]="users()"
                    [lazy]="true"
                    (onLazyLoad)="loadUsers($event)"
                    [loading]="loading()"
                    [paginator]="true"
                    [rows]="10"
                    [totalRecords]="totalRecords()"
                    [rowsPerPageOptions]="[10, 20, 50]"
                    [rowHover]="true"
                    dataKey="id"
                    sortField="created_at"
                    [sortOrder]="-1"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} usuarios"
                    [showCurrentPageReport]="true"
                    responsiveLayout="scroll"
                    [tableStyle]="{ 'min-width': '76rem' }"
                >
                    <ng-template #header>
                        <tr>
                            <th pSortableColumn="full_name" style="min-width: 16rem">Usuario <p-sortIcon field="full_name" /></th>
                            <th pSortableColumn="email" style="min-width: 16rem">Email <p-sortIcon field="email" /></th>
                            <th style="min-width: 14rem">Roles</th>
                            <th style="min-width: 16rem">Empresas</th>
                            <th pSortableColumn="status" style="min-width: 10rem">Estado <p-sortIcon field="status" /></th>
                            <th pSortableColumn="created_at" style="min-width: 12rem">Creacion <p-sortIcon field="created_at" /></th>
                            <th style="width: 10rem"></th>
                        </tr>
                    </ng-template>

                    <ng-template #body let-user>
                        <tr>
                            <td>
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center overflow-hidden shrink-0">
                                        @if (user.avatar_url) {
                                            <img [src]="user.avatar_url" [alt]="user.full_name" class="w-full h-full object-cover" />
                                        } @else {
                                            <span class="font-semibold">{{ initials(user.full_name) }}</span>
                                        }
                                    </div>
                                    <div>
                                        <div class="font-medium text-surface-900 dark:text-surface-0">{{ user.full_name }}</div>
                                        <small class="text-muted-color">{{ user.phone || 'Sin telefono' }}</small>
                                    </div>
                                </div>
                            </td>
                            <td>{{ user.email }}</td>
                            <td>
                                <div class="flex flex-wrap gap-2">
                                    @for (role of user.roles; track role.id) {
                                        <p-tag [value]="role.name" severity="info" />
                                    } @empty {
                                        <span class="text-muted-color text-sm">Sin roles</span>
                                    }
                                </div>
                            </td>
                            <td>
                                <div class="flex flex-col gap-1">
                                    @for (company of user.companies.slice(0, 2); track company.id) {
                                        <span>{{ company.business_name }}</span>
                                    } @empty {
                                        <span class="text-muted-color text-sm">Sin empresas</span>
                                    }
                                    @if (user.companies.length > 2) {
                                        <small class="text-muted-color">+{{ user.companies.length - 2 }} mas</small>
                                    }
                                </div>
                            </td>
                            <td><p-tag [value]="statusLabel(user.status)" [severity]="user.status === 'active' ? 'success' : 'danger'" /></td>
                            <td>{{ user.created_at | date: 'dd/MM/yyyy HH:mm' }}</td>
                            <td>
                                <div class="flex justify-end gap-2">
                                    <p-button icon="pi pi-eye" [rounded]="true" [outlined]="true" severity="secondary" (onClick)="openDetail(user)" />
                                    <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (onClick)="openEdit(user)" [disabled]="!auth.hasPermission('users.update')" />
                                    <p-button
                                        [icon]="user.status === 'active' ? 'pi pi-ban' : 'pi pi-check'"
                                        [rounded]="true"
                                        [outlined]="true"
                                        [severity]="user.status === 'active' ? 'danger' : 'success'"
                                        (onClick)="confirmStatusChange(user)"
                                        [disabled]="!auth.hasPermission('users.delete')"
                                    />
                                </div>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="7">No se encontraron usuarios.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </div>

        <p-dialog [visible]="editDialogVisible()" (visibleChange)="editDialogVisible.set($event)" [style]="{ width: '680px' }" header="Editar usuario" [modal]="true">
            <form [formGroup]="userForm" class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div class="flex flex-col gap-2 md:col-span-2">
                    <label for="fullName" class="font-medium">Nombre completo</label>
                    <input pInputText id="fullName" formControlName="full_name" />
                    @if (userForm.controls.full_name.touched && userForm.controls.full_name.invalid) {
                        <small class="text-red-500">El nombre es obligatorio.</small>
                    }
                </div>

                <div class="flex flex-col gap-2">
                    <label for="email" class="font-medium">Email</label>
                    <input pInputText id="email" formControlName="email" readonly />
                    <small class="text-muted-color">El cambio de email queda pendiente de validacion.</small>
                </div>

                <div class="flex flex-col gap-2">
                    <label for="phone" class="font-medium">Telefono</label>
                    <input pInputText id="phone" formControlName="phone" />
                    @if (userForm.controls.phone.touched && userForm.controls.phone.invalid) {
                        <small class="text-red-500">Ingresa un telefono valido.</small>
                    }
                </div>

                <div class="flex flex-col gap-2 md:col-span-2">
                    <label for="avatarUrl" class="font-medium">URL de avatar</label>
                    <input pInputText id="avatarUrl" formControlName="avatar_url" placeholder="https://..." />
                    @if (userForm.controls.avatar_url.touched && userForm.controls.avatar_url.invalid) {
                        <small class="text-red-500">Ingresa una URL valida.</small>
                    }
                </div>

                <div class="flex flex-col gap-2">
                    <label for="status" class="font-medium">Estado</label>
                    <p-select inputId="status" formControlName="status" [options]="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="roles" class="font-medium">Roles</label>
                    <p-multiselect inputId="roles" formControlName="role_ids" [options]="roles()" optionLabel="name" optionValue="id" placeholder="Seleccionar roles" class="w-full" display="chip" />
                    @if (userForm.controls.role_ids.touched && userForm.controls.role_ids.invalid) {
                        <small class="text-red-500">Selecciona al menos un rol.</small>
                    }
                </div>

                <div class="flex flex-col gap-2 md:col-span-2">
                    <label for="companies" class="font-medium">Empresas asociadas</label>
                    <p-multiselect inputId="companies" formControlName="company_ids" [options]="companies()" optionLabel="business_name" optionValue="id" placeholder="Seleccionar empresas" class="w-full" display="chip" />
                    @if (clientRoleSelected() && userForm.controls.company_ids.value.length === 0) {
                        <small class="text-amber-500">Para rol Cliente se espera asociar al menos una empresa. Pendiente de validacion.</small>
                    }
                </div>
            </form>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (onClick)="editDialogVisible.set(false)" />
                <p-button label="Guardar" icon="pi pi-save" (onClick)="saveUser()" [loading]="saving()" [disabled]="userForm.invalid || saving()" />
            </ng-template>
        </p-dialog>

        <p-dialog [visible]="detailDialogVisible()" (visibleChange)="detailDialogVisible.set($event)" [style]="{ width: '620px' }" header="Detalle de usuario" [modal]="true">
            @if (selectedUser(); as user) {
                <div class="flex flex-col gap-5">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center overflow-hidden">
                            @if (user.avatar_url) {
                                <img [src]="user.avatar_url" [alt]="user.full_name" class="w-full h-full object-cover" />
                            } @else {
                                <span class="text-xl font-semibold">{{ initials(user.full_name) }}</span>
                            }
                        </div>
                        <div>
                            <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0">{{ user.full_name }}</h2>
                            <p class="text-muted-color">{{ user.email }}</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <span class="text-sm text-muted-color">Telefono</span>
                            <p class="font-medium">{{ user.phone || 'Sin telefono' }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Estado</span>
                            <div class="mt-1"><p-tag [value]="statusLabel(user.status)" [severity]="user.status === 'active' ? 'success' : 'danger'" /></div>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Creado</span>
                            <p class="font-medium">{{ user.created_at | date: 'dd/MM/yyyy HH:mm' }}</p>
                        </div>
                        <div>
                            <span class="text-sm text-muted-color">Actualizado</span>
                            <p class="font-medium">{{ user.updated_at | date: 'dd/MM/yyyy HH:mm' }}</p>
                        </div>
                    </div>

                    <div>
                        <h3 class="font-semibold mb-2">Roles</h3>
                        <div class="flex flex-wrap gap-2">
                            @for (role of user.roles; track role.id) {
                                <p-tag [value]="role.name" severity="info" />
                            } @empty {
                                <span class="text-muted-color">Sin roles asociados.</span>
                            }
                        </div>
                    </div>

                    <div>
                        <h3 class="font-semibold mb-2">Empresas asociadas</h3>
                        <div class="flex flex-col gap-2">
                            @for (company of user.companies; track company.id) {
                                <div class="border border-surface-200 dark:border-surface-700 rounded-md p-3">
                                    <div class="font-medium">{{ company.business_name }}</div>
                                    <small class="text-muted-color">RUC {{ company.ruc }} · {{ companyTypeLabel(company.company_type) }}</small>
                                </div>
                            } @empty {
                                <span class="text-muted-color">Sin empresas asociadas.</span>
                            }
                        </div>
                    </div>
                </div>
            }
        </p-dialog>
    `
})
export class Users implements OnInit {
    readonly auth = inject(AuthService);
    private readonly fb = inject(FormBuilder);
    private readonly usersService = inject(UsersService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);
    private readonly router = inject(Router);

    readonly users = signal<ManagedUser[]>([]);
    readonly roles = signal<UserRoleOption[]>([]);
    readonly companies = signal<UserCompanyOption[]>([]);
    readonly totalRecords = signal(0);
    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly selectedUser = signal<ManagedUser | null>(null);
    readonly editDialogVisible = signal(false);
    readonly detailDialogVisible = signal(false);

    private lastLazyEvent: TableLazyLoadEvent = { first: 0, rows: 10, sortField: 'created_at', sortOrder: -1 };

    readonly statusOptions: { label: string; value: UserStatus }[] = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' }
    ];

    readonly statusFilterOptions = this.statusOptions;

    readonly filtersForm = this.fb.group({
        search: [''],
        status: [null as UserStatus | null],
        roleId: [null as string | null],
        companyId: [null as string | null]
    });

    readonly userForm = this.fb.nonNullable.group({
        full_name: ['', Validators.required],
        email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
        phone: ['', [Validators.maxLength(30), Validators.pattern(/^[0-9+\-() ]*$/)]],
        avatar_url: ['', Validators.pattern(/^https?:\/\/.+/)],
        status: ['active' as UserStatus, Validators.required],
        role_ids: [[] as string[], Validators.required],
        company_ids: [[] as string[]]
    });

    async ngOnInit(): Promise<void> {
        await this.loadOptions();
    }

    async loadUsers(event: TableLazyLoadEvent): Promise<void> {
        this.lastLazyEvent = event;
        this.loading.set(true);

        try {
            const result = await this.usersService.listUsers({
                first: event.first ?? 0,
                rows: event.rows ?? 10,
                sortField: this.normalizeSortField(event.sortField),
                sortOrder: event.sortOrder === 1 ? 1 : -1,
                filters: this.filtersForm.getRawValue()
            });

            this.users.set(result.users);
            this.totalRecords.set(result.total);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el listado de usuarios.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }

    async reload(): Promise<void> {
        await this.loadUsers(this.lastLazyEvent);
    }

    async applyFilters(): Promise<void> {
        await this.loadUsers({ ...this.lastLazyEvent, first: 0 });
    }

    async clearFilters(): Promise<void> {
        this.filtersForm.reset({ search: '', status: null, roleId: null, companyId: null });
        await this.applyFilters();
    }

    async openCreate(): Promise<void> {
        await this.router.navigate(['/users/new']);
    }

    openEdit(user: ManagedUser): void {
        this.selectedUser.set(user);
        this.userForm.reset({
            full_name: user.full_name,
            email: user.email,
            phone: user.phone ?? '',
            avatar_url: user.avatar_url ?? '',
            status: user.status,
            role_ids: user.roles.map((role) => role.id),
            company_ids: user.companies.map((company) => company.id)
        });
        this.editDialogVisible.set(true);
    }

    openDetail(user: ManagedUser): void {
        this.selectedUser.set(user);
        this.detailDialogVisible.set(true);
    }

    async saveUser(): Promise<void> {
        this.userForm.markAllAsTouched();

        const user = this.selectedUser();
        if (!user || this.userForm.invalid) {
            return;
        }

        this.saving.set(true);

        try {
            const value = this.userForm.getRawValue();
            await this.usersService.updateUser(user.id, {
                full_name: value.full_name,
                phone: value.phone || null,
                avatar_url: value.avatar_url || null,
                status: value.status,
                roleIds: value.role_ids,
                companyIds: value.company_ids
            });

            this.editDialogVisible.set(false);
            this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Usuario actualizado correctamente.', life: 3000 });
            await this.reload();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el usuario. Revisa permisos y RLS.', life: 4000 });
        } finally {
            this.saving.set(false);
        }
    }

    confirmStatusChange(user: ManagedUser): void {
        const nextStatus: UserStatus = user.status === 'active' ? 'inactive' : 'active';
        const action = nextStatus === 'inactive' ? 'inactivar' : 'activar';

        this.confirmationService.confirm({
            message: `Deseas ${action} a ${user.full_name}?`,
            header: 'Confirmar cambio de estado',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Confirmar',
            rejectLabel: 'Cancelar',
            accept: () => {
                void this.changeStatus(user, nextStatus);
            }
        });
    }

    async changeStatus(user: ManagedUser, status: UserStatus): Promise<void> {
        try {
            await this.usersService.updateStatus(user.id, status);
            this.messageService.add({ severity: 'success', summary: 'Estado actualizado', detail: `${user.full_name} ahora esta ${this.statusLabel(status).toLowerCase()}.`, life: 3000 });
            await this.reload();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado del usuario.', life: 3500 });
        }
    }

    statusLabel(status: UserStatus): string {
        return status === 'active' ? 'Activo' : 'Inactivo';
    }

    initials(name: string): string {
        return name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join('');
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

    clientRoleSelected(): boolean {
        const selectedRoleIds = new Set(this.userForm.controls.role_ids.value);
        return this.roles().some((role) => role.name === 'Cliente' && selectedRoleIds.has(role.id));
    }

    private async loadOptions(): Promise<void> {
        try {
            const [roles, companies] = await Promise.all([this.usersService.listRoles(), this.usersService.listCompanies()]);
            this.roles.set(roles);
            this.companies.set(companies);
        } catch {
            this.messageService.add({ severity: 'warn', summary: 'Catalogos', detail: 'No se pudieron cargar roles o empresas para filtros.', life: 3500 });
        }
    }

    private normalizeSortField(sortField: string | string[] | undefined | null): string {
        return Array.isArray(sortField) ? (sortField[0] ?? 'created_at') : (sortField ?? 'created_at');
    }

}
