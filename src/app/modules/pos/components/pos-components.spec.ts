import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { DISCOUNT_TYPE } from '@core/enums/discount-type';
import { SERVICE_TYPE } from '@core/enums/service-type';
import { OrderQuote } from '@core/models/order';
import { PosPaymentMethod, PosProduct } from '@core/models/pos-catalog';
import { LoginService } from '@core/services/login.service';
import { CartService } from '../services/cart.service';
import { CartPanelComponent } from './cart-panel/cart-panel.component';
import { CheckoutComponent, ICheckoutData } from './checkout/checkout.component';

const capuchino: PosProduct = {
  id: 10, categoryId: 1, name: 'Capuchino', description: null, imageBase64: null, price: 20, available: true, addons: []
};
const efectivo: PosPaymentMethod = { id: 1, code: 'EFECTIVO', name: 'Efectivo', requiresReference: false, givesChange: true };
const qr: PosPaymentMethod = { id: 2, code: 'QR', name: 'QR', requiresReference: true, givesChange: false };

describe('CartPanelComponent', () => {
  let component: CartPanelComponent;
  let cart: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: LoginService, useValue: { isLoggedIn: signal(true) } }]
    });
    cart = TestBed.inject(CartService);
    cart.clear();
    cart.addLine(capuchino, 1, [], null);
    component = TestBed.runInInjectionContext(() => new CartPanelComponent());
    TestBed.runInInjectionContext(() => {
      (component as unknown as { discountRules: () => unknown }).discountRules = signal({ cashierMaxPercent: 50, reasonRequiredAbovePercent: 0 });
    });
  });

  it('el formulario de descuento actualiza el carrito', () => {
    component.formDiscount.patchValue({ type: DISCOUNT_TYPE.PERCENTAGE, value: 10, reason: 'Promo' });
    expect(cart.discountAmount()).toBe(2);
    expect(component.canContinue()).toBe(true);
  });

  it('exige motivo cuando el descuento supera el umbral', () => {
    component.formDiscount.patchValue({ type: DISCOUNT_TYPE.PERCENTAGE, value: 10, reason: '' });
    expect(component.discountError()).toBe(component.messages.discountReasonRequired);
    expect(component.canContinue()).toBe(false);
  });

  it('el CAJERO no puede superar el máximo (monto fijo comparado como %)', () => {
    component.formDiscount.patchValue({ type: DISCOUNT_TYPE.FIXED_AMOUNT, value: 15, reason: 'x' });
    expect(component.discountError()).toContain('50 %');
  });

  it('un descuento que deja el total en 0 no permite continuar', () => {
    component.formDiscount.patchValue({ type: DISCOUNT_TYPE.FIXED_AMOUNT, value: 20, reason: 'x' });
    expect(component.discountError()).not.toBeNull();
  });

  it('clearDiscount quita el descuento del carrito', () => {
    component.formDiscount.patchValue({ type: DISCOUNT_TYPE.PERCENTAGE, value: 10, reason: 'x' });
    component.clearDiscount();
    expect(cart.discount()).toBeNull();
  });
});

describe('CheckoutComponent', () => {
  let component: CheckoutComponent;
  let emitted: ICheckoutData[];
  const quote = signal<OrderQuote | null>(null);

  beforeEach(() => {
    emitted = [];
    quote.set(null);
    TestBed.configureTestingModule({});
    component = TestBed.runInInjectionContext(() => new CheckoutComponent());
    const c = component as unknown as Record<string, unknown>;
    c['paymentMethods'] = signal([efectivo, qr]);
    c['previewTotal'] = signal(20);
    c['quote'] = quote;
    c['markers'] = signal([
      { id: 1, number: 5, description: null, inUse: true, orderId: 3, orderCodeLabel: '#003' },
      { id: 2, number: 6, description: null, inUse: false, orderId: null, orderCodeLabel: null },
    ]);
    component.confirmOrder.subscribe(data => emitted.push(data));
    component.start();
  });

  it('start propone un pago en efectivo por el total', () => {
    expect(component.paymentsArray.length).toBe(1);
    expect(component.paymentsArray.at(0).getRawValue()).toEqual(
      expect.objectContaining({ paymentMethodId: 1, amount: 20 }));
  });

  it('en el local exige un adorno libre; los ocupados no se pueden elegir', () => {
    component.chooseServiceType(SERVICE_TYPE.DINE_IN);
    expect(component.serviceStepValid()).toBe(false);
    component.chooseMarker({ id: 1, number: 5, description: null, inUse: true, orderId: 3, orderCodeLabel: '#003' });
    expect(component.serviceStepValid()).toBe(false);
    component.chooseMarker({ id: 2, number: 6, description: null, inUse: false, orderId: null, orderCodeLabel: null });
    expect(component.serviceStepValid()).toBe(true);
  });

  it('pasar a para llevar limpia el adorno', () => {
    component.chooseServiceType(SERVICE_TYPE.DINE_IN);
    component.chooseMarker({ id: 2, number: 6, description: null, inUse: false, orderId: null, orderCodeLabel: null });
    component.chooseServiceType(SERVICE_TYPE.TAKEAWAY);
    expect(component.selectedMarkerId()).toBeNull();
    expect(component.serviceStepValid()).toBe(true);
  });

  it('los pagos deben sumar el total y QR exige referencia', () => {
    component.paymentsArray.at(0).controls.amount.setValue(12);
    expect(component.difference()).toBe(8);
    expect(component.paymentsValid()).toBe(false);
    component.addPayment(2);
    expect(component.paymentsArray.at(1).controls.amount.value).toBe(8);
    expect(component.paymentsValid()).toBe(false);
    component.paymentsArray.at(1).controls.reference.setValue('TX-1');
    expect(component.paymentsValid()).toBe(true);
  });

  it('el vuelto es solo visual: recibido − importe', () => {
    component.paymentsArray.at(0).controls.received.setValue(50);
    expect(component.change(0)).toBe(30);
    component.paymentsArray.at(0).controls.received.setValue(10);
    expect(component.change(0)).toBeNull();
  });

  it('con un solo pago se ajusta al total del backend', () => {
    quote.set({ items: [], subtotal: 20.01, discountType: null, discountValue: null, discountAmount: 0, discountPercent: null, discountReason: null, total: 20.01 });
    TestBed.tick();
    expect(component.paymentsArray.at(0).controls.amount.value).toBe(20.01);
  });

  it('confirm emite modalidad y pagos sin el importe recibido', () => {
    component.chooseServiceType(SERVICE_TYPE.TAKEAWAY);
    component.formCheckout.controls.customerName.setValue('  Ana ');
    component.paymentsArray.at(0).controls.received.setValue(50);
    quote.set({ items: [], subtotal: 20, discountType: null, discountValue: null, discountAmount: 0, discountPercent: null, discountReason: null, total: 20 });
    TestBed.tick();

    component.confirm();

    expect(emitted).toEqual([{
      serviceType: SERVICE_TYPE.TAKEAWAY, tableMarkerId: null, customerName: 'Ana',
      payments: [{ paymentMethodId: 1, amount: 20, reference: null }]
    }]);
  });

  it('no confirma sin la cotización del backend', () => {
    component.chooseServiceType(SERVICE_TYPE.TAKEAWAY);
    component.confirm();
    expect(emitted).toEqual([]);
  });
});
