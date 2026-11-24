import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ConfirmationService } from 'primeng/api';
import { AuthService } from '@/app/core/auth/auth.service';
import { IbcEvent, IbcServiceCycle } from './ibc.models';
import { IbcServiceDetailComponent } from './ibc-service-detail';
import { IbcService } from './ibc.service';

describe('Ficha del servicio IBC', () => {
    it('muestra el historial y habilita la nueva prueba tras otro lavado, incluso si fallan los documentos', async () => {
        const service = jasmine.createSpyObj<IbcService>('IbcService', ['getService', 'events', 'documents', 'recordEvent']);
        const date = '2026-02-15T13:00:00Z';
        const cycle = { id: 'ciclo', container_id: 'envase', container_code: 'IBC-PRUEBA', company_id: 'empresa', received_at: date, status: 'ready_for_delivery', wash_count: 1, latest_test_result: 'approved', legacy_rotation: null } as IbcServiceCycle;
        const events: IbcEvent[] = [
            { id: 'test', sequence: 3, kind: 'test', result: 'approved', resulting_status: 'ready_for_delivery', happened_at: date, created_at: date } as IbcEvent,
            { id: 'wash', sequence: 2, kind: 'wash', result: null, resulting_status: 'awaiting_test', happened_at: date, created_at: date } as IbcEvent,
            { id: 'receive', sequence: 1, kind: 'receive', result: null, resulting_status: 'received', happened_at: date, created_at: date } as IbcEvent
        ];

        service.getService.and.callFake(async () => ({ ...cycle }));
        service.events.and.callFake(async () => [...events]);
        service.documents.and.rejectWith(new Error('Documentos no disponibles'));
        service.recordEvent.and.callFake(async () => {
            cycle.status = 'awaiting_test';
            cycle.wash_count++;
            events.unshift({ ...events[1], id: 'wash-2', sequence: 4 });
        });

        TestBed.configureTestingModule({
            providers: [
                provideRouter([{ path: 'ibc/services/:id', component: IbcServiceDetailComponent }]),
                { provide: IbcService, useValue: service },
                { provide: AuthService, useValue: { hasPermission: (permission: string) => ['ibc.wash', 'ibc.test', 'ibc.deliver'].includes(permission) } }
            ]
        });

        const harness = await RouterTestingHarness.create();
        const component = await harness.navigateByUrl('/ibc/services/ciclo', IbcServiceDetailComponent);
        const confirmation = harness.routeDebugElement!.injector.get(ConfirmationService);
        const confirm = spyOn(confirmation, 'confirm').and.returnValue(confirmation);

        await harness.fixture.whenStable();
        expect(harness.routeNativeElement?.textContent).toContain('Registrar entrega');
        component.openAction('wash');
        component.confirmAction();
        confirm.calls.mostRecent().args[0].accept?.();
        await harness.fixture.whenStable();
        harness.detectChanges();

        const detail = harness.routeNativeElement!;
        const history = detail.querySelector('p-timeline')?.textContent;

        expect(service.recordEvent).toHaveBeenCalledWith(jasmine.objectContaining({ cycleId: 'ciclo', kind: 'wash' }));
        expect(history?.match(/Lavado \/ reacondicionamiento/g)?.length).toBe(2);
        expect(history).toContain('Prueba de hermeticidad');
        expect(history).toContain('Aprobada');
        expect(detail.textContent).toContain('Registrar prueba de hermeticidad');
        expect(detail.textContent).not.toContain('Registrar entrega');
        expect(detail.textContent).toContain('No se pudieron actualizar los documentos adjuntos.');
    });
});
