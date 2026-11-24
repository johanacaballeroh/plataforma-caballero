export type IbcStatus = 'received' | 'awaiting_test' | 'retained' | 'ready_for_delivery' | 'delivered';
export type IbcEventKind = 'receive' | 'wash' | 'test' | 'repair' | 'release' | 'deliver' | 'note';
export type IbcTestResult = 'approved' | 'leak';
export type RegistryStatus = 'active' | 'inactive';

export const IBC_STATUSES: { value: IbcStatus; label: string; severity: 'info' | 'warn' | 'danger' | 'success' | 'secondary' }[] = [
    { value: 'received', label: 'Recibido', severity: 'info' },
    { value: 'awaiting_test', label: 'Pendiente de hermeticidad', severity: 'warn' },
    { value: 'retained', label: 'Retenido', severity: 'danger' },
    { value: 'ready_for_delivery', label: 'Listo para entrega', severity: 'success' },
    { value: 'delivered', label: 'Entregado', severity: 'secondary' }
];

export const IBC_EVENTS: Record<IbcEventKind, string> = {
    receive: 'Recepción', wash: 'Lavado / reacondicionamiento', test: 'Prueba de hermeticidad', repair: 'Reparación', release: 'Liberación', deliver: 'Entrega', note: 'Observación / corrección'
};

export interface IbcRegistryRow {
    id: string;
    name?: string;
    description?: string | null;
    code?: string;
    original_number?: string;
    notes?: string | null;
    status: RegistryStatus;
    cycle_count?: number;
    wash_count?: number;
    created_at: string;
    updated_at: string;
}

export interface IbcServiceCycle {
    id: string;
    container_id: string;
    container_code: string;
    original_number: string;
    company_id: string;
    company_name: string;
    chemical_id: string;
    chemical_name: string;
    received_at: string;
    gre_entry: string | null;
    purchase_order: string | null;
    notes: string | null;
    legacy_rotation: number | null;
    source_reference: string | null;
    is_demo: boolean;
    status: IbcStatus;
    requires_release: boolean;
    delivered_at: string | null;
    recipient_company_id: string | null;
    gre_exit: string | null;
    wash_count: number;
    latest_test_result: IbcTestResult | null;
    created_at: string;
}

export interface IbcEvent {
    id: string;
    sequence: number;
    cycle_id: string;
    kind: IbcEventKind;
    happened_at: string;
    result: IbcTestResult | null;
    notes: string | null;
    resulting_status: IbcStatus;
    created_by: string;
    actor_name?: string;
    created_at: string;
}

export interface IbcDocument {
    id: string;
    cycle_id: string;
    document_kind: 'gre_entry' | 'gre_exit' | 'purchase_order' | 'evidence';
    file_name: string;
    storage_bucket: string;
    storage_path: string;
    mime_type: string;
    size_bytes: number;
    created_at: string;
}

export interface IbcListParams {
    first: number;
    rows: number;
    sortField: string;
    sortOrder: 1 | -1;
    search?: string;
    status?: string | null;
    companyId?: string | null;
    chemicalId?: string | null;
    containerId?: string;
    dateFrom?: string | null;
    dateTo?: string | null;
}

export interface IbcOption { id: string; label: string; }

export interface ReceiveIbcPayload {
    containerId: string | null;
    originalNumber: string;
    companyId: string;
    chemicalId: string;
    receivedAt: Date;
    greEntry: string;
    purchaseOrder: string;
    notes: string;
}

export interface RecordIbcEventPayload {
    cycleId: string;
    kind: Exclude<IbcEventKind, 'receive'>;
    happenedAt: Date;
    result: IbcTestResult | null;
    notes: string;
    recipientCompanyId: string | null;
    greExit: string;
}

export function ibcState(status: IbcStatus) {
    return IBC_STATUSES.find((item) => item.value === status)!;
}

// Solo disponibilidad visual. El trigger de PostgreSQL valida de nuevo toda accion.
export function availableIbcActions(cycle: IbcServiceCycle, events: IbcEvent[]): Exclude<IbcEventKind, 'receive'>[] {
    if (cycle.status === 'delivered') return [];

    const latest = [...events].filter((event) => ['wash', 'repair', 'test'].includes(event.kind)).sort((a, b) => b.sequence - a.sequence)[0];
    const actions: Exclude<IbcEventKind, 'receive'>[] = ['wash'];

    const lastLeak = Math.max(0, ...events.filter((event) => event.kind === 'test' && event.result === 'leak').map((event) => event.sequence));
    const repaired = !lastLeak || events.some((event) => event.kind === 'repair' && event.sequence > lastLeak);

    if (latest && ['wash', 'repair'].includes(latest.kind) && cycle.wash_count > 0 && repaired) actions.push('test');
    if (cycle.status === 'retained') actions.push('repair');
    if (cycle.status === 'retained' && latest?.kind === 'test' && latest.result === 'approved') actions.push('release');
    if (cycle.status === 'ready_for_delivery' && !cycle.requires_release && latest?.kind === 'test' && latest.result === 'approved') actions.push('deliver');
    actions.push('note');

    return actions;
}

export function ibcCsvCell(value: unknown): string {
    let text = String(value ?? '');

    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;

    return `"${text.replaceAll('"', '""')}"`;
}

export function ibcErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message);

        if (message.includes('ibc_one_open_cycle')) return 'Este envase ya tiene un servicio abierto.';
        if (message.includes('ibc_chemical_name')) return 'Ya existe un químico con ese nombre.';

        return message;
    }

    return 'No se pudo completar la operación. Inténtalo nuevamente.';
}
