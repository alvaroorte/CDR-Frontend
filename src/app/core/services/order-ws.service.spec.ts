import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { type Mock } from 'vitest';
import { Client, StompConfig } from '@stomp/stompjs';
import { ORDER_STATUS } from '@core/enums/order-status';
import { SERVICE_TYPE } from '@core/enums/service-type';
import { OrderBoard, OrderEvent } from '@core/models/order';
import { LocalStorageService } from './local-storage.service';
import { OrderService } from './order.service';
import { OrderWsService, STOMP_CLIENT_FACTORY, TOPIC_CATALOG, TOPIC_ORDERS } from './order-ws.service';

const board = (id: number, version: number, status = ORDER_STATUS.PENDING): OrderBoard => ({
  id, code: id, codeLabel: `#00${id}`, serviceType: SERVICE_TYPE.TAKEAWAY, serviceTypeLabel: 'Para llevar',
  tableMarkerNumber: null, customerName: null, status, statusLabel: status, total: 10, version,
  createdAt: `2026-11-11T10:0${id}:00`, createdBy: 'maria.caja', statusChangedAt: null, items: []
});
const event = (order: OrderBoard, type: OrderEvent['type'] = 'ORDER_STATUS_CHANGED'): OrderEvent => ({
  eventId: 'e', type, orderId: order.id, version: order.version, status: order.status, occurredAt: '', order
});

describe('OrderWsService', () => {
  let service: OrderWsService;
  let getBoard: Mock;
  let config: StompConfig;
  let fakeClient: { active: boolean; activate: Mock; deactivate: Mock; subscribe: Mock; connectHeaders: Record<string, string> };

  beforeEach(() => {
    getBoard = vi.fn().mockReturnValue(of([board(1, 0), board(2, 3)]));
    fakeClient = { active: false, activate: vi.fn(), deactivate: vi.fn(), subscribe: vi.fn(), connectHeaders: {} };
    TestBed.configureTestingModule({
      providers: [
        { provide: OrderService, useValue: { getBoard } },
        { provide: LocalStorageService, useValue: { get: () => 'jwt-actual' } },
        { provide: STOMP_CLIENT_FACTORY, useValue: (c: StompConfig) => { config = c; return fakeClient as unknown as Client; } },
      ]
    });
    service = TestBed.inject(OrderWsService);
  });

  it('al conectar envía el JWT vigente, se suscribe y luego resincroniza con el board', async () => {
    service.connect(true);
    expect(fakeClient.activate).toHaveBeenCalled();
    await config.beforeConnect!(fakeClient as unknown as Client);
    expect(fakeClient.connectHeaders).toEqual({ Authorization: 'Bearer jwt-actual' });

    config.onConnect!({} as never);

    expect(fakeClient.subscribe.mock.calls.map(call => call[0])).toEqual([TOPIC_ORDERS, TOPIC_CATALOG]);
    expect(getBoard).toHaveBeenCalled();
    expect(service.connected()).toBe(true);
    expect(service.orders().map(o => o.id)).toEqual([1, 2]);
  });

  it('COCINA no se suscribe al catálogo', () => {
    service.connect(false);
    config.onConnect!({} as never);
    expect(fakeClient.subscribe.mock.calls.map(call => call[0])).toEqual([TOPIC_ORDERS]);
  });

  it('pierde la conexión → connected=false', () => {
    service.connect(false);
    config.onConnect!({} as never);
    config.onWebSocketClose!({} as never);
    expect(service.connected()).toBe(false);
  });

  it('ignora eventos con versión igual o menor (duplicados/desordenados)', () => {
    service.merge([board(2, 3)]);
    service.apply(event(board(2, 3, ORDER_STATUS.READY)));
    service.apply(event(board(2, 2, ORDER_STATUS.READY)));
    expect(service.orders()[0].status).toBe(ORDER_STATUS.PENDING);
    service.apply(event(board(2, 4, ORDER_STATUS.IN_PREPARATION)));
    expect(service.orders()[0].status).toBe(ORDER_STATUS.IN_PREPARATION);
  });

  it('retira entregados y cancelados, y no los revive un evento viejo', () => {
    service.merge([board(1, 1)]);
    service.apply(event(board(1, 5, ORDER_STATUS.DELIVERED)));
    expect(service.orders()).toEqual([]);
    service.apply(event(board(1, 4, ORDER_STATUS.READY)));
    expect(service.orders()).toEqual([]);
  });

  it('ORDER_CREATED marca lastCreated (sonido en cocina)', () => {
    const created = board(7, 0);
    service.apply(event(created, 'ORDER_CREATED'));
    expect(service.lastCreated()).toEqual(created);
    expect(service.orders().length).toBe(1);
  });

  it('el resync conserva la versión más nueva si un evento llegó antes que el board', () => {
    service.apply(event(board(2, 5, ORDER_STATUS.READY)));
    service.merge([board(2, 3)]);
    expect(service.orders()[0].version).toBe(5);
  });

  it('disconnect limpia el estado', () => {
    service.connect(false);
    service.merge([board(1, 0)]);
    service.disconnect();
    expect(fakeClient.deactivate).toHaveBeenCalled();
    expect(service.orders()).toEqual([]);
  });
});
