import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '@/app/core/auth/auth.service';
import { IBC_EVENTS, IbcDocument, IbcEvent, IbcEventKind, IbcServiceCycle, IbcTestResult, availableIbcActions, ibcErrorMessage, ibcState } from './ibc.models';
import { IbcLookupComponent } from './ibc-lookup';
import { IbcService } from './ibc.service';

@Component({
    selector: 'app-ibc-service-detail',
    imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonModule, ConfirmDialogModule, DatePickerModule, DialogModule, InputTextModule, SelectModule, TagModule, TextareaModule, TimelineModule, ToastModule, IbcLookupComponent],
    providers: [ConfirmationService, MessageService],
    template: `
        <p-toast /><p-confirmdialog [style]="{width:'28rem',maxWidth:'95vw'}" />
        <div class="flex flex-col gap-6">
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div><span class="text-sm font-medium text-primary">Control IBC / Servicio</span><h1 class="text-3xl font-semibold mt-2">{{ cycle()?.container_code || 'Servicio IBC' }}</h1></div>
                <div class="flex gap-3"><p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/ibc/services" /><p-button label="Actualizar" icon="pi pi-refresh" severity="secondary" [outlined]="true" [loading]="loading()" (onClick)="reload()" /></div>
            </div>
            @if (cycle(); as c) {
                @if (c.is_demo) { <div class="rounded-lg border border-primary p-4 text-primary">Datos de demostración. Los eventos del ejemplo son simulados.</div> }
                <div class="card">
                    <div class="flex flex-wrap justify-between gap-3 mb-6"><p-tag [value]="state(c.status).label" [severity]="state(c.status).severity" />
                        @if (c.status !== 'delivered' && auth.hasPermission('ibc.update')) { <p-button label="Editar datos del ingreso" icon="pi pi-pencil" severity="secondary" [text]="true" (onClick)="openEdit()" /> }
                    </div>
                    <dl class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        <div><dt class="text-muted-color">Envase</dt><dd class="font-medium mt-1"><a [routerLink]="['/ibc/containers',c.container_id]" class="text-primary">{{ c.container_code }} · N.° {{ c.original_number }}</a></dd></div>
                        <div><dt class="text-muted-color">Empresa solicitante</dt><dd class="font-medium mt-1">{{ c.company_name }}</dd></div>
                        <div><dt class="text-muted-color">Químico al ingreso</dt><dd class="font-medium mt-1">{{ c.chemical_name }}</dd></div>
                        <div><dt class="text-muted-color">Ingreso</dt><dd class="font-medium mt-1">{{ c.received_at | date:'dd/MM/yyyy HH:mm' }}</dd></div>
                        <div><dt class="text-muted-color">GRE ingreso</dt><dd class="font-medium mt-1">{{ c.gre_entry || '—' }}</dd></div>
                        <div><dt class="text-muted-color">Orden de compra</dt><dd class="font-medium mt-1">{{ c.purchase_order || '—' }}</dd></div>
                        <div>
                            <dt class="text-muted-color">Lavados registrados</dt>
                            <dd class="font-medium mt-1">{{ c.wash_count }}</dd>
                            @if (lastWash(); as wash) {
                                <dd class="text-sm text-muted-color">Último lavado {{ wash.happened_at | date:'dd/MM/yyyy HH:mm' }}</dd>
                            }
                        </div>
                        <div>
                            <dt class="text-muted-color">Última prueba de hermeticidad</dt>
                            <dd class="font-medium mt-1">{{ c.latest_test_result === 'approved' ? 'Aprobada' : c.latest_test_result === 'leak' ? 'Con fuga' : 'Sin prueba registrada' }}</dd>
                            @if (lastTest(); as test) {
                                <dd class="text-sm text-muted-color">{{ test.happened_at | date:'dd/MM/yyyy HH:mm' }}</dd>
                            }
                            @if (hasWorkAfterTest()) {
                                <dd class="text-sm text-muted-color mt-1">Esta prueba es anterior al último lavado o reparación. El servicio requiere una nueva prueba para continuar hacia la entrega.</dd>
                            }
                        </div>
                        <div><dt class="text-muted-color">Entrega / GRE salida</dt><dd class="font-medium mt-1">{{ (c.delivered_at | date:'dd/MM/yyyy HH:mm') || 'Pendiente' }} · {{ c.gre_exit || '—' }}</dd></div>
                        @if (c.legacy_rotation !== null) { <div><dt class="text-muted-color">Rotación en hoja de origen</dt><dd class="font-medium mt-1">{{ c.legacy_rotation }} <span class="text-sm text-muted-color">(sin sumar a lavados registrados)</span></dd></div> }
                    </dl>
                    @if (c.notes) { <p class="whitespace-pre-wrap mt-5">{{ c.notes }}</p> }
                    @if (c.source_reference) { <p class="text-sm text-muted-color mt-4">Origen: {{ c.source_reference }}</p> }
                    @if (c.requires_release) { <p class="mt-5 text-red-500 font-medium" role="status">Retención activa. Requiere una nueva prueba aprobada y liberación antes de entregar.</p> }
                </div>
                @if (!historyError() && actions().length) {
                    <div class="card"><h2 class="text-xl font-semibold mb-2">Acciones disponibles</h2>
                        <p class="text-sm text-muted-color mb-4">Las acciones cambian según el avance del servicio. Los lavados y las pruebas registrados aparecen en el historial.</p>
                        <div class="flex flex-wrap gap-3">
                        @for (action of actions(); track action) { <p-button [label]="actionLabels[action]" [icon]="action === 'deliver' ? 'pi pi-truck' : 'pi pi-plus'" [severity]="action === 'deliver' || action === 'release' ? 'success' : 'secondary'" [outlined]="action !== 'deliver' && action !== 'release'" [disabled]="loading()" (onClick)="openAction(action)" /> }
                    </div></div>
                } @else if (historyError()) {
                    <div class="card" role="alert">No se pueden determinar las acciones hasta que cargue el historial. Pulsa Actualizar para volver a intentar.</div>
                } @else if (!loading()) {
                    <div class="card">{{ c.status === 'delivered' ? 'El servicio ya fue entregado.' : 'Tu cuenta no tiene acciones disponibles para este servicio.' }}</div>
                }
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div class="card"><h2 class="text-xl font-semibold mb-6">Historial del servicio</h2>
                        @if (historyError()) {
                            <p class="text-muted-color" role="status">No se pudo actualizar el historial. Pulsa Actualizar para volver a intentar.</p>
                        } @else if (loading() && !events().length) {
                            <p class="text-muted-color" role="status">Cargando historial…</p>
                        } @else if (!events().length) {
                            <p class="text-muted-color">Este servicio todavía no tiene eventos visibles.</p>
                        }
                        <p-timeline [value]="events()" align="left">
                            <ng-template #opposite let-event><small class="text-muted-color">{{ event.happened_at | date:'dd/MM/yyyy HH:mm' }}</small></ng-template>
                            <ng-template #content let-event><div class="pb-6"><h3 class="font-semibold">{{ labels[event.kind] }}</h3>
                                @if (event.result) { <p-tag [value]="event.result === 'approved' ? 'Aprobada' : 'Con fuga'" [severity]="event.result === 'approved' ? 'success' : 'danger'" class="mt-2" /> }
                                <p class="text-sm text-muted-color mt-1">{{ event.actor_name || 'Usuario no disponible' }} · {{ state(event.resulting_status).label }}</p>
                                @if (event.notes) { <p class="whitespace-pre-wrap mt-2">{{ event.notes }}</p> }
                                <p class="text-xs text-muted-color mt-2">Registrado: {{ event.created_at | date:'dd/MM/yyyy HH:mm' }}</p>
                            </div></ng-template>
                        </p-timeline>
                    </div>
                    <div class="card"><h2 class="text-xl font-semibold mb-4">Documentos y evidencias</h2>
                        @if (auth.hasPermission('ibc.documents') && c.status !== 'delivered') {
                            <form [formGroup]="documentForm" class="flex flex-col gap-3 mb-6" (ngSubmit)="upload()">
                                <label for="ibc-document-kind">Tipo de documento</label><p-select inputId="ibc-document-kind" formControlName="kind" [options]="documentKinds" optionLabel="label" optionValue="value" appendTo="body" />
                                <label for="ibc-document-file">Archivo PDF o imagen (máximo 20 MB)</label><input id="ibc-document-file" type="file" accept="application/pdf,image/png,image/jpeg,image/webp" (change)="selectFile($event)" class="border border-surface-200 dark:border-surface-700 rounded-lg p-3" />
                                <p-button label="Adjuntar archivo" icon="pi pi-paperclip" type="submit" [loading]="uploading()" [disabled]="!selectedFile" />
                            </form>
                        }
                        <ul class="list-none p-0 m-0 divide-y divide-surface-200 dark:divide-surface-700">
                            @for (document of documents(); track document.id) { <li class="flex items-center justify-between gap-3 py-4"><div class="min-w-0"><p class="font-medium break-all">{{ document.file_name }}</p><span class="text-sm text-muted-color">{{ documentLabel(document.document_kind) }} · {{ document.created_at | date:'dd/MM/yyyy' }}</span></div><p-button icon="pi pi-download" ariaLabel="Descargar documento" [text]="true" (onClick)="download(document)" /></li> }
                            @empty {
                                @if (!loading() && !documentsError()) { <li class="text-muted-color py-4">Sin documentos adjuntos.</li> }
                            }
                        </ul>
                        @if (documentsError()) {
                            <p class="text-muted-color" role="status">No se pudieron actualizar los documentos adjuntos.</p>
                        }
                    </div>
                </div>
            } @else if (!loading()) { <div class="card">No se pudo abrir el servicio. Revisa el enlace y tus permisos.</div> }
        </div>
        <p-dialog [(visible)]="actionVisible" [header]="labels[selectedAction]" [modal]="true" [style]="{width:'40rem',maxWidth:'95vw'}">
            <form [formGroup]="eventForm" (ngSubmit)="confirmAction()" class="flex flex-col gap-5 pt-2">
                <div class="flex flex-col gap-2"><label for="ibc-event-date">Fecha y hora</label><p-datepicker inputId="ibc-event-date" formControlName="happenedAt" [showTime]="true" hourFormat="24" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body" /></div>
                @if (selectedAction === 'test') { <div class="flex flex-col gap-2"><label for="ibc-result">Resultado de hermeticidad</label><p-select inputId="ibc-result" formControlName="result" [options]="testResults" optionLabel="label" optionValue="value" appendTo="body" placeholder="Selecciona el resultado" /></div> }
                @if (selectedAction === 'deliver') {
                    <div class="flex flex-col gap-2"><label for="ibc-recipient">Empresa receptora</label><app-ibc-lookup kind="companies" inputId="ibc-recipient" formControlName="recipientCompanyId" [initialLabel]="cycle()?.company_name || ''" /></div>
                    <div class="flex flex-col gap-2"><label for="ibc-gre-exit">GRE de salida</label><input pInputText id="ibc-gre-exit" formControlName="greExit" maxlength="120" /></div>
                }
                <div class="flex flex-col gap-2"><label for="ibc-event-notes">{{ selectedAction === 'repair' ? 'Descripción de la reparación' : selectedAction === 'note' ? 'Observación o corrección' : 'Observaciones' }}</label><textarea pTextarea id="ibc-event-notes" formControlName="notes" rows="4"></textarea></div>
                @if (eventInvalid) { <p class="text-red-500" role="alert">Completa la fecha y los datos requeridos para esta acción.</p> }
                <div class="flex justify-end gap-3"><p-button label="Cancelar" severity="secondary" [outlined]="true" (onClick)="actionVisible=false" /><p-button type="submit" label="Registrar" icon="pi pi-check" [loading]="saving()" /></div>
            </form>
        </p-dialog>
        <p-dialog [(visible)]="editVisible" header="Editar datos del ingreso" [modal]="true" [style]="{width:'40rem',maxWidth:'95vw'}">
            <form [formGroup]="editForm" (ngSubmit)="saveEdit()" class="flex flex-col gap-5 pt-2">
                <div class="flex flex-col gap-2"><label for="ibc-edit-company">Empresa solicitante</label><app-ibc-lookup kind="companies" inputId="ibc-edit-company" formControlName="company_id" [initialLabel]="cycle()?.company_name || ''" /></div>
                <div class="flex flex-col gap-2"><label for="ibc-edit-chemical">Químico al ingreso</label><app-ibc-lookup kind="chemicals" inputId="ibc-edit-chemical" formControlName="chemical_id" [initialLabel]="cycle()?.chemical_name || ''" /></div>
                <div class="flex flex-col gap-2"><label for="ibc-edit-gre">GRE ingreso</label><input pInputText id="ibc-edit-gre" formControlName="gre_entry" /></div>
                <div class="flex flex-col gap-2"><label for="ibc-edit-po">Orden de compra</label><input pInputText id="ibc-edit-po" formControlName="purchase_order" /></div>
                <div class="flex flex-col gap-2"><label for="ibc-edit-notes">Observaciones</label><textarea pTextarea id="ibc-edit-notes" formControlName="notes" rows="3"></textarea></div>
                @if (editForm.invalid && editForm.touched) { <p class="text-red-500" role="alert">Selecciona la empresa y el químico.</p> }
                <div class="flex justify-end gap-3"><p-button label="Cancelar" severity="secondary" [outlined]="true" (onClick)="editVisible=false" /><p-button type="submit" label="Guardar" [loading]="saving()" /></div>
            </form>
        </p-dialog>
    `
})
export class IbcServiceDetailComponent {
    readonly auth = inject(AuthService);
    private readonly service = inject(IbcService);
    private readonly route = inject(ActivatedRoute);
    private readonly messages = inject(MessageService);
    private readonly confirmation = inject(ConfirmationService);
    private readonly fb = inject(FormBuilder);
    readonly cycle = signal<IbcServiceCycle | null>(null);
    readonly events = signal<IbcEvent[]>([]);
    readonly documents = signal<IbcDocument[]>([]);
    readonly loading = signal(false);
    readonly historyError = signal(false);
    readonly documentsError = signal(false);
    readonly saving = signal(false);
    readonly uploading = signal(false);
    readonly labels: Record<string, string> = IBC_EVENTS;
    readonly actionLabels = {
        wash: 'Registrar lavado',
        test: 'Registrar prueba de hermeticidad',
        repair: 'Registrar reparación',
        release: 'Liberar envase',
        deliver: 'Registrar entrega',
        note: 'Agregar observación'
    };
    readonly state = ibcState;
    readonly lastWash = computed(() => this.events().find((event) => event.kind === 'wash'));
    readonly lastTest = computed(() => this.events().find((event) => event.kind === 'test'));
    readonly hasWorkAfterTest = computed(() => {
        const lastTest = this.lastTest();

        return !!lastTest && this.events().some((event) => (event.kind === 'wash' || event.kind === 'repair') && event.sequence > lastTest.sequence);
    });
    readonly actions = computed(() => {
        const cycle = this.cycle();

        return cycle ? availableIbcActions(cycle, this.events()).filter((action) => this.auth.hasPermission(`ibc.${action === 'note' ? 'update' : action}`)) : [];
    });
    readonly testResults = [{ label: 'Aprobado · sin fuga', value: 'approved' }, { label: 'Con fuga', value: 'leak' }];
    readonly documentKinds = [{ label: 'GRE ingreso', value: 'gre_entry' }, { label: 'GRE salida', value: 'gre_exit' }, { label: 'Orden de compra', value: 'purchase_order' }, { label: 'Evidencia', value: 'evidence' }];
    readonly eventForm = this.fb.nonNullable.group({ happenedAt: [new Date(), Validators.required], result: this.fb.control<IbcTestResult | null>(null), notes: '', recipientCompanyId: '', greExit: '' });
    readonly editForm = this.fb.nonNullable.group({ company_id: ['', Validators.required], chemical_id: ['', Validators.required], gre_entry: '', purchase_order: '', notes: '' });
    readonly documentForm = this.fb.nonNullable.group({ kind: 'evidence' });
    actionVisible = false;
    editVisible = false;
    eventInvalid = false;
    selectedAction: Exclude<IbcEventKind, 'receive'> = 'wash';
    selectedFile: File | null = null;
    private id = '';
    private request = 0;

