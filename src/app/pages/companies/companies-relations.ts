import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { BranchType, CompaniesService, CompanyBranch, CompanyContact, CompanyStatus, SaveCompanyBranchPayload, SaveCompanyContactPayload } from './companies.service';

type RelationDialogMode = 'create' | 'edit';

@Component({
    selector: 'app-companies-relations',
    standalone: true,
    imports: [ButtonModule, CommonModule, ConfirmDialogModule, DialogModule, InputTextModule, ReactiveFormsModule, SelectModule, TableModule, TagModule, ToastModule],
    providers: [ConfirmationService, MessageService],
    template: `
        <p-toast />
        <p-confirmdialog [style]="{ width: '450px' }" />

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div class="card flex flex-col gap-4">
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0">Sedes y direcciones</h2>
                        <p class="text-muted-color text-sm">Depositos, oficinas y direcciones asociadas.</p>
                    </div>
                    @if (!readOnly) {
                        <p-button label="Nueva sede" icon="pi pi-plus" size="small" (onClick)="openBranchCreate()" />
                    }
                </div>

                <p-table [value]="branches()" [loading]="loading()" responsiveLayout="scroll" [tableStyle]="{ 'min-width': '44rem' }">
                    <ng-template #header>
                        <tr>
                            <th>Tipo</th>
                            <th>Nombre</th>
                            <th>Direccion</th>
                            <th>Estado</th>
                            <th style="width: 9rem"></th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-branch>
                        <tr>
                            <td>{{ branchTypeLabel(branch.branch_type) }}</td>
                            <td>{{ branch.name || 'Sin nombre' }}</td>
                            <td>{{ branch.address }}</td>
                            <td><p-tag [value]="statusLabel(branch.status)" [severity]="branch.status === 'active' ? 'success' : 'danger'" /></td>
                            <td>
                                @if (!readOnly) {
                                    <div class="flex justify-end gap-2">
                                        <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (onClick)="openBranchEdit(branch)" />
                                        <p-button [icon]="branch.status === 'active' ? 'pi pi-ban' : 'pi pi-check'" [rounded]="true" [outlined]="true" [severity]="branch.status === 'active' ? 'danger' : 'success'" (onClick)="toggleBranchStatus(branch)" />
                                        <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (onClick)="confirmDeleteBranch(branch)" />
                                    </div>
                                }
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="5">No hay sedes registradas.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>

            <div class="card flex flex-col gap-4">
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0">Contactos</h2>
                        <p class="text-muted-color text-sm">Personas de contacto asociadas a la empresa.</p>
                    </div>
                    @if (!readOnly) {
                        <p-button label="Nuevo contacto" icon="pi pi-plus" size="small" (onClick)="openContactCreate()" />
                    }
                </div>

                <p-table [value]="contacts()" [loading]="loading()" responsiveLayout="scroll" [tableStyle]="{ 'min-width': '48rem' }">
                    <ng-template #header>
                        <tr>
                            <th>Nombre</th>
                            <th>Cargo</th>
                            <th>Email</th>
                            <th>Telefono</th>
                            <th>Estado</th>
                            <th style="width: 9rem"></th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-contact>
                        <tr>
                            <td>{{ contact.full_name }}</td>
                            <td>{{ contact.position || 'Sin cargo' }}</td>
                            <td>{{ contact.email || 'Sin email' }}</td>
                            <td>{{ contact.phone || 'Sin telefono' }}</td>
                            <td><p-tag [value]="statusLabel(contact.status)" [severity]="contact.status === 'active' ? 'success' : 'danger'" /></td>
                            <td>
                                @if (!readOnly) {
                                    <div class="flex justify-end gap-2">
                                        <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (onClick)="openContactEdit(contact)" />
                                        <p-button [icon]="contact.status === 'active' ? 'pi pi-ban' : 'pi pi-check'" [rounded]="true" [outlined]="true" [severity]="contact.status === 'active' ? 'danger' : 'success'" (onClick)="toggleContactStatus(contact)" />
                                        <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (onClick)="confirmDeleteContact(contact)" />
                                    </div>
                                }
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="6">No hay contactos registrados.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </div>

        <p-dialog [visible]="branchDialogVisible()" (visibleChange)="branchDialogVisible.set($event)" [style]="{ width: '560px' }" [header]="branchDialogMode() === 'create' ? 'Nueva sede' : 'Editar sede'" [modal]="true">
            <form [formGroup]="branchForm" class="grid grid-cols-1 gap-4">
                <div class="flex flex-col gap-2">
                    <label for="branchType" class="font-medium">Tipo</label>
                    <p-select inputId="branchType" formControlName="branch_type" [options]="branchTypeOptions" optionLabel="label" optionValue="value" class="w-full" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="branchName" class="font-medium">Nombre</label>
                    <input pInputText id="branchName" formControlName="name" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="branchAddress" class="font-medium">Direccion</label>
                    <input pInputText id="branchAddress" formControlName="address" />
                    @if (branchForm.controls.address.touched && branchForm.controls.address.invalid) {
                        <small class="text-red-500">La direccion es obligatoria.</small>
                    }
                </div>
                <div class="flex flex-col gap-2">
                    <label for="branchStatus" class="font-medium">Estado</label>
                    <p-select inputId="branchStatus" formControlName="status" [options]="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
                </div>
            </form>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (onClick)="branchDialogVisible.set(false)" />
                <p-button label="Guardar" icon="pi pi-save" (onClick)="saveBranch()" [loading]="saving()" [disabled]="branchForm.invalid || saving()" />
            </ng-template>
        </p-dialog>

        <p-dialog [visible]="contactDialogVisible()" (visibleChange)="contactDialogVisible.set($event)" [style]="{ width: '560px' }" [header]="contactDialogMode() === 'create' ? 'Nuevo contacto' : 'Editar contacto'" [modal]="true">
            <form [formGroup]="contactForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex flex-col gap-2 md:col-span-2">
                    <label for="contactName" class="font-medium">Nombre completo</label>
                    <input pInputText id="contactName" formControlName="full_name" />
                    @if (contactForm.controls.full_name.touched && contactForm.controls.full_name.invalid) {
                        <small class="text-red-500">El nombre es obligatorio.</small>
                    }
                </div>
                <div class="flex flex-col gap-2">
                    <label for="position" class="font-medium">Cargo</label>
                    <input pInputText id="position" formControlName="position" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="phone" class="font-medium">Telefono</label>
                    <input pInputText id="phone" formControlName="phone" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="email" class="font-medium">Email</label>
                    <input pInputText id="email" formControlName="email" />
                    @if (contactForm.controls.email.touched && contactForm.controls.email.invalid) {
                        <small class="text-red-500">Ingresa un email valido.</small>
                    }
                </div>
                <div class="flex flex-col gap-2">
                    <label for="contactStatus" class="font-medium">Estado</label>
                    <p-select inputId="contactStatus" formControlName="status" [options]="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
                </div>
            </form>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (onClick)="contactDialogVisible.set(false)" />
                <p-button label="Guardar" icon="pi pi-save" (onClick)="saveContact()" [loading]="saving()" [disabled]="contactForm.invalid || saving()" />
            </ng-template>
        </p-dialog>
    `
})
export class CompaniesRelations implements OnChanges {
    private readonly fb = inject(FormBuilder);
    private readonly companiesService = inject(CompaniesService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);

