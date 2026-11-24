import { ibcReportTotals, ibcServiceDays } from './ibc-report.utils';

describe('Indicadores IBC', () => {
    it('cuenta servicios abiertos incluyendo retenidos y listos, pero excluye entregados', () => {
        expect(ibcReportTotals({ received: 2, awaiting_test: 3, retained: 1, ready_for_delivery: 4, delivered: 5 })).toEqual({ total: 15, open: 10, retained: 1, delivered: 5 });
    });

    it('muestra cero para un conjunto vacio o estados sin registros', () => {
        expect(ibcReportTotals({})).toEqual({ total: 0, open: 0, retained: 0, delivered: 0 });
    });

    it('la duracion de un entregado permanece fija aunque pase el tiempo', () => {
        expect(ibcServiceDays({ received_at: '2026-02-15T08:00:00-05:00', delivered_at: '2026-02-17T07:59:00-05:00' }, Date.parse('2026-11-08'))).toBe(1);
    });

    it('calcula dias completos de los servicios abiertos', () => {
        expect(ibcServiceDays({ received_at: '2026-02-15T08:00:00-05:00', delivered_at: null }, Date.parse('2026-02-18T08:00:00-05:00'))).toBe(3);
    });

    it('no muestra duraciones negativas o fechas invalidas', () => {
        expect(ibcServiceDays({ received_at: 'invalid', delivered_at: null })).toBeNull();
        expect(ibcServiceDays({ received_at: '2026-02-15T08:00:00Z', delivered_at: null }, Date.parse('2026-02-14T08:00:00Z'))).toBe(0);
    });
});
