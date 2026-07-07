import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { CertificateFormOptions, CertificateItem, CertificatesService, SaveCertificateItemPayload } from './certificates.service';

type ItemDialogMode = 'create' | 'edit';

@Component({
    selector: 'app-certificate-items-manager',
    standalone: true,
    imports: [ButtonModule, CommonModule, ConfirmDialogModule, DialogModule, InputNumberModule, InputTextModule, ReactiveFormsModule, SelectModule, TableModule, ToastModule],
    providers: [ConfirmationService, MessageService],
    template: `
        <p-toast />
        <p-confirmdialog [style]="{ width: '450px' }" />

        <div class="card flex flex-col gap-4">
            <div class="flex items-center justify-between gap-3">
                <div>
                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0">Items del certificado</h2>
                    <p class="text-muted-color text-sm">Residuos, unidades, codigo Basilea, cantidades y pesos asociados.</p>
                </div>
                @if (!isReadonly) {
                    <p-button label="Agregar Item" icon="pi pi-plus" size="small" (onClick)="openCreate()" />
                }
            </div>

            <p-table [value]="items()" [loading]="loading()" responsiveLayout="scroll" [tableStyle]="{ 'min-width': '86rem' }">
                <ng-template #header>
                    <tr>
                        <th style="min-width: 20rem">Item</th>
                        <th style="min-width: 10rem">Unidad</th>
                        <th style="min-width: 10rem">Cod. Basilea</th>
                        <th style="min-width: 12rem">Tipo cantidad</th>
                        <th style="min-width: 10rem">Cantidad</th>
                        <th style="min-width: 10rem">Peso</th>
                        <th style="min-width: 18rem">Descripcion</th>
                        <th style="width: 8rem"></th>
                    </tr>
                </ng-template>
                <ng-template #body let-row>
                    <tr>
                        <td>
                            <div class="flex flex-col gap-1">
                                <span class="font-medium">{{ row.item?.code }} - {{ row.item?.name }}</span>
                                <small class="text-muted-color">{{ row.item?.category_name }} - {{ row.item?.item_type_name }}</small>
                            </div>
                        </td>
                        <td>{{ row.item?.unit_name || '-' }}</td>
                        <td>{{ row.item?.basel_code || '-' }}</td>
                        <td>{{ row.quantity_type?.name || 'Sin tipo' }}</td>
                        <td>{{ row.quantity ?? '-' }}</td>
                        <td>{{ row.weight ?? '-' }}</td>
                        <td>{{ row.description || 'Sin descripcion' }}</td>
                        <td>
                            @if (!isReadonly) {
                                <div class="flex justify-end gap-2">
                                    <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (onClick)="openEdit(row)" />
                                    <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (onClick)="confirmDelete(row)" />
                                </div>
                            }
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="8">No hay items registrados.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-dialog [visible]="dialogVisible()" (visibleChange)="dialogVisible.set($event)" [style]="{ width: '720px' }" [header]="dialogMode() === 'create' ? 'Nuevo item' : 'Editar item'" [modal]="true">
            <form [formGroup]="form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex flex-col gap-2 md:col-span-2">
                    <label for="certificateItem" class="font-medium">Item <span class="text-red-500">*</span></label>
                    <p-select inputId="certificateItem" formControlName="item_id" [options]="options.items" optionLabel="name" optionValue="id" class="w-full" [filter]="true" filterBy="code,name">
                        <ng-template #item let-item>
                            <div class="flex flex-col">
                                <span>{{ item.code }} - {{ item.name }}</span>
                                <small class="text-muted-color">{{ item.unit_name }} - {{ item.category_name }} - {{ item.basel_code || 'Sin Basilea' }}</small>
                            </div>
                        </ng-template>
                    </p-select>
                    @if (form.controls.item_id.touched && form.controls.item_id.invalid) {
                        <small class="text-red-500">El item es obligatorio.</small>
                    }
                </div>

                <div class="flex flex-col gap-2">
                    <label class="font-medium">Unidad</label>
                    <input pInputText [value]="selectedItemOption()?.unit_name || ''" placeholder="Segun item seleccionado" disabled />
                </div>

                <div class="flex flex-col gap-2">
                    <label class="font-medium">Cod. Basilea</label>
                    <input pInputText [value]="selectedItemOption()?.basel_code || ''" placeholder="Segun item seleccionado" disabled />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="quantityType" class="font-medium">Tipo de cantidad</label>
                    <p-select inputId="quantityType" formControlName="quantity_type_id" [options]="options.quantityTypes" optionLabel="name" optionValue="id" placeholder="Sin tipo" class="w-full" [showClear]="true" />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="quantity" class="font-medium">Cantidad</label>
                    <p-inputnumber inputId="quantity" formControlName="quantity" [min]="0" mode="decimal" [minFractionDigits]="0" [maxFractionDigits]="4" />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="weight" class="font-medium">Peso <span class="text-red-500">*</span></label>
                    <p-inputnumber inputId="weight" formControlName="weight" [min]="0" mode="decimal" [minFractionDigits]="0" [maxFractionDigits]="4" />
                    @if (form.controls.weight.touched && form.controls.weight.invalid) {
                        <small class="text-red-500">El peso es obligatorio.</small>
                    }
                </div>

                <div class="flex flex-col gap-2">
                    <label for="sortOrder" class="font-medium">Orden</label>
                    <p-inputnumber inputId="sortOrder" formControlName="sort_order" [min]="1" [showButtons]="true" />
                </div>

                <div class="flex flex-col gap-2 md:col-span-2">
                    <label for="itemDescription" class="font-medium">Descripcion</label>
                    <input pInputText id="itemDescription" formControlName="description" />
                </div>
            </form>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (onClick)="dialogVisible.set(false)" />
                <p-button label="Guardar" icon="pi pi-save" (onClick)="save()" [loading]="saving()" [disabled]="form.invalid || saving()" />
            </ng-template>
        </p-dialog>
    `
})
export class CertificateItemsManager implements OnChanges {
    private readonly fb = inject(FormBuilder);
    private readonly certificatesService = inject(CertificatesService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);

