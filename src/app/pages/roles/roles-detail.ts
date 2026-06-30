import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '@/app/core/auth/auth.service';
import { ManagedRole, Permission, RolesService } from './roles.service';
import { RolesForm } from './roles-form';

@Component({
    selector: 'app-roles-detail',
    standalone: true,
    imports: [ButtonModule, CommonModule, RolesForm, RouterModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Administracion</span>
                <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Detalle de rol</h1>
                        <p class="text-muted-color max-w-3xl mt-2">Consulta los datos del rol y su matriz de permisos.</p>
                    </div>
                    @if (role(); as currentRole) {
                        <p-button label="Editar" icon="pi pi-pencil" [routerLink]="['/roles', currentRole.id, 'edit']" [disabled]="!auth.hasPermission('roles.update')" />
                    }
                </div>
            </div>

            @if (loading()) {
                <div class="card">Cargando rol...</div>
            } @else if (role(); as currentRole) {
                <div class="card">
                    <app-roles-form mode="detail" [role]="currentRole" [permissions]="permissions()" />
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
export class RolesDetail implements OnInit {
    readonly auth = inject(AuthService);
    private readonly rolesService = inject(RolesService);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);

    readonly role = signal<ManagedRole | null>(null);
    readonly permissions = signal<Permission[]>([]);
    readonly loading = signal(true);

    async ngOnInit(): Promise<void> {
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
