import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '@/app/core/auth/auth.service';
import { IbcRegistryRow, IbcServiceCycle } from './ibc.models';
import { IbcRegistryComponent } from './ibc-registry';
import { IbcService } from './ibc.service';

describe('Historial del envase IBC', () => {
    const container: IbcRegistryRow = { id: 'envase-1', original_number: '936', status: 'active', created_at: '', updated_at: '' };
    const cycles = [{ id: 'servicio-1' }] as IbcServiceCycle[];
    let component: IbcRegistryComponent;
    let service: jasmine.SpyObj<IbcService>;

    beforeEach(() => {
        service = jasmine.createSpyObj<IbcService>('IbcService', ['listServices']);
        service.listServices.and.resolveTo({ rows: cycles, total: 12 });
        TestBed.configureTestingModule({ providers: [
            MessageService, { provide: IbcService, useValue: service },
            { provide: AuthService, useValue: {} },
            { provide: ActivatedRoute, useValue: { snapshot: { data: { registry: 'containers' }, paramMap: convertToParamMap({}) } } }
        ] });
        component = TestBed.runInInjectionContext(() => new IbcRegistryComponent());
    });

    it('recarga la primera pagina al reabrir el mismo envase despues de paginar y ordenar', async () => {
        component.open(container, true);
        await component.loadHistory({ first: 10, sortField: 'status', sortOrder: 1 });
        component.visible = false;
        component.open(container, true);
        await Promise.resolve();

        expect(service.listServices.calls.allArgs()).toEqual([
            [jasmine.objectContaining({ containerId: container.id, first: 0, sortField: 'received_at', sortOrder: -1 })],
            [jasmine.objectContaining({ containerId: container.id, first: 10, sortField: 'status', sortOrder: 1 })],
            [jasmine.objectContaining({ containerId: container.id, first: 0, sortField: 'received_at', sortOrder: -1 })]
        ]);
        expect(component.history()).toEqual(cycles);
        expect(component.historyTotal()).toBe(12);
    });

    it('ignora una respuesta anterior al volver a abrir el mismo envase', async () => {
        let finishPrevious!: (value: { rows: IbcServiceCycle[]; total: number }) => void;

        service.listServices.and.returnValues(new Promise((resolve) => { finishPrevious = resolve; }), Promise.resolve({ rows: cycles, total: 12 }));
        component.open(container, true);
        component.visible = false;
        component.open(container, true);
        await Promise.resolve();
        finishPrevious({ rows: [], total: 0 });
        await Promise.resolve();

        expect(component.history()).toEqual(cycles);
        expect(component.historyTotal()).toBe(12);
        expect(component.historyLoading()).toBeFalse();
    });
});
