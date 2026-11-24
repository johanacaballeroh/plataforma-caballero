import { IbcEvent, IbcServiceCycle, availableIbcActions, ibcCsvCell } from './ibc.models';

describe('Reglas visuales de acciones IBC', () => {
    const cycle = { status: 'retained', wash_count: 1, requires_release: true } as IbcServiceCycle;
    const event = (sequence: number, kind: IbcEvent['kind'], result: IbcEvent['result'] = null) => ({ sequence, kind, result }) as IbcEvent;

    it('una fuga conserva la retencion y no ofrece entrega ni liberacion', () => {
        const actions = availableIbcActions(cycle, [event(2, 'test', 'leak'), event(1, 'wash')]);

        expect(actions).toContain('repair');
        expect(actions).not.toContain('release');
        expect(actions).not.toContain('deliver');
    });

    it('una reparacion invalida una prueba aprobada anterior', () => {
        const actions = availableIbcActions(cycle, [event(4, 'repair'), event(3, 'test', 'approved'), event(1, 'wash')]);

        expect(actions).toContain('test');
        expect(actions).not.toContain('release');
    });

    it('una prueba nueva aprobada requiere liberacion explicita', () => {
        const actions = availableIbcActions(cycle, [event(5, 'test', 'approved'), event(4, 'repair')]);

        expect(actions).toContain('release');
        expect(actions).not.toContain('deliver');
    });

    it('un lavado adicional no sustituye la reparacion de una fuga', () => {
        const actions = availableIbcActions(cycle, [event(3, 'wash'), event(2, 'test', 'leak'), event(1, 'wash')]);

        expect(actions).not.toContain('test');
        expect(actions).toContain('repair');
    });

    it('un servicio entregado no permite nuevas acciones', () => {
        expect(availableIbcActions({ ...cycle, status: 'delivered' }, [])).toEqual([]);
    });

    it('un comentario no invalida una prueba aprobada', () => {
        const actions = availableIbcActions({ ...cycle, status: 'ready_for_delivery', requires_release: false }, [event(6, 'note'), event(5, 'test', 'approved')]);

        expect(actions).toContain('deliver');
    });
});

describe('Exportacion CSV IBC', () => {
    it('neutraliza formulas al principio de una celda', () => {
        expect(ibcCsvCell(' =HYPERLINK("example")')).toBe('"\' =HYPERLINK(""example"")"');
        expect(ibcCsvCell('@SUM(1)')).toBe('"\'@SUM(1)"');
    });

    it('conserva comillas, separadores y saltos de linea como una celda', () => {
        expect(ibcCsvCell('GRE;"uno"\ndos')).toBe('"GRE;""uno""\ndos"');
    });
});