    @Input({ required: true }) companyId = '';
    @Input() readOnly = false;

    readonly branches = signal<CompanyBranch[]>([]);
    readonly contacts = signal<CompanyContact[]>([]);
    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly branchDialogVisible = signal(false);
    readonly contactDialogVisible = signal(false);
    readonly branchDialogMode = signal<RelationDialogMode>('create');
    readonly contactDialogMode = signal<RelationDialogMode>('create');
    readonly selectedBranch = signal<CompanyBranch | null>(null);
    readonly selectedContact = signal<CompanyContact | null>(null);

    readonly statusOptions: { label: string; value: CompanyStatus }[] = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' }
    ];

    readonly branchTypeOptions: { label: string; value: BranchType }[] = [
        { label: 'Deposito', value: 'deposit' },
        { label: 'Direccion fiscal', value: 'fiscal_address' },
        { label: 'Oficina', value: 'office' },
        { label: 'Sucursal', value: 'branch' }
    ];

    readonly branchForm = this.fb.group({
        branch_type: ['branch' as BranchType, Validators.required],
        name: [''],
        address: ['', Validators.required],
        status: ['active' as CompanyStatus, Validators.required]
    });

    readonly contactForm = this.fb.group({
        full_name: ['', Validators.required],
        position: [''],
        email: ['', Validators.email],
        phone: [''],
        status: ['active' as CompanyStatus, Validators.required]
    });

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes['companyId'] && this.companyId) {
            await this.reload();
        }
    }

    async reload(): Promise<void> {
        this.loading.set(true);

        try {
            const [branches, contacts] = await Promise.all([this.companiesService.listBranches(this.companyId), this.companiesService.listContacts(this.companyId)]);

            this.branches.set(branches);
            this.contacts.set(contacts);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar sedes o contactos.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }

    openBranchCreate(): void {
        this.branchDialogMode.set('create');
        this.selectedBranch.set(null);
        this.branchForm.reset({ branch_type: 'branch', name: '', address: '', status: 'active' });
        this.branchDialogVisible.set(true);
    }

    openBranchEdit(branch: CompanyBranch): void {
        this.branchDialogMode.set('edit');
        this.selectedBranch.set(branch);
        this.branchForm.reset({ branch_type: branch.branch_type, name: branch.name ?? '', address: branch.address, status: branch.status });
        this.branchDialogVisible.set(true);
    }

    async saveBranch(): Promise<void> {
        this.branchForm.markAllAsTouched();

        if (this.branchForm.invalid) {
            return;
        }

        const value = this.branchForm.getRawValue();

        if (!value.branch_type || !value.address || !value.status) {
            return;
        }

        const payload: SaveCompanyBranchPayload = {
            branch_type: value.branch_type,
            name: value.name || null,
            address: value.address,
            status: value.status
        };

        this.saving.set(true);

        try {
            const branch = this.selectedBranch();

            if (branch) {
                await this.companiesService.updateBranch(branch.id, payload);
            } else {
                await this.companiesService.createBranch(this.companyId, payload);
            }

            this.branchDialogVisible.set(false);
            this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Sede guardada correctamente.', life: 2500 });
            await this.reload();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la sede. Revisa permisos y RLS.', life: 4000 });
        } finally {
            this.saving.set(false);
        }
    }

    toggleBranchStatus(branch: CompanyBranch): void {
        const nextStatus: CompanyStatus = branch.status === 'active' ? 'inactive' : 'active';

        void this.updateBranchStatus(branch, nextStatus);
    }

    async updateBranchStatus(branch: CompanyBranch, status: CompanyStatus): Promise<void> {
        try {
            await this.companiesService.updateBranchStatus(branch.id, status);
            this.messageService.add({ severity: 'success', summary: 'Estado actualizado', detail: `${branch.name || branch.address} ahora esta ${this.statusLabel(status).toLowerCase()}.`, life: 2500 });
            await this.reload();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la sede.', life: 3500 });
        }
    }

    confirmDeleteBranch(branch: CompanyBranch): void {
        this.confirmationService.confirm({
            message: `Deseas eliminar la sede ${branch.name || branch.address}?`,
            header: 'Eliminar sede',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                void this.deleteBranch(branch);
            }
        });
    }

    async deleteBranch(branch: CompanyBranch): Promise<void> {
        try {
            await this.companiesService.deleteBranch(branch.id);
            this.messageService.add({ severity: 'success', summary: 'Sede eliminada', detail: 'La sede fue eliminada correctamente.', life: 2500 });
            await this.reload();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la sede.', life: 3500 });
        }
    }

    openContactCreate(): void {
        this.contactDialogMode.set('create');
        this.selectedContact.set(null);
        this.contactForm.reset({ full_name: '', position: '', email: '', phone: '', status: 'active' });
        this.contactDialogVisible.set(true);
    }

    openContactEdit(contact: CompanyContact): void {
        this.contactDialogMode.set('edit');
        this.selectedContact.set(contact);
        this.contactForm.reset({ full_name: contact.full_name, position: contact.position ?? '', email: contact.email ?? '', phone: contact.phone ?? '', status: contact.status });
        this.contactDialogVisible.set(true);
    }

    async saveContact(): Promise<void> {
        this.contactForm.markAllAsTouched();

        if (this.contactForm.invalid) {
            return;
        }

        const value = this.contactForm.getRawValue();

        if (!value.full_name || !value.status) {
            return;
        }

        const payload: SaveCompanyContactPayload = {
            full_name: value.full_name,
            position: value.position || null,
            email: value.email || null,
            phone: value.phone || null,
            status: value.status
        };

        this.saving.set(true);

        try {
            const contact = this.selectedContact();

            if (contact) {
                await this.companiesService.updateContact(contact.id, payload);
            } else {
                await this.companiesService.createContact(this.companyId, payload);
            }

            this.contactDialogVisible.set(false);
            this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Contacto guardado correctamente.', life: 2500 });
            await this.reload();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el contacto. Revisa permisos y RLS.', life: 4000 });
        } finally {
            this.saving.set(false);
        }
    }

    toggleContactStatus(contact: CompanyContact): void {
        const nextStatus: CompanyStatus = contact.status === 'active' ? 'inactive' : 'active';

        void this.updateContactStatus(contact, nextStatus);
    }

    async updateContactStatus(contact: CompanyContact, status: CompanyStatus): Promise<void> {
        try {
            await this.companiesService.updateContactStatus(contact.id, status);
            this.messageService.add({ severity: 'success', summary: 'Estado actualizado', detail: `${contact.full_name} ahora esta ${this.statusLabel(status).toLowerCase()}.`, life: 2500 });
            await this.reload();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el contacto.', life: 3500 });
        }
    }

    confirmDeleteContact(contact: CompanyContact): void {
        this.confirmationService.confirm({
            message: `Deseas eliminar el contacto ${contact.full_name}?`,
            header: 'Eliminar contacto',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                void this.deleteContact(contact);
            }
        });
    }

    async deleteContact(contact: CompanyContact): Promise<void> {
        try {
            await this.companiesService.deleteContact(contact.id);
            this.messageService.add({ severity: 'success', summary: 'Contacto eliminado', detail: 'El contacto fue eliminado correctamente.', life: 2500 });
            await this.reload();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el contacto.', life: 3500 });
        }
    }

    branchTypeLabel(type: BranchType): string {
        const labels: Record<BranchType, string> = {
            deposit: 'Deposito',
            fiscal_address: 'Direccion fiscal',
            office: 'Oficina',
            branch: 'Sucursal'
        };

        return labels[type];
    }

    statusLabel(status: CompanyStatus): string {
        return status === 'active' ? 'Activo' : 'Inactivo';
    }
}
