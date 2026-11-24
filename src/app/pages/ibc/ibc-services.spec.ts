import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AuthService } from '@/app/core/auth/auth.service';
import { IbcServicesComponent } from './ibc-services';
import { IbcService } from './ibc.service';

describe('Bandeja operativa IBC', () => {
    let component: IbcServicesComponent;
    let query: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
    let service: jasmine.SpyObj<IbcService>;

    beforeEach(() => {
        query = new BehaviorSubject(convertToParamMap({}));
        service = jasmine.createSpyObj<IbcService>('IbcService', ['listServices', 'summary']);
        service.listServices.and.resolveTo({ rows: [], total: 0 });
        TestBed.configureTestingModule({ providers: [
            MessageService, { provide: IbcService, useValue: service },
            { provide: AuthService, useValue: { hasPermission: () => true } },
            { provide: Router, useValue: { navigate: jasmine.createSpy().and.resolveTo(true) } },
            { provide: ActivatedRoute, useValue: { queryParamMap: query.asObservable() } }
        ] });
    });

    it('abre pendientes por antiguedad y consulta solo el listado operativo', async () => {
        component = TestBed.runInInjectionContext(() => new IbcServicesComponent());
        await component.load();

        expect(service.listServices.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ status: 'open', sortField: 'received_at', sortOrder: 1 }));
        expect(service.summary).not.toHaveBeenCalled();
    });

    it('recibe el estado y alcance exactos del enlace desde Reportes', async () => {
        query.next(convertToParamMap({ status: 'retained', companyId: 'empresa', chemicalId: 'quimico', dateFrom: '2026-02-01', dateTo: '2026-02-28' }));
        component = TestBed.runInInjectionContext(() => new IbcServicesComponent());
        await component.load();

        expect(service.listServices.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ status: 'retained', companyId: 'empresa', chemicalId: 'quimico', dateFrom: '2026-02-01', dateTo: '2026-02-28' }));
    });

    it('un cambio de enlace dentro de la misma ruta actualiza los filtros y vuelve a la primera pagina', async () => {
        component = TestBed.runInInjectionContext(() => new IbcServicesComponent());
        await component.load({ first: 20 });
        query.next(convertToParamMap({ status: 'delivered', companyId: 'otra-empresa' }));

        expect(service.listServices.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ first: 0, status: 'delivered', companyId: 'otra-empresa' }));
    });

    it('paginado no aplica cambios de formulario sin confirmar', async () => {
        component = TestBed.runInInjectionContext(() => new IbcServicesComponent());
        component.filters.controls.search.setValue('borrador');
        await component.load({ first: 10, rows: 10 });

        expect(service.listServices.calls.mostRecent().args[0].search).toBe('');
    });
});
