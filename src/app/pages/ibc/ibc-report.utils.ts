import { IBC_STATUSES, IbcServiceCycle } from './ibc.models';

export function ibcReportTotals(counts: Record<string, number>) {
    const total = IBC_STATUSES.reduce((sum, state) => sum + (counts[state.value] ?? 0), 0);
    const delivered = counts['delivered'] ?? 0;

    return { total, open: total - delivered, retained: counts['retained'] ?? 0, delivered };
}

export function ibcServiceDays(cycle: Pick<IbcServiceCycle, 'received_at' | 'delivered_at'>, now = Date.now()): number | null {
    const start = Date.parse(cycle.received_at);
    const end = cycle.delivered_at ? Date.parse(cycle.delivered_at) : now;

    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;

    return Math.max(0, Math.floor((end - start) / 86400000));
}
