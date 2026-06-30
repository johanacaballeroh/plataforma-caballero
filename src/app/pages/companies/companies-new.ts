import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CompaniesForm } from './companies-form';
import { CompaniesService, SaveCompanyPayload } from './companies.service';

@Component({
    selector: 'app-companies-new',
    standalone: true,
    imports: [CommonModule, CompaniesForm, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-primary">Operacion</span>
                <h1 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Nueva empresa</h1>
                <p class="text-muted-color max-w-3xl">Registra la informacion base de la empresa. Luego podras agregar sedes y contactos desde la edicion.</p>
            </div>

            <div class="card">
                <app-companies-form mode="create" [saving]="saving()" (save)="createCompany($event)" />
            </div>
        </div>
    `
})
export class CompaniesNew {
    private readonly companiesService = inject(CompaniesService);
    private readonly messageService = inject(MessageService);
    private readonly router = inject(Router);

    readonly saving = signal(false);

    async createCompany(payload: SaveCompanyPayload): Promise<void> {
        this.saving.set(true);

        try {
            const company = await this.companiesService.createCompany(payload);
            this.messageService.add({ severity: 'success', summary: 'Empresa creada', detail: 'La empresa fue registrada correctamente.', life: 2500 });
            await this.router.navigate(['/companies', company.id, 'edit']);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la empresa. Revisa duplicados, permisos y RLS.', life: 4000 });
        } finally {
            this.saving.set(false);
        }
    }
}
