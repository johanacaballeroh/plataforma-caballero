import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '@/app/core/auth/auth.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CompaniesForm } from './companies-form';
import { CompaniesRelations } from './companies-relations';
import { CompaniesService, ManagedCompany } from './companies.service';

@Component({
    selector: 'app-companies-detail',
    standalone: true,
    imports: [ButtonModule, CommonModule, CompaniesForm, CompaniesRelations, RouterModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Operacion</span>
                <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Detalle de empresa</h1>
                        <p class="text-muted-color max-w-3xl mt-2">Consulta la ficha completa de la empresa, sedes y contactos registrados.</p>
                    </div>
                    @if (company(); as currentCompany) {
                        <p-button label="Editar" icon="pi pi-pencil" [routerLink]="['/companies', currentCompany.id, 'edit']" [disabled]="!auth.hasPermission('companies.update')" />
                    }
                </div>
            </div>

            @if (loading()) {
                <div class="card">Cargando empresa...</div>
            } @else if (company(); as currentCompany) {
                <div class="card">
                    <app-companies-form mode="detail" [company]="currentCompany" />
                </div>

                <app-companies-relations [companyId]="currentCompany.id" [readonly]="true" />
            } @else {
                <div class="card flex flex-col gap-4">
                    <h2 class="text-xl font-semibold">Empresa no encontrada</h2>
                    <p class="text-muted-color">No se pudo cargar la empresa solicitada.</p>
                    <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/companies" />
                </div>
            }
        </div>
    `
})
export class CompaniesDetail implements OnInit {
    readonly auth = inject(AuthService);
    private readonly companiesService = inject(CompaniesService);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);

    readonly company = signal<ManagedCompany | null>(null);
    readonly loading = signal(true);

    async ngOnInit(): Promise<void> {
        const companyId = this.route.snapshot.paramMap.get('id');

        if (!companyId) {
            this.loading.set(false);
            return;
        }

        try {
            this.company.set(await this.companiesService.getCompany(companyId));
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la empresa.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }
}
