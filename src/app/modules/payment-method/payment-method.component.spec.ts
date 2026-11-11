import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { type Mock } from 'vitest';
import { PaymentMethodComponent } from './payment-method.component';
import { PaymentMethodService } from './services/payment-method.service';
import { PaymentMethod } from '@core/models/payment-method';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { HelpersService } from '@core/services/helpers.service';

describe('PaymentMethodComponent', () => {

  const baseFields = { active: true, createdBy: '', updatedBy: '', createdAt: '', updatedAt: '' };
  const paymentMethodsMock = [{ id: 1, code: 'EFECTIVO', name: 'Efectivo', requiresReference: false, givesChange: true, ...baseFields }] as PaymentMethod[];

  let component: PaymentMethodComponent;
  let serviceStub: { getAll: Mock; eventTableComponent: { set: Mock } };

  beforeEach(() => {
    serviceStub = {
      getAll: vi.fn().mockReturnValue(of(paymentMethodsMock)),
      eventTableComponent: { set: vi.fn() },
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: PaymentMethodService, useValue: serviceStub },
        { provide: HelpersService, useValue: { messageNotification: vi.fn() } },
      ]
    });
    component = TestBed.runInInjectionContext(() => new PaymentMethodComponent());
  });

  it('ngOnInit carga los registros', () => {
    component.ngOnInit();
    expect(serviceStub.getAll).toHaveBeenCalled();
    expect(component.paymentMethods()).toEqual(paymentMethodsMock);
  });

  it('getPaymentMethods con respuesta vacía deja el signal en []', () => {
    serviceStub.getAll.mockReturnValue(of([]));
    component.getPaymentMethods();
    expect(component.paymentMethods()).toEqual([]);
  });

  it('setPaymentMethod actualiza la selección', () => {
    component.setPaymentMethod(paymentMethodsMock[0]);
    expect(component.paymentMethodSelected()).toEqual(paymentMethodsMock[0]);
    component.setPaymentMethod(null);
    expect(component.paymentMethodSelected()).toBeNull();
  });

  it('onTableSelfEmision registra la tabla en el servicio', () => {
    const table = {} as GenericTableComponent<PaymentMethod>;
    component.onTableSelfEmision(table);
    expect(serviceStub.eventTableComponent.set).toHaveBeenCalledWith(table);
  });
});
