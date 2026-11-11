import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { type Mock } from 'vitest';
import { CASH_MOVEMENT_TYPE } from '@core/enums/cash-movement-type';
import { environment } from '@core/environments/environment.development';
import { CashSession } from '@core/models/cash-session';
import { CashSessionService } from '@core/services/cash-session.service';
import { HelpersService } from '@core/services/helpers.service';
import { CashRegisterComponent } from './cash-register.component';
import { signal } from '@angular/core';
import { ROLES_CODE_SYSTEM } from '@core/enums/roles';
import { LoginService } from '@core/services/login.service';
import { UserService } from '@modules/user/services/user.service';

const session = { id: 3, openingAmount: 100, expectedCash: 100, movements: [], salesByMethod: [] } as unknown as CashSession;

describe('CashSessionService', () => {
  let service: CashSessionService;
  let httpMock: HttpTestingController;
  const URL = `${environment.server_url}cash-session/`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CashSessionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('204 en /current = sin caja abierta', () => {
    service.refresh().subscribe();
    httpMock.expectOne(URL + 'current').flush(null, { status: 204, statusText: 'No Content' });
    expect(service.loaded()).toBe(true);
    expect(service.isOpen()).toBe(false);
  });

  it('open guarda la caja abierta en el estado compartido', () => {
    service.open(100).subscribe();
    const req = httpMock.expectOne(URL + 'open');
    expect(req.request.body).toEqual({ openingAmount: 100 });
    req.flush(session);
    expect(service.current()).toEqual(session);
    expect(service.isOpen()).toBe(true);
  });

  it('reset olvida la caja (cierre de sesión)', () => {
    service.refresh().subscribe();
    httpMock.expectOne(URL + 'current').flush(session);
    service.reset();
    expect(service.loaded()).toBe(false);
    expect(service.current()).toBeNull();
  });
});

describe('CashRegisterComponent', () => {
  let component: CashRegisterComponent;
  let cash: { refresh: Mock; open: Mock; registerMovement: Mock; getOpenSessions: Mock; getPageable: Mock };
  let helpers: { messageNotification: Mock };
  let modal: { open: Mock; close: Mock };
  const roles = signal<ROLES_CODE_SYSTEM[]>([ROLES_CODE_SYSTEM.CASHIER]);
  let modalClose: { open: Mock };
  let modalDetail: { open: Mock; show: Mock };

  beforeEach(() => {
    cash = {
      refresh: vi.fn().mockReturnValue(of(null)),
      getOpenSessions: vi.fn().mockReturnValue(of([{ id: 8, userId: 9 }, { id: 3, userId: 4 }])),
      getPageable: vi.fn().mockReturnValue(of({ content: [], totalElements: 0 })),
      open: vi.fn().mockReturnValue(of(session)),
      registerMovement: vi.fn().mockReturnValue(of(session)),
    };
    helpers = { messageNotification: vi.fn() };
    modal = { open: vi.fn(), close: vi.fn() };
    modalClose = { open: vi.fn() };
    modalDetail = { open: vi.fn(), show: vi.fn() };
    roles.set([ROLES_CODE_SYSTEM.CASHIER]);
    TestBed.configureTestingModule({
      providers: [
        { provide: CashSessionService, useValue: cash },
        { provide: HelpersService, useValue: helpers },
        { provide: LoginService, useValue: { rolesUser: roles, userId: signal(4) } },
        { provide: UserService, useValue: { getAll: vi.fn().mockReturnValue(of([{ id: 4, fullName: 'María Caja', username: 'maria.caja' }])) } },
      ]
    });
    component = TestBed.runInInjectionContext(() => new CashRegisterComponent());
    (component as unknown as Record<string, unknown>)['modalMovement'] = () => modal;
    (component as unknown as Record<string, unknown>)['modalClose'] = () => modalClose;
    (component as unknown as Record<string, unknown>)['modalDetail'] = () => modalDetail;
  });

  it('no abre la caja sin monto de apertura', () => {
    component.open();
    expect(cash.open).not.toHaveBeenCalled();
  });

  it('abre la caja con el monto indicado (0 es válido)', () => {
    component.formOpen.controls.openingAmount.setValue(0);
    component.open();
    expect(cash.open).toHaveBeenCalledWith(0);
    expect(helpers.messageNotification).toHaveBeenCalledWith('success', expect.any(String), expect.any(String));
  });

  it('registra un egreso y cierra el modal', () => {
    component.registerMovement({ type: CASH_MOVEMENT_TYPE.EXPENSE, amount: 4.5, description: 'Hielo' });
    expect(cash.registerMovement).toHaveBeenCalledWith({ type: CASH_MOVEMENT_TYPE.EXPENSE, amount: 4.5, description: 'Hielo' });
    expect(modal.close).toHaveBeenCalled();
    expect(component.savingMovement()).toBe(false);
  });

  it('egresos y devoluciones restan; la apertura es neutra', () => {
    expect(component.isOutflow(CASH_MOVEMENT_TYPE.EXPENSE)).toBe(true);
    expect(component.isOutflow(CASH_MOVEMENT_TYPE.REFUND)).toBe(true);
    expect(component.isOutflow(CASH_MOVEMENT_TYPE.SALE)).toBe(false);
    expect(component.isOpening(CASH_MOVEMENT_TYPE.OPENING)).toBe(true);
  });

  it('cerrar caja abre el arqueo de esa sesión y al terminar muestra el detalle', () => {
    component.startClose(3);
    expect(modalClose.open).toHaveBeenCalledWith(3);
    component.onClosed(session);
    expect(modalDetail.show).toHaveBeenCalledWith(session);
  });

  it('el ADMIN carga las cajas abiertas de OTROS usuarios', () => {
    roles.set([ROLES_CODE_SYSTEM.ADMIN]);
    component.ngOnInit();
    expect(component.otherOpenSessions().map(s => s.id)).toEqual([8]);
    expect(component.users()).toEqual([{ id: 4, name: 'María Caja (maria.caja)' }]);
  });

  it('el CAJERO no envía filtro de usuario en el historial', () => {
    component.formFilter.setValue({ dates: [new Date(2026, 10, 1), new Date(2026, 10, 11)], status: 'CLOSED', userId: 9 });
    expect(component.buildFilter()).toEqual({ dateFrom: '2026-11-01', dateTo: '2026-11-11', status: 'CLOSED', userId: null });
    component.loadHistory({ first: 10, rows: 10 });
    expect(cash.getPageable).toHaveBeenCalledWith(1, 10, expect.any(Object));
  });
});
