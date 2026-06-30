import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '@/app/core/auth/auth.service';
import { Permission, RolesService, SaveRolePayload } from './roles.service';
import { RolesForm } from './roles-form';

@Component({
    selector: 'app-roles-new',
    standalone: true,
    imports: [CommonModule, RolesForm, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Administracion</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Nuevo rol</h1>
                <p class="text-muted-color max-w-3xl">Define un rol personalizado y asigna su matriz de permisos.</p>
            </div>

            <div class="card">
                <app-roles-form mode="create" [permissions]="permissions()" [saving]="saving()" (save)="createRole($event)" />
            </div>
        </div>
    `
})
export class RolesNew implements OnInit {
    private readonly auth = inject(AuthService);
    private readonly rolesService = inject(RolesService);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    readonly permissions = signal<Permission[]>([]);
    readonly saving = signal(false);

    async ngOnInit(): Promise<void> {
        await this.loadPermissions();
    }

    async createRole(payload: SaveRolePayload): Promise<void> {
        this.saving.set(true);

        try {
            await this.rolesService.createRole(payload);
            await this.auth.refreshCurrentUser();
            this.messageService.add({ severity: 'success', summary: 'Rol creado', detail: 'El rol fue creado correctamente.', life: 2500 });
            await this.router.navigate(['/roles']);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el rol. Revisa nombre unico, permisos y RLS.', life: 4500 });
        } finally {
            this.saving.set(false);
        }
    }

    private async loadPermissions(): Promise<void> {
        try {
            this.permissions.set(await this.rolesService.listPermissions());
        } catch {
            this.messageService.add({ severity: 'warn', summary: 'Permisos', detail: 'No se pudo cargar la matriz de permisos.', life: 3500 });
        }
    }
}
