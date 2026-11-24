import { TestBed } from '@angular/core/testing';
import { createClient } from '@supabase/supabase-js';
import { SupabaseClientService } from '@/app/core/supabase/supabase.client';
import { IbcService } from './ibc.service';
import { IbcListParams } from './ibc.models';

describe('Consultas de reportes IBC', () => {
    let requests: { url: URL; method: string }[];
    let service: IbcService;
    let historyResponses: Record<string, Response>;
    const params: IbcListParams = { first: 20, rows: 10, sortField: 'received_at', sortOrder: 1, status: 'open', search: 'GRE-123', companyId: 'company-id', chemicalId: 'chemical-id', dateFrom: '2026-02-15', dateTo: '2026-02-19' };

    beforeEach(() => {
        requests = [];
        historyResponses = {};
        const client = createClient('https://ibc-test.example.invalid', 'test-publishable-key', {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: `ibc-test-${crypto.randomUUID()}` },
            global: { fetch: async (input, init) => {
                const url = new URL(String(input));

                requests.push({ url, method: init?.method ?? 'GET' });

                if (historyResponses[url.pathname]) return historyResponses[url.pathname];

                return new Response(init?.method === 'HEAD' ? null : '[]', { status: 200, headers: { 'content-type': 'application/json', 'content-range': '0-0/3' } });
            } }
        });

        TestBed.configureTestingModule({ providers: [IbcService, { provide: SupabaseClientService, useValue: { client } }] });
        service = TestBed.inject(IbcService);
    });

    it('filtra pendientes en servidor y conserva paginado, orden y limites inclusivos de Lima', async () => {
        await service.listServices(params);
        const query = requests[0].url.searchParams;

        expect(query.get('status')).toBe('neq.delivered');
        expect(query.get('company_id')).toBe('eq.company-id');
        expect(query.get('chemical_id')).toBe('eq.chemical-id');
        expect(query.get('offset')).toBe('20');
        expect(query.get('limit')).toBe('10');
        expect(query.get('order')).toBe('received_at.asc,id.asc');
        expect(query.getAll('received_at')).toEqual(['gte.2026-02-15T00:00:00-05:00', 'lte.2026-02-19T23:59:59.999999-05:00']);
        expect(query.get('or')).toContain('GRE-123');
    });

    it('calcula el resumen por HEAD y no lo limita a la pagina ni al estado del seguimiento', async () => {
        const counts = await service.summary(params);

        expect(requests.length).toBe(5);
        expect(requests.every((request) => request.method === 'HEAD')).toBeTrue();
        expect(requests.map((request) => request.url.searchParams.get('status'))).toEqual(['eq.received', 'eq.awaiting_test', 'eq.retained', 'eq.ready_for_delivery', 'eq.delivered']);
        expect(requests.every((request) => !request.url.searchParams.has('limit') && !request.url.searchParams.has('offset'))).toBeTrue();
        expect(counts['delivered']).toBe(3);
    });

    it('todos elimina la restriccion de estado y el orden solo acepta columnas permitidas', async () => {
        await service.listServices({ ...params, status: '', sortField: 'campo-inexistente' });
        const query = requests[0].url.searchParams;

        expect(query.has('status')).toBeFalse();
        expect(query.get('order')).toBe('received_at.asc,id.asc');
    });

    it('conserva lavado y hermeticidad aunque falle la consulta de nombres de perfil', async () => {
        const events = [
            { id: 'last-wash', kind: 'wash', sequence: 35, created_by: 'actor' },
            { id: 'test', kind: 'test', sequence: 34, created_by: 'actor' }
        ];

        historyResponses['/rest/v1/ibc_service_events'] = new Response(JSON.stringify(events), { status: 200 });
        historyResponses['/rest/v1/profiles'] = new Response(JSON.stringify({ message: 'permission denied' }), { status: 403 });
        expect(await service.events('cycle')).toEqual(events.map((event) => jasmine.objectContaining(event)));
        expect(requests.map((request) => request.url.pathname)).toEqual(['/rest/v1/ibc_service_events', '/rest/v1/profiles']);
    });
});
