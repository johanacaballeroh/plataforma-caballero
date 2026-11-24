import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { AuthService } from '@/app/core/auth/auth.service';
import { IbcReportsComponent } from './ibc-reports';
import { IbcService } from './ibc.service';

describe('Reportes y seguimiento IBC', () => {
    let component: IbcReportsComponent;
    let service: jasmine.SpyObj<IbcService>;
    let auth: { hasPermission: jasmine.Spy };

    beforeEach(() => {
        service = jasmine.createSpyObj<IbcService>('IbcService', ['listServices', 'summary', 'exportCsv']);
        service.listServices.and.resolveTo({ rows: [], total: 7 });
        service.summary.and.resolveTo({ received: 2, retained: 5 });
        service.exportCsv.and.resolveTo();
        auth = { hasPermission: jasmine.createSpy().and.returnValue(true) };
        TestBed.configureTestingModule({ providers: [MessageService, { provide: IbcService, useValue: service }, { provide: AuthService, useValue: auth }] });
        component = TestBed.runInInjectionContext(() => new IbcReportsComponent());
    });

    it('consulta solo indicadores agregados y no aplica filtros aun no confirmados', async () => {
        component.filters.controls.companyId.setValue('borrador');
        await component.load();

        expect(service.summary.calls.mostRecent().args[0].status).toBe('');
        expect(service.summary.calls.mostRecent().args[0].companyId).toBeUndefined();
        expect(service.listServices).not.toHaveBeenCalled();
    });

    it('exportacion y enlace a Servicios conservan filtros aplicados aunque el formulario cambie', async () => {
        component.filters.patchValue({ companyId: 'empresa-aplicada', chemicalId: 'quimico-aplicado', dateFrom: '2026-02-01', dateTo: '2026-02-28' });
        component.applyFilters();
        component.filters.controls.companyId.setValue('cambio sin aplicar');
        await component.load();
        await component.export();

        expect(service.summary.calls.mostRecent().args[0].companyId).toBe('empresa-aplicada');
        expect(service.exportCsv.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ companyId: 'empresa-aplicada', status: '' }));
        expect(component.serviceFilters('retained')).toEqual({ status: 'retained', companyId: 'empresa-aplicada', chemicalId: 'quimico-aplicado', dateFrom: '2026-02-01', dateTo: '2026-02-28' });
    });

    it('rechaza fechas invertidas y exportacion sin permiso', async () => {
        component.filters.patchValue({ dateFrom: '2026-03-02', dateTo: '2026-02-01' });
        component.applyFilters();

        expect(service.summary).not.toHaveBeenCalled();
        await component.load();
        auth.hasPermission.and.returnValue(false);
        await component.export();
        expect(service.exportCsv).not.toHaveBeenCalled();
    });

    it('una respuesta lenta anterior no reemplaza los indicadores de un periodo reciente', async () => {
        let finishFirst!: (value: Record<string, number>) => void;

        service.summary.and.returnValues(new Promise((resolve) => { finishFirst = resolve; }), Promise.resolve({ retained: 2 }));
        const first = component.load();

        component.params.dateFrom = '2026-02-01';
        await component.load();
        finishFirst({ retained: 99 });
        await first;
        expect(component.totals().retained).toBe(2);
    });
});
