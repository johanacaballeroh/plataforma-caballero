import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CompaniesForm } from './companies-form';
import { CompaniesRelations } from './companies-relations';
import { CompaniesService, ManagedCompany, SaveCompanyPayload } from './companies.service';

@Component({
    selector: 'app-companies-edit',
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
                        <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Editar empresa</h1>
                        <p class="text-muted-color max-w-3xl mt-2">Actualiza la ficha de la empresa y administra sedes o contactos asociados.</p>
                    </div>
                    <p-button label="Ver detalle" icon="pi pi-eye" severity="secondary" [outlined]="true" [routerLink]="['/companies', company()?.id]" [disabled]="!company()" />
                </div>
            </div>

            @if (loading()) {
                <div class="card">Cargando empresa...</div>
            } @else if (company(); as currentCompany) {
                <div class="card">
                    <app-companies-form mode="edit" [company]="currentCompany" [saving]="saving()" (save)="updateCompany($event)" />
                </div>

                <app-companies-relations [companyId]="currentCompany.id" />
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
export class CompaniesEdit implements OnInit {
    private readonly companiesService = inject(CompaniesService);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);

    readonly company = signal<ManagedCompany | null>(null);
    readonly loading = signal(true);
    readonly saving = signal(false);

    async ngOnInit(): Promise<void> {
        const companyId = this.route.snapshot.paramMap.get('id');

        if (!companyId) {
            this.loading.set(false);
            return;
        }

        await this.loadCompany(companyId);
    }

    async updateCompany(payload: SaveCompanyPayload): Promise<void> {
        const currentCompany = this.company();
        if (!currentCompany) {
            return;
        }

        this.saving.set(true);

        try {
            const updatedCompany = await this.companiesService.updateCompany(currentCompany.id, payload);
            this.company.set(updatedCompany);
            this.messageService.add({ severity: 'success', summary: 'Empresa actualizada', detail: 'La empresa fue actualizada correctamente.', life: 2500 });
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la empresa. Revisa duplicados, permisos y RLS.', life: 4000 });
        } finally {
            this.saving.set(false);
        }
    }

    private async loadCompany(companyId: string): Promise<void> {
        this.loading.set(true);

        try {
            this.company.set(await this.companiesService.getCompany(companyId));
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la empresa.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }
}
