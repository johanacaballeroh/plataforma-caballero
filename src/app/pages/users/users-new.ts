import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CompanyType, UserCompanyOption, UserRoleOption, UserStatus, UsersService } from './users.service';

@Component({
    selector: 'app-users-new',
    standalone: true,
    imports: [ButtonModule, CommonModule, InputTextModule, MessageModule, MultiSelectModule, PasswordModule, ReactiveFormsModule, RouterModule, SelectModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Administracion</span>
                <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Nuevo usuario</h1>
                        <p class="text-muted-color max-w-3xl mt-2">Crea la cuenta Auth inicial y asigna perfil, roles y empresas asociadas.</p>
                    </div>
                    <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/users" />
                </div>
            </div>

            <div class="card">
                <form [formGroup]="form" (ngSubmit)="createUser()" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div class="flex flex-col gap-2 md:col-span-2">
                            <label for="fullName" class="font-medium">Nombre completo</label>
                            <input pInputText id="fullName" formControlName="full_name" />
                            @if (form.controls.full_name.touched && form.controls.full_name.invalid) {
                                <small class="text-red-500">El nombre es obligatorio.</small>
                            }
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="email" class="font-medium">Email</label>
                            <input pInputText id="email" type="email" formControlName="email" autocomplete="off" />
                            @if (form.controls.email.touched && form.controls.email.invalid) {
                                <small class="text-red-500">Ingresa un email valido.</small>
                            }
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="phone" class="font-medium">Telefono</label>
                            <input pInputText id="phone" formControlName="phone" />
                            @if (form.controls.phone.touched && form.controls.phone.invalid) {
                                <small class="text-red-500">Ingresa un telefono valido.</small>
                            }
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="password" class="font-medium">Contrasena inicial</label>
                            <p-password id="password" formControlName="password" [toggleMask]="true" [feedback]="true" [fluid]="true" autocomplete="new-password" />
                            @if (form.controls.password.touched && form.controls.password.invalid) {
                                <small class="text-red-500">La contrasena debe tener al menos 6 caracteres.</small>
                            }
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="confirmPassword" class="font-medium">Confirmar contrasena</label>
                            <p-password id="confirmPassword" formControlName="confirmPassword" [toggleMask]="true" [feedback]="false" [fluid]="true" autocomplete="new-password" />
                            @if (form.touched && form.hasError('passwordMismatch')) {
                                <small class="text-red-500">Las contrasenas no coinciden.</small>
                            }
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="status" class="font-medium">Estado</label>
                            <p-select inputId="status" formControlName="status" [options]="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="roles" class="font-medium">Roles</label>
                            <p-multiselect inputId="roles" formControlName="role_ids" [options]="roles()" optionLabel="name" optionValue="id" placeholder="Seleccionar roles" class="w-full" display="chip" />
                            @if (form.controls.role_ids.touched && form.controls.role_ids.invalid) {
                                <small class="text-red-500">Selecciona al menos un rol.</small>
                            }
                        </div>

                        <div class="flex flex-col gap-2 md:col-span-2">
                            <label for="avatarUrl" class="font-medium">URL de avatar</label>
                            <input pInputText id="avatarUrl" formControlName="avatar_url" placeholder="https://..." />
                            @if (form.controls.avatar_url.touched && form.controls.avatar_url.invalid) {
                                <small class="text-red-500">Ingresa una URL valida.</small>
                            }
                        </div>

                        <div class="flex flex-col gap-2 md:col-span-2">
                            <label for="companies" class="font-medium">Empresas asociadas</label>
                            <p-multiselect inputId="companies" formControlName="company_ids" [options]="companies()" optionLabel="business_name" optionValue="id" placeholder="Seleccionar empresas" class="w-full" display="chip" />
                            @if (clientRoleSelected() && form.controls.company_ids.value.length === 0) {
                                <small class="text-amber-500">Para rol Cliente se espera asociar al menos una empresa. Pendiente de validacion.</small>
                            }
                        </div>
                    </div>

                    <div class="lg:col-span-1">
                        <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-5 flex flex-col gap-4">
                            <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Resumen</h2>
                            <div>
                                <span class="text-sm text-muted-color">Usuario</span>
                                <p class="font-medium">{{ form.controls.full_name.value || 'Sin nombre' }}</p>
                            </div>
                            <div>
                                <span class="text-sm text-muted-color">Email</span>
                                <p class="font-medium break-all">{{ form.controls.email.value || 'Sin email' }}</p>
                            </div>
                            <div>
                                <span class="text-sm text-muted-color">Estado</span>
                                <div class="mt-1">{{ statusLabel(form.controls.status.value) }}</div>
                            </div>
                            <div>
                                <span class="text-sm text-muted-color">Roles</span>
                                <p class="font-medium">{{ selectedRoleNames() || 'Sin roles' }}</p>
                            </div>
                            <div>
                                <span class="text-sm text-muted-color">Empresas</span>
                                <p class="font-medium">{{ form.controls.company_ids.value.length }} asociada(s)</p>
                            </div>
                            <p-message severity="info" text="La cuenta se crea en Supabase Auth y luego se completa el perfil con RLS." />
                        </div>
                    </div>

                    <div class="lg:col-span-3 flex justify-end gap-3">
                        <p-button type="button" label="Cancelar" icon="pi pi-times" severity="secondary" [outlined]="true" routerLink="/users" />
                        <p-button type="submit" label="Crear usuario" icon="pi pi-check" [loading]="saving()" [disabled]="form.invalid || saving()" />
                    </div>
                </form>
            </div>
        </div>
    `
})
export class UsersNew implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly usersService = inject(UsersService);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    readonly roles = signal<UserRoleOption[]>([]);
    readonly companies = signal<UserCompanyOption[]>([]);
    readonly saving = signal(false);

    readonly statusOptions: { label: string; value: UserStatus }[] = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' }
    ];

    readonly form = this.fb.nonNullable.group(
        {
            full_name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', [Validators.maxLength(30), Validators.pattern(/^[0-9+\-() ]*$/)]],
            avatar_url: ['', Validators.pattern(/^https?:\/\/.+/)],
            status: ['active' as UserStatus, Validators.required],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required],
            role_ids: [[] as string[], Validators.required],
            company_ids: [[] as string[]]
        },
        { validators: this.passwordsMatch }
    );

    async ngOnInit(): Promise<void> {
        try {
            const [roles, companies] = await Promise.all([this.usersService.listRoles(), this.usersService.listCompanies()]);

            this.roles.set(roles);
            this.companies.set(companies);
        } catch {
            this.messageService.add({ severity: 'warn', summary: 'Catalogos', detail: 'No se pudieron cargar roles o empresas.', life: 3500 });
        }
    }

    async createUser(): Promise<void> {
        this.form.markAllAsTouched();

        if (this.form.invalid) {
            return;
        }

        this.saving.set(true);

        try {
            const value = this.form.getRawValue();

            await this.usersService.createUser({
                full_name: value.full_name,
                email: value.email,
                phone: value.phone || null,
                avatar_url: value.avatar_url || null,
                status: value.status,
                password: value.password,
                roleIds: value.role_ids,
                companyIds: value.company_ids
            });

            this.messageService.add({ severity: 'success', summary: 'Usuario creado', detail: 'El usuario fue creado correctamente.', life: 2500 });
            await this.router.navigate(['/users']);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el usuario. Verifica email, permisos y configuracion de Auth.', life: 4500 });
        } finally {
            this.saving.set(false);
        }
    }

    clientRoleSelected(): boolean {
        const selectedRoleIds = new Set(this.form.controls.role_ids.value);

        return this.roles().some((role) => role.name === 'Cliente' && selectedRoleIds.has(role.id));
    }

    selectedRoleNames(): string {
        const selectedRoleIds = new Set(this.form.controls.role_ids.value);

        return this.roles()
            .filter((role) => selectedRoleIds.has(role.id))
            .map((role) => role.name)
            .join(', ');
    }

    statusLabel(status: UserStatus): string {
        return status === 'active' ? 'Activo' : 'Inactivo';
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

    private passwordsMatch(control: AbstractControl): ValidationErrors | null {
        const password = control.get('password')?.value;
        const confirmPassword = control.get('confirmPassword')?.value;

        return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
    }
}