    constructor() {
        this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
            this.id = params.get('id') ?? '';
            this.cycle.set(null);
            this.events.set([]);
            this.documents.set([]);
            void this.reload();
        });
    }

    async reload(): Promise<void> {
        const request = ++this.request;

        this.loading.set(true);

        const [cycle, events, documents] = await Promise.allSettled([
            this.service.getService(this.id),
            this.service.events(this.id),
            this.service.documents(this.id)
        ]);

        if (request !== this.request) return;
        if (cycle.status === 'fulfilled') this.cycle.set(cycle.value);
        else this.error(cycle.reason);
        if (events.status === 'fulfilled') this.events.set(events.value);
        this.historyError.set(events.status === 'rejected');
        if (documents.status === 'fulfilled') this.documents.set(documents.value);
        this.documentsError.set(documents.status === 'rejected');
        this.loading.set(false);
    }

    openAction(kind: Exclude<IbcEventKind, 'receive'>): void {
        this.selectedAction = kind;
        this.eventForm.reset({ happenedAt: new Date(), result: null, recipientCompanyId: this.cycle()?.company_id ?? '' });
        this.eventInvalid = false;
        this.actionVisible = true;
    }

    confirmAction(): void {
        const data = this.eventForm.getRawValue();

        this.eventInvalid = this.eventForm.invalid || !(data.happenedAt instanceof Date) || Number.isNaN(data.happenedAt.getTime()) || (this.selectedAction === 'test' && !data.result) || (['repair', 'note'].includes(this.selectedAction) && !data.notes.trim()) || (this.selectedAction === 'deliver' && !data.recipientCompanyId);
        if (this.eventInvalid || this.saving() || this.loading() || this.historyError() || !this.actions().includes(this.selectedAction)) return;

        this.confirmation.confirm({ header: this.labels[this.selectedAction], message: 'Se registrará esta acción en el historial del servicio. ¿Deseas continuar?', icon: 'pi pi-exclamation-triangle', acceptLabel: 'Registrar', rejectLabel: 'Cancelar', accept: () => void this.saveAction() });
    }

    private async saveAction(): Promise<void> {
        if (this.saving()) return;
        this.saving.set(true);

        try {
            await this.service.recordEvent({ ...this.eventForm.getRawValue(), kind: this.selectedAction, cycleId: this.id });
            this.actionVisible = false;
            this.messages.add({ severity: 'success', summary: 'Acción registrada', detail: this.labels[this.selectedAction] });
            await this.reload();
        } catch (error) { this.error(error); } finally { this.saving.set(false); }
    }

    openEdit(): void {
        const c = this.cycle();

        if (!c) return;
        this.editForm.reset({ company_id: c.company_id, chemical_id: c.chemical_id, gre_entry: c.gre_entry ?? '', purchase_order: c.purchase_order ?? '', notes: c.notes ?? '' });
        this.editVisible = true;
    }

    async saveEdit(): Promise<void> {
        this.editForm.markAllAsTouched();
        if (this.editForm.invalid || this.saving() || !this.auth.hasPermission('ibc.update')) return;
        this.saving.set(true);

        try { await this.service.updateCycle(this.id, this.editForm.getRawValue()); this.editVisible = false; await this.reload(); } catch (error) { this.error(error); } finally { this.saving.set(false); }
    }

    selectFile(event: Event): void { this.selectedFile = (event.target as HTMLInputElement).files?.[0] ?? null; }

    async upload(): Promise<void> {
        if (!this.selectedFile || this.uploading() || !this.auth.hasPermission('ibc.documents')) return;
        this.uploading.set(true);

        try {
            await this.service.uploadDocument(this.id, this.documentForm.controls.kind.value as IbcDocument['document_kind'], this.selectedFile);
            this.selectedFile = null;
            this.messages.add({ severity: 'success', summary: 'Documento adjuntado' });
            await this.reload();
        } catch (error) { this.error(error); } finally { this.uploading.set(false); }
    }

    async download(document: IbcDocument): Promise<void> {
        try { await this.service.downloadDocument(document); } catch (error) { this.error(error); }
    }

    documentLabel(kind: string): string { return this.documentKinds.find((option) => option.value === kind)?.label ?? kind; }
    private error(error: unknown): void { this.messages.add({ severity: 'error', summary: 'Control IBC', detail: ibcErrorMessage(error) }); }
}
