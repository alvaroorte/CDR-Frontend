import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { type Mock } from 'vitest';
import { ROLES_CODE_SYSTEM } from '@core/enums/roles';
import { SERVICE_TYPE } from '@core/enums/service-type';
import { Order } from '@core/models/order';
import { PosCatalog } from '@core/models/pos-catalog';
import { CashSessionService } from '@core/services/cash-session.service';
import { HelpersService } from '@core/services/helpers.service';
import { LoginService } from '@core/services/login.service';
import { PosComponent } from './pos.component';
import { CartService } from './services/cart.service';
import { PosService } from './services/pos.service';
import { OrderWsService } from '@core/services/order-ws.service';
import { CatalogEvent } from '@core/models/order';

describe('PosComponent', () => {

  const catalog: PosCatalog = {
    categories: [{ id: 1, name: 'Bebidas', imageBase64: null, products: [
      { id: 10, categoryId: 1, name: 'Capuchino', description: null, imageBase64: null, price: 15, available: true, addons: [] }
    ] }],
    paymentMethods: [{ id: 1, code: 'EFECTIVO', name: 'Efectivo', requiresReference: false, givesChange: true }],
    discountRules: { cashierMaxPercent: 50, reasonRequiredAbovePercent: 0 },
  };
  const order = { id: 40, code: 3, codeLabel: '#003', tableMarkerNumber: 5, total: 15 } as Order;
  const checkoutData = {
    serviceType: SERVICE_TYPE.DINE_IN, tableMarkerId: 2, customerName: null,
    payments: [{ paymentMethodId: 1, amount: 15, reference: null }]
  };

  let component: PosComponent;
  let posService: { getCatalog: Mock; getMarkerAvailability: Mock; quote: Mock; create: Mock };
  let cashService: { refresh: Mock; isOpen: ReturnType<typeof signal<boolean>>; loaded: () => boolean };
  let helpers: { messageNotification: Mock };
  let checkout: { start: Mock; backToService: Mock };
  let cart: CartService;
  const catalogEvent = signal<CatalogEvent | null>(null);

  beforeEach(() => {
    posService = {
      getCatalog: vi.fn().mockReturnValue(of(catalog)),
      getMarkerAvailability: vi.fn().mockReturnValue(of([])),
      quote: vi.fn().mockReturnValue(of({ total: 15 })),
      create: vi.fn().mockReturnValue(of(order)),
    };
    cashService = { refresh: vi.fn().mockReturnValue(of(null)), isOpen: signal(true), loaded: () => true };
    helpers = { messageNotification: vi.fn() };
    checkout = { start: vi.fn(), backToService: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: PosService, useValue: posService },
        { provide: CashSessionService, useValue: cashService },
        { provide: HelpersService, useValue: helpers },
        { provide: OrderWsService, useValue: { lastCatalogEvent: catalogEvent } },
        { provide: LoginService, useValue: {
          isLoggedIn: signal(true),
          rolesUser: signal([ROLES_CODE_SYSTEM.CASHIER]),
          haveSomeRole: (r: ROLES_CODE_SYSTEM[]) => r.includes(ROLES_CODE_SYSTEM.CASHIER),
        } },
      ]
    });
    cart = TestBed.inject(CartService);
    cart.clear();
    cart.addLine(catalog.categories[0].products[0], 1, [], null);
    component = TestBed.runInInjectionContext(() => new PosComponent());
    (component as unknown as Record<string, unknown>)['checkout'] = () => checkout;
  });

  it('ngOnInit carga el catálogo y el estado de caja', () => {
    component.ngOnInit();
    expect(component.catalog()).toEqual(catalog);
    expect(cashService.refresh).toHaveBeenCalled();
  });

  it('un producto sin adicionales entra directo al carrito; uno con adicionales abre la configuración', () => {
    const open = vi.fn();
    (component as unknown as Record<string, unknown>)['productConfig'] = () => ({ open });
    const capuchino = catalog.categories[0].products[0];
    component.onProductSelected(capuchino);
    expect(cart.lines()[0].quantity).toBe(2);
    expect(open).not.toHaveBeenCalled();

    const conAdicional = { ...capuchino, id: 11, addons: [{ id: 5, name: 'Leche de almendra', price: 3.5 }] };
    component.onProductSelected(conAdicional);
    expect(open).toHaveBeenCalledWith(conAdicional);
    expect(cart.lines().length).toBe(1);
  });

  it('el cajero puede descontar pero no es admin', () => {
    expect(component.canDiscount()).toBe(true);
    expect(component.isAdmin()).toBe(false);
  });

  it('sin caja abierta no abre el cobro', () => {
    cashService.isOpen.set(false);
    component.openCheckout();
    expect(component.checkoutVisible()).toBe(false);
    expect(helpers.messageNotification).toHaveBeenCalledWith('warn', expect.any(String), expect.stringContaining('abrir caja'));
  });

  it('con caja abierta reinicia y abre el cobro', () => {
    component.openCheckout();
    expect(checkout.start).toHaveBeenCalled();
    expect(component.checkoutVisible()).toBe(true);
  });

  it('requestQuote envía solo el carrito (ids, cantidades, descuento)', () => {
    component.requestQuote();
    expect(posService.quote).toHaveBeenCalledWith({
      items: [{ productId: 10, quantity: 1, addonIds: [], notes: null }], discount: null
    });
    expect(component.quote()).toEqual({ total: 15 });
  });

  it('confirmOrder registra, vacía el carrito y muestra el código', () => {
    component.checkoutVisible.set(true);
    component.confirmOrder(checkoutData);
    expect(posService.create).toHaveBeenCalledWith(expect.objectContaining({
      serviceType: SERVICE_TYPE.DINE_IN, tableMarkerId: 2, items: [{ productId: 10, quantity: 1, addonIds: [], notes: null }]
    }));
    expect(cart.isEmpty()).toBe(true);
    expect(component.createdOrder()).toEqual(order);
    expect(component.checkoutVisible()).toBe(false);
    expect(cashService.refresh).toHaveBeenCalled();
  });

  it('409 (adorno tomado por otro cajero) recarga adornos y vuelve a la modalidad sin vaciar el carrito', () => {
    posService.create.mockReturnValue(throwError(() => ({ code: 409, errors: ['en uso'] })));
    component.confirmOrder(checkoutData);
    expect(posService.getMarkerAvailability).toHaveBeenCalled();
    expect(checkout.backToService).toHaveBeenCalled();
    expect(cart.isEmpty()).toBe(false);
    expect(component.saving()).toBe(false);
  });

  it('un producto agotado en otro POS se actualiza en vivo (/topic/catalog)', () => {
    component.ngOnInit();
    catalogEvent.set({ eventId: 'e', type: 'PRODUCT_AVAILABILITY_CHANGED', productId: 10, available: false, version: 3, occurredAt: '' });
    TestBed.tick();
    expect(component.catalog()?.categories[0].products[0].available).toBe(false);
  });
});
