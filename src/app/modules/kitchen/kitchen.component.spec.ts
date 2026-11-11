import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { type Mock } from 'vitest';
import { ORDER_STATUS } from '@core/enums/order-status';
import { SERVICE_TYPE } from '@core/enums/service-type';
import { OrderBoard } from '@core/models/order';
import { OrderService } from '@core/services/order.service';
import { OrderWsService } from '@core/services/order-ws.service';
import { elapsedMinutes, formatElapsed } from '@core/utils/elapsed';
import { KITCHEN_NEXT, KITCHEN_PREVIOUS, delayLevel } from './components/kitchen-card/kitchen-card.component';
import { KitchenComponent } from './kitchen.component';

const order = (id: number, status: ORDER_STATUS, version = 1): OrderBoard => ({
  id, code: id, codeLabel: `#00${id}`, serviceType: SERVICE_TYPE.DINE_IN, serviceTypeLabel: 'En el local',
  tableMarkerNumber: 5, customerName: null, status, statusLabel: status, total: 10, version,
  createdAt: '2026-11-11T10:00:00', createdBy: 'maria.caja', statusChangedAt: null, items: []
});

describe('Cocina: reglas de la tarjeta', () => {
  it('avanza un paso y retrocede uno (decisión Etapa 4)', () => {
    expect(KITCHEN_NEXT[ORDER_STATUS.PENDING]).toBe(ORDER_STATUS.IN_PREPARATION);
    expect(KITCHEN_NEXT[ORDER_STATUS.IN_PREPARATION]).toBe(ORDER_STATUS.READY);
    expect(KITCHEN_NEXT[ORDER_STATUS.READY]).toBeUndefined();   // lo entrega el cajero
    expect(KITCHEN_PREVIOUS[ORDER_STATUS.READY]).toBe(ORDER_STATUS.IN_PREPARATION);
    expect(KITCHEN_PREVIOUS[ORDER_STATUS.PENDING]).toBeUndefined();
  });

  it('marca demoras según los parámetros', () => {
    const settings = { delayWarningMinutes: 10, delayCriticalMinutes: 20 };
    expect(delayLevel(9, settings)).toBe('ok');
    expect(delayLevel(10, settings)).toBe('warn');
    expect(delayLevel(25, settings)).toBe('critical');
    expect(delayLevel(25, null)).toBe('ok');
  });

  it('tiempo transcurrido legible', () => {
    const start = new Date('2026-11-11T10:00:00').getTime();
    expect(elapsedMinutes('2026-11-11T10:00:00', start + 12 * 60000 + 30000)).toBe(12);
    expect(formatElapsed(12)).toBe('12 min');
    expect(formatElapsed(72)).toBe('1 h 12 min');
  });
});

describe('KitchenComponent', () => {
  let component: KitchenComponent;
  let orderService: { getKitchenSettings: Mock; changeStatus: Mock };
  let ws: { orders: ReturnType<typeof signal<OrderBoard[]>>; resync: Mock; connected: () => boolean; lastCreated: () => null };

  beforeEach(() => {
    orderService = {
      getKitchenSettings: vi.fn().mockReturnValue(of({ delayWarningMinutes: 10, delayCriticalMinutes: 20 })),
      changeStatus: vi.fn().mockReturnValue(of({})),
    };
    ws = {
      orders: signal([order(1, ORDER_STATUS.PENDING), order(2, ORDER_STATUS.IN_PREPARATION), order(3, ORDER_STATUS.READY)]),
      resync: vi.fn(), connected: () => true, lastCreated: () => null,
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: OrderService, useValue: orderService },
        { provide: OrderWsService, useValue: ws },
      ]
    });
    component = TestBed.runInInjectionContext(() => new KitchenComponent());
  });

  it('agrupa los pedidos por columna y carga los umbrales', () => {
    component.ngOnInit();
    expect(component.pending().map(o => o.id)).toEqual([1]);
    expect(component.inPreparation().map(o => o.id)).toEqual([2]);
    expect(component.ready().map(o => o.id)).toEqual([3]);
    expect(component.settings()).toEqual({ delayWarningMinutes: 10, delayCriticalMinutes: 20 });
    expect(ws.resync).toHaveBeenCalled();
  });

  it('cambia el estado enviando la versión que se ve', () => {
    component.changeStatus(order(1, ORDER_STATUS.PENDING, 4), ORDER_STATUS.IN_PREPARATION);
    expect(orderService.changeStatus).toHaveBeenCalledWith(1, ORDER_STATUS.IN_PREPARATION, 4);
    expect(component.isBusy(1)).toBe(false);
  });

  it('409 (otro cocinero ya lo movió) resincroniza el tablero', () => {
    orderService.changeStatus.mockReturnValue(throwError(() => ({ code: 409, errors: [] })));
    component.changeStatus(order(1, ORDER_STATUS.PENDING), ORDER_STATUS.IN_PREPARATION);
    expect(ws.resync).toHaveBeenCalled();
    expect(component.isBusy(1)).toBe(false);
  });
});
