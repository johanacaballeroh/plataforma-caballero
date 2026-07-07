import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AuthService } from '../../core/auth/auth.service';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, InputTextModule, MessageModule, PasswordModule, ReactiveFormsModule, RouterModule, RippleModule, AppFloatingConfigurator],
    template: `
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <img src="/img/logo.png" class="mb-8 w-100 mx-auto">
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Acceso a Plataforma</div>
                            <span class="text-muted-color font-medium">Gestion y emisión de certificados</span>
                        </div>

                        <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col">
                            @if (error()) {
                                <p-message severity="error" [text]="error() || ''" styleClass="mb-6" />
                            }

                            <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                            <input pInputText id="email1" type="email" placeholder="usuario@empresa.com" class="w-full md:w-120 mb-2" formControlName="email" autocomplete="email" />
                            @if (form.controls.email.touched && form.controls.email.invalid) {
                                <small class="text-red-500 mb-6">Ingresa un email valido.</small>
                            } @else {
                                <span class="mb-6"></span>
                            }

                            <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Contraseña</label>
                            <p-password id="password1" formControlName="password" placeholder="Contraseña" [toggleMask]="true" styleClass="mb-2" [fluid]="true" [feedback]="false" autocomplete="current-password"></p-password>
                            @if (form.controls.password.touched && form.controls.password.invalid) {
                                <small class="text-red-500 mb-6">Ingresa tu contraseña.</small>
                            } @else {
                                <span class="mb-6"></span>
                            }

                            <p-button type="submit" label="Ingresar" styleClass="w-full" [loading]="loading()" [disabled]="form.invalid || loading()"></p-button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Login {
    private readonly auth = inject(AuthService);
    private readonly fb = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    readonly loading = signal(false);
    readonly error = signal<string | null>(null);

    readonly form = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', Validators.required]
    });

    async submit() {
        this.error.set(null);
        this.form.markAllAsTouched();

        if (this.form.invalid) {
            return;
        }

        this.loading.set(true);

        try {
            const { email, password } = this.form.getRawValue();
            await this.auth.signIn(email, password);
            const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
            await this.router.navigateByUrl(returnUrl);
        } catch {
            this.error.set('No se pudo iniciar sesion. Verifica tus credenciales y estado de usuario.');
        } finally {
            this.loading.set(false);
        }
    }
}
