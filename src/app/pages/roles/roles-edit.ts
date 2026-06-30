import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '@/app/core/auth/auth.service';
import { ManagedRole, Permission, RolesService, SaveRolePayload } from './roles.service';
import { RolesForm } from './roles-form';

@Component({
    selector: 'app-roles-edit',
    standalone: true,
    imports: [ButtonModule, CommonModule, RolesForm, RouterModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Administracion</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Editar rol</h1>
                <p class="text-muted-color max-w-3xl">Actualiza los datos operativos y la matriz de permisos del rol.</p>
            </div>

            @if (loading()) {
                <div class="card">Cargando rol...</div>
            } @else if (role(); as currentRole) {
                <div class="card">
                    <app-roles-form mode="edit" [role]="currentRole" [permissions]="permissions()" [saving]="saving()" (save)="updateRole($event)" />
                </div>
            } @else {
                <div class="card flex flex-col gap-4">
                    <h2 class="text-xl font-semibold">Rol no encontrado</h2>
                    <p class="text-muted-color">No se pudo cargar el rol solicitado.</p>
                    <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/roles" />
                </div>
            }
        </div>
    `
})
export class RolesEdit implements OnInit {
    private readonly auth = inject(AuthService);
    private readonly rolesService = inject(RolesService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    readonly role = signal<ManagedRole | null>(null);
    readonly permissions = signal<Permission[]>([]);
    readonly loading = signal(true);
    readonly saving = signal(false);

    async ngOnInit(): Promise<void> {
        await this.loadPageData();
    }

    async updateRole(payload: SaveRolePayload): Promise<void> {
        const role = this.role();

        if (!role) {
            return;
        }

        this.saving.set(true);

        try {
            await this.rolesService.updateRole(role.id, payload);
            await this.auth.refreshCurrentUser();
            this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Rol actualizado correctamente.', life: 2500 });
            await this.router.navigate(['/roles']);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el rol. Revisa permisos, nombre unico y RLS.', life: 4500 });
        } finally {
            this.saving.set(false);
        }
    }

    private async loadPageData(): Promise<void> {
        const roleId = this.route.snapshot.paramMap.get('id');

        if (!roleId) {
            this.loading.set(false);
            return;
        }

        try {
            const [role, permissions] = await Promise.all([this.rolesService.getRole(roleId), this.rolesService.listPermissions()]);
            this.role.set(role);
            this.permissions.set(permissions);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el rol.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }
}
