import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { DISCOUNT_TYPE } from '@core/enums/discount-type';
import { PosProduct } from '@core/models/pos-catalog';
import { LoginService } from '@core/services/login.service';
import { CartService } from './cart.service';

describe('CartService', () => {

  const almendra = { id: 5, name: 'Leche de almendra', price: 3.5 };
  const capuchino: PosProduct = {
    id: 10, categoryId: 1, name: 'Capuchino', description: null, imageBase64: null, price: 15,
    available: true, addons: [almendra]
  };
  const loggedIn = signal(true);
  let cart: CartService;

  beforeEach(() => {
    loggedIn.set(true);
    TestBed.configureTestingModule({
      providers: [{ provide: LoginService, useValue: { isLoggedIn: loggedIn } }]
    });
    cart = TestBed.inject(CartService);
  });

  it('calcula subtotal con adicionales y total de vista previa', () => {
    cart.addLine(capuchino, 2, [almendra], null);
    cart.addLine(capuchino, 1, [], null);
    expect(cart.subtotal()).toBe(52);
    expect(cart.total()).toBe(52);
    expect(cart.itemCount()).toBe(3);
  });

  it('agrupa líneas idénticas y separa las que tienen otras observaciones', () => {
    cart.addLine(capuchino, 1, [almendra], 'sin azúcar');
    cart.addLine(capuchino, 2, [almendra], ' sin azúcar ');
    cart.addLine(capuchino, 1, [almendra], null);
    expect(cart.lines().length).toBe(2);
    expect(cart.lines()[0].quantity).toBe(3);
  });

  it('updateNotes agrega, cambia y quita la observación de una línea', () => {
    cart.addLine(capuchino, 2, [], null);
    cart.updateNotes(cart.lines()[0].key, '  sin azúcar ');
    expect(cart.lines()[0].notes).toBe('sin azúcar');
    expect(cart.lines()[0].quantity).toBe(2);
    cart.updateNotes(cart.lines()[0].key, '   ');
    expect(cart.lines()[0].notes).toBeNull();
    expect(cart.lines().length).toBe(1);
  });

  it('updateNotes fusiona con una línea idéntica sumando cantidades', () => {
    cart.addLine(capuchino, 1, [], 'caliente');
    cart.addLine(capuchino, 2, [], null);
    cart.updateNotes(cart.lines()[1].key, 'caliente');
    expect(cart.lines().length).toBe(1);
    expect(cart.lines()[0].quantity).toBe(3);
    expect(cart.lines()[0].notes).toBe('caliente');
  });

  it('aplica descuento porcentual redondeado y fijo', () => {
    cart.addLine(capuchino, 3, [], null);
    cart.setDiscount({ type: DISCOUNT_TYPE.PERCENTAGE, value: 12.5, reason: 'x' });
    expect(cart.discountAmount()).toBe(5.63);
    expect(cart.total()).toBe(39.37);
    cart.setDiscount({ type: DISCOUNT_TYPE.FIXED_AMOUNT, value: 5, reason: 'x' });
    expect(cart.total()).toBe(40);
  });

  it('el total nunca es negativo', () => {
    cart.addLine(capuchino, 1, [], null);
    cart.setDiscount({ type: DISCOUNT_TYPE.FIXED_AMOUNT, value: 100, reason: 'x' });
    expect(cart.total()).toBe(0);
  });

  it('cantidad 0 quita la línea; removeLine la elimina', () => {
    cart.addLine(capuchino, 1, [], null);
    const key = cart.lines()[0].key;
    cart.updateQuantity(key, 4);
    expect(cart.lines()[0].quantity).toBe(4);
    cart.updateQuantity(key, 0);
    expect(cart.isEmpty()).toBe(true);
  });

  it('el request lleva solo ids, cantidades y notas (ningún importe)', () => {
    cart.addLine(capuchino, 2, [almendra], 'caliente');
    cart.setDiscount({ type: DISCOUNT_TYPE.PERCENTAGE, value: 10, reason: '  Cliente frecuente ' });
    expect(cart.toItemsRequest()).toEqual([{ productId: 10, quantity: 2, addonIds: [5], notes: 'caliente' }]);
    expect(cart.toDiscountRequest()).toEqual({ type: DISCOUNT_TYPE.PERCENTAGE, value: 10, reason: 'Cliente frecuente' });
  });

  it('setDiscount con valor 0 quita el descuento', () => {
    cart.setDiscount({ type: DISCOUNT_TYPE.PERCENTAGE, value: 0, reason: null });
    expect(cart.discount()).toBeNull();
  });

  it('se vacía al cerrar sesión', () => {
    cart.addLine(capuchino, 1, [], null);
    loggedIn.set(false);
    TestBed.tick();
    expect(cart.isEmpty()).toBe(true);
  });
});
