import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '@/app/core/auth/auth.service';
import { UserProfile } from '@/app/core/auth/auth.models';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProfileCompany, ProfileRole, ProfileService } from './profile.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [ButtonModule, CardModule, CommonModule, DatePipe, InputTextModule, MessageModule, PasswordModule, ReactiveFormsModule, TableModule, TagModule],
    template: `
        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Cuenta</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Perfil de usuario</h1>
                <p class="text-muted-color max-w-3xl">Gestiona tus datos personales permitidos y revisa tus roles y empresas asociadas.</p>
            </div>

            @if (error()) {
                <p-message severity="error" [text]="error() || ''" />
            }

            @if (success()) {
                <p-message severity="success" [text]="success() || ''" />
            }

            <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <p-card styleClass="h-full">
                    <div class="flex flex-col items-center text-center gap-4">
                        <div class="w-28 h-28 rounded-full bg-primary/10 text-primary flex items-center justify-center overflow-hidden">
                            @if (profileForm.controls.avatar_url.value) {
                                <img [src]="profileForm.controls.avatar_url.value" alt="Avatar" class="w-full h-full object-cover" />
                            } @else {
                                <span class="text-4xl font-semibold">{{ initials() }}</span>
                            }
                        </div>
                        <div>
                            <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-1">{{ profile()?.full_name || 'Usuario' }}</h2>
                            <p class="text-muted-color">{{ profile()?.email }}</p>
                        </div>
                        <p-tag [value]="profile()?.status === 'active' ? 'Activo' : 'Inactivo'" [severity]="profile()?.status === 'active' ? 'success' : 'danger'" />
                    </div>
                </p-card>

                <p-card header="Datos personales" styleClass="xl:col-span-2">
                    <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div class="flex flex-col gap-2 md:col-span-2">
                            <label for="fullName" class="font-medium text-surface-900 dark:text-surface-0">Nombre completo</label>
                            <input pInputText id="fullName" formControlName="full_name" autocomplete="name" />
                            @if (profileForm.controls.full_name.touched && profileForm.controls.full_name.invalid) {
                                <small class="text-red-500">El nombre es obligatorio.</small>
                            }
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="email" class="font-medium text-surface-900 dark:text-surface-0">Email</label>
                            <input pInputText id="email" formControlName="email" readonly autocomplete="email" />
                            <small class="text-muted-color">El cambio de email queda pendiente de validacion.</small>
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="phone" class="font-medium text-surface-900 dark:text-surface-0">Telefono</label>
                            <input pInputText id="phone" formControlName="phone" autocomplete="tel" />
                            @if (profileForm.controls.phone.touched && profileForm.controls.phone.invalid) {
                                <small class="text-red-500">Ingresa un telefono valido.</small>
                            }
                        </div>

                        <div class="flex flex-col gap-2 md:col-span-2">
                            <label for="avatarUrl" class="font-medium text-surface-900 dark:text-surface-0">URL de avatar</label>
                            <input pInputText id="avatarUrl" formControlName="avatar_url" placeholder="https://..." />
                            @if (profileForm.controls.avatar_url.touched && profileForm.controls.avatar_url.invalid) {
                                <small class="text-red-500">Ingresa una URL valida.</small>
                            } @else {
                                <small class="text-muted-color">La carga de archivos a Storage queda pendiente de validacion.</small>
                            }
                        </div>

                        <div class="md:col-span-2 flex justify-end gap-3">
                            <p-button type="button" label="Restaurar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="resetProfileForm()" [disabled]="savingProfile() || loading()" />
                            <p-button type="submit" label="Guardar cambios" icon="pi pi-save" [loading]="savingProfile()" [disabled]="profileForm.invalid || savingProfile() || loading()" />
                        </div>
                    </form>
                </p-card>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <p-card header="Cambio de contrasena" styleClass="xl:col-span-1">
                    <form [formGroup]="passwordForm" (ngSubmit)="savePassword()" class="flex flex-col gap-5">
                        <div class="flex flex-col gap-2">
                            <label for="newPassword" class="font-medium text-surface-900 dark:text-surface-0">Nueva contrasena</label>
                            <p-password id="newPassword" formControlName="password" [toggleMask]="true" [feedback]="true" [fluid]="true" autocomplete="new-password" />
                            @if (passwordForm.controls.password.touched && passwordForm.controls.password.invalid) {
                                <small class="text-red-500">La contrasena debe tener al menos 6 caracteres.</small>
                            }
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="confirmPassword" class="font-medium text-surface-900 dark:text-surface-0">Confirmar contrasena</label>
                            <p-password id="confirmPassword" formControlName="confirmPassword" [toggleMask]="true" [feedback]="false" [fluid]="true" autocomplete="new-password" />
                            @if (passwordForm.touched && passwordForm.hasError('passwordMismatch')) {
                                <small class="text-red-500">Las contrasenas no coinciden.</small>
                            }
                        </div>

                        <p-button type="submit" label="Actualizar contrasena" icon="pi pi-lock" [loading]="savingPassword()" [disabled]="passwordForm.invalid || savingPassword() || loading()" />
                    </form>
                </p-card>

                <p-card header="Roles asignados" styleClass="xl:col-span-1">
                    <p-table [value]="roles()" [loading]="loading()" styleClass="p-datatable-sm">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Rol</th>
                                <th>Estado</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-role>
                            <tr>
                                <td>{{ role.name }}</td>
                                <td><p-tag [value]="role.status === 'active' ? 'Activo' : 'Inactivo'" [severity]="role.status === 'active' ? 'success' : 'danger'" /></td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="2">No hay roles asociados.</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </p-card>

                <p-card header="Empresas asociadas" styleClass="xl:col-span-1">
                    <p-table [value]="companies()" [loading]="loading()" styleClass="p-datatable-sm">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Empresa</th>
                                <th>RUC</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-company>
                            <tr>
                                <td>
                                    <div class="font-medium">{{ company.business_name }}</div>
                                    <small class="text-muted-color">{{ companyTypeLabel(company.company_type) }}</small>
                                </td>
                                <td>{{ company.ruc }}</td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="2">No hay empresas asociadas.</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </p-card>
            </div>

            <div class="text-sm text-muted-color">
                Ultima sesion cargada: {{ auth.session()?.expires_at ? (auth.session()?.expires_at! * 1000 | date: 'dd/MM/yyyy HH:mm') : 'Pendiente de validacion' }}
            </div>
        </div>
    `
})
export class Profile implements OnInit {
    readonly auth = inject(AuthService);
    private readonly fb = inject(FormBuilder);
    private readonly profileService = inject(ProfileService);

