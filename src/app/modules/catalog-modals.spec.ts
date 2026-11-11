import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { type Mock } from 'vitest';
import { HelpersService } from '@core/services/helpers.service';
import { ModalFormComponent as AddonForm } from './addon/components/modal-form/modal-form.component';
import { AddonService } from './addon/services/addon.service';
import { ModalFormComponent as TableMarkerForm } from './table-marker/components/modal-form/modal-form.component';
import { TableMarkerService } from './table-marker/services/table-marker.service';
import { ModalFormComponent as PaymentMethodForm } from './payment-method/components/modal-form/modal-form.component';
import { PaymentMethodService } from './payment-method/services/payment-method.service';
import { ModalFormComponent as ParameterForm } from './parameter/components/modal-form/modal-form.component';
import { ParameterService } from './parameter/services/parameter.service';
import { ModalPasswordComponent } from './user/components/modal-password/modal-password.component';
import { UserService } from './user/services/user.service';

/** Modales de los CRUD simples: adicionales, números de mesa, medios de pago, parámetros y contraseña. */
describe('Modales de catálogo', () => {
  const baseFields = { active: true, createdBy: '', updatedBy: '', createdAt: '', updatedAt: '' };

  const serviceStub = (entity: object) => ({
    eventFormComponent: { set: vi.fn() },
    eventTableComponent: vi.fn().mockReturnValue({ reload: vi.fn() }),
    getById: vi.fn().mockReturnValue(of(entity)),
    create: vi.fn().mockReturnValue(of(entity)),
    update: vi.fn().mockReturnValue(of(entity)),
  });

  let helpers: { messageNotification: Mock };
  beforeEach(() => helpers = { messageNotification: vi.fn() });

  it('Adicional: crea con el precio numérico y no envía sin precio', () => {
    const service = serviceStub({ id: 1, name: 'Shot', price: 4, ...baseFields });
    TestBed.configureTestingModule({ providers: [{ provide: AddonService, useValue: service }, { provide: HelpersService, useValue: helpers }] });
    const form = TestBed.runInInjectionContext(() => new AddonForm());

    form.openCreate();
    form.formAddon.patchValue({ name: 'Shot extra' });
    form.save();
    expect(service.create).not.toHaveBeenCalled();

    form.formAddon.patchValue({ price: 4 });
    form.save();
    expect(service.create).toHaveBeenCalledWith({ name: 'Shot extra', price: 4, active: true });
  });

  it('Número de mesa: rechaza 0 y crea con número válido', () => {
    const service = serviceStub({ id: 1, number: 5, description: null, ...baseFields });
    TestBed.configureTestingModule({ providers: [{ provide: TableMarkerService, useValue: service }, { provide: HelpersService, useValue: helpers }] });
    const form = TestBed.runInInjectionContext(() => new TableMarkerForm());

    form.openCreate();
    form.formTableMarker.patchValue({ number: 0 });
    expect(form.formTableMarker.valid).toBe(false);

    form.formTableMarker.patchValue({ number: 7, description: '  ' });
    form.save();
    expect(service.create).toHaveBeenCalledWith({ number: 7, description: null, active: true });
  });

  it('Medio de pago: el código no se edita y se envía en mayúsculas al crear', () => {
    const service = serviceStub({ id: 1, code: 'QR', name: 'QR', requiresReference: true, givesChange: false, ...baseFields });
    TestBed.configureTestingModule({ providers: [{ provide: PaymentMethodService, useValue: service }, { provide: HelpersService, useValue: helpers }] });
    const form = TestBed.runInInjectionContext(() => new PaymentMethodForm());

    form.openEdit(1);
    expect(form.formPaymentMethod.controls.code.disabled).toBe(true);

    form.openCreate();
    expect(form.formPaymentMethod.controls.code.enabled).toBe(true);
    form.formPaymentMethod.patchValue({ code: 'tarjeta', name: 'Tarjeta', requiresReference: true });
    form.save();
    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({ code: 'TARJETA', requiresReference: true }));
  });

  it('Parámetro porcentual: valida 0..100 y envía el valor como texto', () => {
    const parameter = { id: 1, folder: 'DESCUENTOS', code: 'CASHIER_MAX_DISCOUNT_PERCENT', name: 'Descuento', value: '50',
      valueType: 'PERCENTAGE', description: null, editable: true, ...baseFields };
    const service = { eventFormComponent: { set: vi.fn() }, eventTableComponent: vi.fn().mockReturnValue({ reload: vi.fn() }),
      getById: vi.fn().mockReturnValue(of(parameter)), updateValue: vi.fn().mockReturnValue(of(parameter)) };
    TestBed.configureTestingModule({ providers: [{ provide: ParameterService, useValue: service }, { provide: HelpersService, useValue: helpers }] });
    const form = TestBed.runInInjectionContext(() => new ParameterForm());

    form.openEdit(1);
    expect(form.formParameter.controls.numberValue.value).toBe(50);

    form.formParameter.controls.numberValue.setValue(150);
    expect(form.formParameter.valid).toBe(false);

    form.formParameter.controls.numberValue.setValue(40);
    form.save();
    expect(service.updateValue).toHaveBeenCalledWith(1, '40');
  });

  it('Contraseña: exige mínimo 8 caracteres y la envía al backend', () => {
    const service = { eventModalPasswordComponent: { set: vi.fn() },
      getById: vi.fn().mockReturnValue(of({ id: 7, fullName: 'María' })), resetPassword: vi.fn().mockReturnValue(of(undefined)) };
    TestBed.configureTestingModule({ providers: [{ provide: UserService, useValue: service }, { provide: HelpersService, useValue: helpers }] });
    const modal = TestBed.runInInjectionContext(() => new ModalPasswordComponent());

    modal.open(7);
    expect(modal.openModal).toBe(true);
    modal.formPassword.controls.password.setValue('corta');
    modal.save();
    expect(service.resetPassword).not.toHaveBeenCalled();

    modal.formPassword.controls.password.setValue('NuevaClave1');
    modal.save();
    expect(service.resetPassword).toHaveBeenCalledWith(7, 'NuevaClave1');
    expect(modal.openModal).toBe(false);
  });
});
