import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { LoginService } from './login.service';
import { LocalStorageService } from './local-storage.service';
import { LOCAL_STORAGE } from '@core/constants/local-storage';
import { LoginResponse, UserInfo } from '@core/models/login';
import { environment } from '@core/environments/environment.development';
import { ROLES_CODE_SYSTEM } from '@core/enums/roles';

class LocalStorageStub {
  private store = new Map<string, string>();
  public get(key: string): string | null { return this.store.get(key) ?? null; }
  public set(key: string, value: string): void { this.store.set(key, value); }
  public remove(key: string): void { this.store.delete(key); }
  public removeAll(): void { this.store.clear(); }
}

/** JWT sin firma válida: el frontend solo decodifica el payload (igual que la referencia). */
const fakeJwt = (payload: object): string =>
  `header.${btoa(JSON.stringify(payload))}.signature`;

describe('LoginService', () => {

  const REFRESH_URL = `${environment.server_url}auth/refresh`;
  const LOGOUT_URL = `${environment.server_url}auth/logout`;
  const ME_URL = `${environment.server_url}users/me`;
  const renewedSession: LoginResponse = {
    token: 'jwt-nuevo', refreshToken: 'refresh-2', username: 'maria.caja', message: 'Token renovado'
  };

  let service: LoginService;
  let httpMock: HttpTestingController;
  let storage: LocalStorageStub;
  let navigations: unknown[][];

  beforeEach(() => {
    navigations = [];
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LocalStorageService, useClass: LocalStorageStub },
        { provide: Router, useValue: { navigate: (commands: unknown[]) => { navigations.push(commands); return Promise.resolve(true); } } },
      ]
    });

    service = TestBed.inject(LoginService);
    httpMock = TestBed.inject(HttpTestingController);
    storage = TestBed.inject(LocalStorageService) as unknown as LocalStorageStub;
  });

  afterEach(() => httpMock.verify());

  it('envía el refresh token almacenado y devuelve el par rotado del backend', () => {
    storage.set(LOCAL_STORAGE.TOKEN, 'jwt-viejo');
    storage.set(LOCAL_STORAGE.REFRESH_TOKEN, 'refresh-1');
    let result: LoginResponse | null = null;

    service.refreshToken().subscribe((response: LoginResponse) => result = response);

    const request = httpMock.expectOne(REFRESH_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ refreshToken: 'refresh-1' });
    request.flush(renewedSession);

    expect(result).toEqual(renewedSession);
  });

  it('setSession persiste el par de tokens', () => {
    service.setSession(renewedSession);

    expect(storage.get(LOCAL_STORAGE.TOKEN)).toBe('jwt-nuevo');
    expect(storage.get(LOCAL_STORAGE.REFRESH_TOKEN)).toBe('refresh-2');
  });

  it('la petición de renovación no lleva header Authorization porque omite los interceptores', () => {
    storage.set(LOCAL_STORAGE.REFRESH_TOKEN, 'refresh-1');

    service.refreshToken().subscribe();

    const request = httpMock.expectOne(REFRESH_URL);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush(renewedSession);
  });

  it('falla sin llamar al backend si no hay refresh token almacenado', () => {
    let error: Error | null = null;

    service.refreshToken().subscribe({ error: (err) => error = err });

    expect(error).toBeTruthy();
    httpMock.expectNone(REFRESH_URL);
  });

  it('setUser decodifica el JWT y luego refresca nombre y roles desde /users/me', () => {
    storage.set(LOCAL_STORAGE.TOKEN, fakeJwt({ sub: 'maria.caja', userId: 7, fullName: 'María', authorities: ['CAJERO'] }));

    service.setUser();

    expect(service.userId()).toBe(7);
    expect(service.user()).toBe('maria.caja');
    expect(service.rolesUser()).toEqual([ROLES_CODE_SYSTEM.CASHIER]);
    expect(service.isLoggedIn()).toBe(true);

    const me: UserInfo = {
      id: 7, username: 'maria.caja', fullName: 'María Caja', email: null,
      roles: [{ id: 2, name: 'Cajero', code: 'CAJERO' }, { id: 1, name: 'Administrador', code: 'ADMIN' }]
    };
    httpMock.expectOne(ME_URL).flush(me);

    expect(service.fullName()).toBe('María Caja');
    expect(service.rolesUser()).toEqual([ROLES_CODE_SYSTEM.CASHIER, ROLES_CODE_SYSTEM.ADMIN]);
  });

  it('setUser con un token corrupto cierra la sesión', () => {
    storage.set(LOCAL_STORAGE.TOKEN, 'no-es-un-jwt');

    service.setUser();

    expect(service.isLoggedIn()).toBe(false);
    expect(navigations).toEqual([['/login']]);
  });

  it('haveSomeRole indica si el usuario tiene alguno de los roles', () => {
    service.rolesUser.set([ROLES_CODE_SYSTEM.KITCHEN]);

    expect(service.haveSomeRole([ROLES_CODE_SYSTEM.ADMIN, ROLES_CODE_SYSTEM.KITCHEN])).toBe(true);
    expect(service.haveSomeRole([ROLES_CODE_SYSTEM.CASHIER])).toBe(false);
  });

  it('revoca el refresh token en el servidor al cerrar sesión y conserva el tema', () => {
    storage.set(LOCAL_STORAGE.TOKEN, 'jwt-viejo');
    storage.set(LOCAL_STORAGE.REFRESH_TOKEN, 'refresh-1');
    storage.set(LOCAL_STORAGE.THEME, 'dark');

    service.logout();

    const request = httpMock.expectOne(LOGOUT_URL);
    expect(request.request.body).toEqual({ refreshToken: 'refresh-1' });
    request.flush(null);

    expect(storage.get(LOCAL_STORAGE.TOKEN)).toBeNull();
    expect(storage.get(LOCAL_STORAGE.REFRESH_TOKEN)).toBeNull();
    expect(storage.get(LOCAL_STORAGE.THEME)).toBe('dark');
    expect(navigations).toEqual([['/login']]);
  });

  it('cierra la sesión localmente aunque falle la revocación en el servidor', () => {
    storage.set(LOCAL_STORAGE.TOKEN, 'jwt-viejo');
    storage.set(LOCAL_STORAGE.REFRESH_TOKEN, 'refresh-1');

    service.logout();
    httpMock.expectOne(LOGOUT_URL).flush({}, { status: 500, statusText: 'Server Error' });

    expect(storage.get(LOCAL_STORAGE.TOKEN)).toBeNull();
    expect(storage.get(LOCAL_STORAGE.REFRESH_TOKEN)).toBeNull();
  });

  it('no llama a auth/logout si no hay refresh token', () => {
    service.logout();

    httpMock.expectNone(LOGOUT_URL);
    expect(httpMock.match(() => true).length).toBe(0);
  });

  it('homeRoute: quien cobra va al POS, COCINA al tablero, el resto a /404', () => {
    service.rolesUser.set([ROLES_CODE_SYSTEM.CASHIER]);
    expect(service.homeRoute()).toBe('/pos');
    service.rolesUser.set([ROLES_CODE_SYSTEM.ADMIN]);
    expect(service.homeRoute()).toBe('/pos');
    service.rolesUser.set([ROLES_CODE_SYSTEM.KITCHEN]);
    expect(service.homeRoute()).toBe('/kitchen');
    service.rolesUser.set([]);
    expect(service.homeRoute()).toBe('/404');
  });
});