    readonly loading = signal(true);
    readonly savingProfile = signal(false);
    readonly savingPassword = signal(false);
    readonly error = signal<string | null>(null);
    readonly success = signal<string | null>(null);
    readonly profile = signal<UserProfile | null>(null);
    readonly roles = signal<ProfileRole[]>([]);
    readonly companies = signal<ProfileCompany[]>([]);

    readonly initials = computed(() => {
        const name = this.profile()?.full_name?.trim();

        if (!name) {
            return 'U';
        }

        return name
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join('');
    });

    readonly profileForm = this.fb.nonNullable.group({
        full_name: ['', Validators.required],
        email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
        phone: ['', [Validators.maxLength(30), Validators.pattern(/^[0-9+\-() ]*$/)]],
        avatar_url: ['', Validators.pattern(/^https?:\/\/.+/)]
    });

    readonly passwordForm = this.fb.nonNullable.group(
        {
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        },
        { validators: this.passwordsMatch }
    );

    async ngOnInit(): Promise<void> {
        await this.loadProfile();
    }

    async loadProfile(): Promise<void> {
        this.loading.set(true);
        this.error.set(null);
        this.success.set(null);

        try {
            const profile = await this.profileService.getCurrentProfile();
            const [roles, companies] = await Promise.all([this.profileService.getCurrentRoles(profile.id), this.profileService.getCurrentCompanies(profile.id)]);

            this.profile.set(profile);
            this.roles.set(roles);
            this.companies.set(companies);
            this.patchProfileForm(profile);
        } catch {
            this.error.set('No se pudo cargar tu perfil.');
        } finally {
            this.loading.set(false);
        }
    }

    async saveProfile(): Promise<void> {
        this.profileForm.markAllAsTouched();

        if (this.profileForm.invalid || !this.profile()) {
            return;
        }

        this.savingProfile.set(true);
        this.error.set(null);
        this.success.set(null);

        try {
            const formValue = this.profileForm.getRawValue();
            const updatedProfile = await this.profileService.updateCurrentProfile(this.profile()!.id, {
                full_name: formValue.full_name,
                phone: formValue.phone || null,
                avatar_url: formValue.avatar_url || null
            });

            this.profile.set(updatedProfile);
            this.patchProfileForm(updatedProfile);
            await this.auth.refreshCurrentUser();
            this.success.set('Perfil actualizado correctamente.');
        } catch {
            this.error.set('No se pudo actualizar tu perfil. Verifica los datos e intenta nuevamente.');
        } finally {
            this.savingProfile.set(false);
        }
    }

    async savePassword(): Promise<void> {
        this.passwordForm.markAllAsTouched();

        if (this.passwordForm.invalid) {
            return;
        }

        this.savingPassword.set(true);
        this.error.set(null);
        this.success.set(null);

        try {
            await this.profileService.updatePassword(this.passwordForm.controls.password.value);
            this.passwordForm.reset();
            this.success.set('Contrasena actualizada correctamente.');
        } catch {
            this.error.set('No se pudo actualizar la contrasena.');
        } finally {
            this.savingPassword.set(false);
        }
    }

    resetProfileForm(): void {
        const profile = this.profile();

        if (profile) {
            this.patchProfileForm(profile);
        }
    }

    companyTypeLabel(type: ProfileCompany['company_type']): string {
        const labels: Record<ProfileCompany['company_type'], string> = {
            generator: 'Generador',
            transporter: 'Transportista',
            final_destination: 'Destino final',
            both: 'Mixta'
        };

        return labels[type];
    }

    private patchProfileForm(profile: UserProfile): void {
        this.profileForm.reset({
            full_name: profile.full_name,
            email: profile.email,
            phone: profile.phone ?? '',
            avatar_url: profile.avatar_url ?? ''
        });
    }

    private passwordsMatch(control: AbstractControl): ValidationErrors | null {
        const password = control.get('password')?.value;
        const confirmPassword = control.get('confirmPassword')?.value;

        return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
    }
}
