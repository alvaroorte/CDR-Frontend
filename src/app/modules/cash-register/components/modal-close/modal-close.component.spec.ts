import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { type Mock } from 'vitest';
import { CashClosePreview } from '@core/models/cash-session';
import { CashSessionService } from '@core/services/cash-session.service';
import { ModalCloseComponent } from './modal-close.component';

const preview = (overrides: Partial<CashClosePreview> = {}): CashClosePreview => ({
  cashSessionId: 3, version: 7, userId: 4, userFullName: 'María Caja', ownSession: true, openedAt: '', openingAmount: 100,
  methods: [
    { paymentMethodId: 1, paymentMethodCode: 'EFECTIVO', paymentMethodName: 'Efectivo', cash: true, expectedAmount: 125.5 },
    { paymentMethodId: 2, paymentMethodCode: 'QR', paymentMethodName: 'QR', cash: false, expectedAmount: 20 },
  ],
  openOrders: [], ...overrides
});

describe('ModalCloseComponent (arqueo)', () => {
  let component: ModalCloseComponent;
  let service: { getClosePreview: Mock; close: Mock };

  beforeEach(() => {
    service = { getClosePreview: vi.fn().mockReturnValue(of(preview())), close: vi.fn().mockReturnValue(of({ id: 3 })) };
    TestBed.configureTestingModule({ providers: [{ provide: CashSessionService, useValue: service }] });
    component = TestBed.runInInjectionContext(() => new ModalCloseComponent());
  });

  const declare = (cash: number | null, qr: number | null) => {
    component.declaredArray.at(0).controls.amount.setValue(cash);
    component.declaredArray.at(1).controls.amount.setValue(qr);
  };

  it('carga el esperado y calcula la diferencia por medio en vivo', () => {
    component.open(3);
    expect(component.declaredArray.length).toBe(2);
    declare(120, 20);
    expect(component.differences()).toEqual([-5.5, 0]);
    expect(component.totalDifference()).toBe(-5.5);
  });

  it('exige declarar todos los medios', () => {
    component.open(3);
    declare(120, null);
    expect(component.canSubmit()).toBe(false);
    declare(120, 20);
    expect(component.canSubmit()).toBe(true);
  });

  it('con pedidos sin entregar exige confirmar la advertencia', () => {
    service.getClosePreview.mockReturnValue(of(preview({ openOrders: [{ id: 40, codeLabel: '#003', status: 'READY', statusLabel: 'LISTO' }] })));
    component.open(3);
    declare(125.5, 20);
    expect(component.canSubmit()).toBe(false);
    component.formClose.controls.confirmOpenOrders.setValue(true);
    expect(component.canSubmit()).toBe(true);
  });

  it('un ADMIN que cierra la caja de otro debe escribir una nota', () => {
    service.getClosePreview.mockReturnValue(of(preview({ ownSession: false })));
    component.open(3);
    declare(125.5, 20);
    expect(component.canSubmit()).toBe(false);
    component.formClose.controls.note.setValue('Olvidó cerrar');
    expect(component.canSubmit()).toBe(true);
  });

  it('envía la versión vista y un importe por medio', () => {
    const closed: unknown[] = [];
    component.closed.subscribe(s => closed.push(s));
    component.open(3);
    declare(120, 20);
    component.submit();
    expect(service.close).toHaveBeenCalledWith(3, {
      expectedVersion: 7, declared: [{ paymentMethodId: 1, amount: 120 }, { paymentMethodId: 2, amount: 20 }], note: null
    });
    expect(closed).toEqual([{ id: 3 }]);
  });

  it('409 (hubo un cobro durante el arqueo) recarga el esperado y conserva lo contado', () => {
    component.open(3);
    declare(120, 20);
    service.close.mockReturnValue(throwError(() => ({ code: 409, errors: [] })));
    service.getClosePreview.mockReturnValue(of(preview({ version: 8 })));
    component.submit();
    expect(service.getClosePreview).toHaveBeenCalledTimes(2);
    expect(component.preview()?.version).toBe(8);
    expect(component.declaredArray.at(0).controls.amount.value).toBe(120);
  });
});
