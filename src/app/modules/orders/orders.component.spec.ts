import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { type Mock } from 'vitest';
import { ORDER_STATUS } from '@core/enums/order-status';
import { ROLES_CODE_SYSTEM } from '@core/enums/roles';
import { SERVICE_TYPE } from '@core/enums/service-type';
import { OrderBoard } from '@core/models/order';
import { CashSessionService } from '@core/services/cash-session.service';
import { HelpersService } from '@core/services/helpers.service';
import { LoginService } from '@core/services/login.service';
import { OrderService } from '@core/services/order.service';
import { OrderWsService } from '@core/services/order-ws.service';
import { OrdersComponent, toIsoDate } from './orders.component';

const order = (id: number, status: ORDER_STATUS): OrderBoard => ({
  id, code: id, codeLabel: `#00${id}`, serviceType: SERVICE_TYPE.TAKEAWAY, serviceTypeLabel: 'Para llevar',
  tableMarkerNumber: null, customerName: null, status, statusLabel: status, total: 15, version: 2,
  createdAt: '2026-11-11T10:00:00', createdBy: 'maria.caja', statusChangedAt: null, items: []
});

describe('OrdersComponent', () => {
  let component: OrdersComponent;
  let orderService: { changeStatus: Mock; cancel: Mock; getPageable: Mock };
  let ws: { orders: ReturnType<typeof signal<OrderBoard[]>>; resync: Mock; connected: () => boolean };
  const roles = signal<ROLES_CODE_SYSTEM[]>([ROLES_CODE_SYSTEM.CASHIER]);
  let cancelModal: { open: Mock; close: Mock };

  beforeEach(() => {
    roles.set([ROLES_CODE_SYSTEM.CASHIER]);
    orderService = {
      changeStatus: vi.fn().mockReturnValue(of({})),
      cancel: vi.fn().mockReturnValue(of({})),
      getPageable: vi.fn().mockReturnValue(of({ content: [], totalElements: 0 })),
    };
    ws = { orders: signal([order(1, ORDER_STATUS.PENDING), order(2, ORDER_STATUS.READY)]), resync: vi.fn(), connected: () => true };
    cancelModal = { open: vi.fn(), close: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: OrderService, useValue: orderService },
        { provide: OrderWsService, useValue: ws },
        { provide: LoginService, useValue: { rolesUser: roles } },
        { provide: CashSessionService, useValue: { refresh: vi.fn().mockReturnValue(of(null)) } },
        { provide: HelpersService, useValue: { messageNotification: vi.fn() } },
      ]
    });
    component = TestBed.runInInjectionContext(() => new OrdersComponent());
    (component as unknown as Record<string, unknown>)['cancelModal'] = () => cancelModal;
  });

  it('muestra primero los pedidos listos para entregar', () => {
    expect(component.liveOrders().map(o => o.id)).toEqual([2, 1]);
  });

  it('el CAJERO solo cancela pendientes; el ADMIN cualquier abierto', () => {
    expect(component.canCancel(ORDER_STATUS.PENDING)).toBe(true);
    expect(component.canCancel(ORDER_STATUS.READY)).toBe(false);
    roles.set([ROLES_CODE_SYSTEM.ADMIN]);
    expect(component.canCancel(ORDER_STATUS.READY)).toBe(true);
    expect(component.canCancel(ORDER_STATUS.DELIVERED)).toBe(false);
  });

  it('entregar envía la versión vista', () => {
    component.deliver(order(2, ORDER_STATUS.READY));
    expect(orderService.changeStatus).toHaveBeenCalledWith(2, ORDER_STATUS.DELIVERED, 2);
  });

  it('409 al entregar resincroniza', () => {
    orderService.changeStatus.mockReturnValue(throwError(() => ({ code: 409, errors: [] })));
    component.deliver(order(2, ORDER_STATUS.READY));
    expect(ws.resync).toHaveBeenCalled();
  });

  it('cancelar envía motivo y versión y cierra el modal', () => {
    component.cancel({ target: { id: 1, codeLabel: '#001', version: 2, total: 15 }, reason: 'Cliente se retiró' });
    expect(orderService.cancel).toHaveBeenCalledWith(1, 'Cliente se retiró', 2);
    expect(cancelModal.close).toHaveBeenCalled();
    expect(component.cancelling()).toBe(false);
  });

  it('el filtro del historial convierte el rango de fechas', () => {
    component.formFilter.setValue({ dates: [new Date(2026, 10, 1), new Date(2026, 10, 11)], status: ORDER_STATUS.CANCELLED,
      serviceType: null, code: null });
    expect(component.buildFilter()).toEqual({ dateFrom: '2026-11-01', dateTo: '2026-11-11', status: ORDER_STATUS.CANCELLED,
      serviceType: null, code: null });
  });

  it('un solo día en el rango usa la misma fecha como fin', () => {
    component.formFilter.controls.dates.setValue([new Date(2026, 10, 5)]);
    expect(component.buildFilter().dateTo).toBe('2026-11-05');
    expect(toIsoDate(null)).toBeNull();
  });

  it('loadHistory calcula la página', () => {
    component.loadHistory({ first: 20, rows: 10 });
    expect(orderService.getPageable).toHaveBeenCalledWith(2, 10, expect.any(Object));
  });
});