    @Input({ required: true }) certificateId = '';
    @Input() options: CertificateFormOptions = { companies: [], generationTypes: [], templateVersions: [], companyAddresses: [], items: [], quantityTypes: [], documentTypes: [] };
    @Input({ alias: 'readonly' }) isReadonly = false;

    readonly items = signal<CertificateItem[]>([]);
    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly dialogVisible = signal(false);
    readonly dialogMode = signal<ItemDialogMode>('create');
    readonly selectedItem = signal<CertificateItem | null>(null);

    readonly form = this.fb.group({
        item_id: ['', Validators.required],
        quantity_type_id: [null as string | null],
        quantity: [null as number | null, Validators.min(0)],
        weight: [null as number | null, [Validators.required, Validators.min(0)]],
        description: [''],
        sort_order: [1, [Validators.required, Validators.min(1)]]
    });

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes['certificateId'] && this.certificateId) {
            await this.reload();
        }
    }

    async reload(): Promise<void> {
        this.loading.set(true);

        try {
            this.items.set(await this.certificatesService.listItems(this.certificateId));
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los items.', life: 3500 });
        } finally {
            this.loading.set(false);
        }
    }

    openCreate(): void {
        this.dialogMode.set('create');
        this.selectedItem.set(null);
        this.form.reset({ item_id: '', quantity_type_id: null, quantity: null, weight: null, description: '', sort_order: this.items().length + 1 });
        this.dialogVisible.set(true);
    }

    openEdit(item: CertificateItem): void {
        this.dialogMode.set('edit');
        this.selectedItem.set(item);
        this.form.reset({
            item_id: item.item_id,
            quantity_type_id: item.quantity_type_id,
            quantity: item.quantity,
            weight: item.weight,
            description: item.description ?? '',
            sort_order: item.sort_order
        });
        this.dialogVisible.set(true);
    }

    selectedItemOption(): CertificateFormOptions['items'][number] | null {
        const itemId = this.form.controls.item_id.value;
        return this.options.items.find((item) => item.id === itemId) ?? null;
    }

    async save(): Promise<void> {
        this.form.markAllAsTouched();

        if (this.form.invalid) {
            return;
        }

        const value = this.form.getRawValue();
        if (!value.item_id || !value.sort_order) {
            return;
        }

        const payload: SaveCertificateItemPayload = {
            item_id: value.item_id,
            quantity_type_id: value.quantity_type_id || null,
            quantity: value.quantity,
            weight: value.weight,
            price: null,
            description: value.description || null,
            sort_order: value.sort_order
        };

        this.saving.set(true);

        try {
            const selectedItem = this.selectedItem();
            if (selectedItem) {
                await this.certificatesService.updateItem(selectedItem.id, payload);
            } else {
                await this.certificatesService.createItem(this.certificateId, payload);
            }

            this.dialogVisible.set(false);
            this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Item guardado correctamente.', life: 2500 });
            await this.reload();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el item.', life: 3500 });
        } finally {
            this.saving.set(false);
        }
    }

    confirmDelete(item: CertificateItem): void {
        this.confirmationService.confirm({
            message: `Deseas eliminar el item ${item.item?.code || ''}?`,
            header: 'Eliminar item',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                void this.delete(item);
            }
        });
    }

    async delete(item: CertificateItem): Promise<void> {
        try {
            await this.certificatesService.deleteItem(item.id);
            this.messageService.add({ severity: 'success', summary: 'Item eliminado', detail: 'El item fue eliminado correctamente.', life: 2500 });
            await this.reload();
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el item.', life: 3500 });
        }
    }
}
