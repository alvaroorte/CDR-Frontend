import { TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { Observable, Subject, throwError } from 'rxjs';
import { HeaderInterceptor } from './header.interceptor';
import { LoginService } from '@core/services/login.service';
import { HttpErrorHandlerService } from '@core/services/http-error-handler.service';
import { LocalStorageService } from '@core/services/local-storage.service';
import { LOCAL_STORAGE } from '@core/constants/local-storage';
import { CLIENT_PLATFORM } from '@core/constants/http-headers';
import { LoginResponse } from '@core/models/login';

class LocalStorageStub {
  private store = new Map<string, string>();
  public get(key: string): string | null { return this.store.get(key) ?? null; }
  public set(key: string, value: string): void { this.store.set(key, value); }
  public remove(key: string): void { this.store.delete(key); }
  public removeAll(): void { this.store.clear(); }
}

class LoginServiceStub {
  public refresh$ = new Subject<LoginResponse>();
  public refreshCalls: number = 0;
  public logoutCalls: number = 0;
  public storage!: LocalStorageStub;

  public refreshToken(): Observable<LoginResponse> {
    this.refreshCalls++;
    return this.refresh$.asObservable();
  }

  public setSession(response: LoginResponse): void {
    this.storage.set(LOCAL_STORAGE.TOKEN, response.token);
    this.storage.set(LOCAL_STORAGE.REFRESH_TOKEN, response.refreshToken);
  }

  public logout(): void { this.logoutCalls++; }
}

class HttpErrorHandlerStub {
  public handled: HttpErrorResponse[] = [];

  public handleAndThrow(error: HttpErrorResponse): Observable<never> {
    this.handled.push(error);
    return throwError(() => error);
  }
}

describe('HeaderInterceptor', () => {

  const API_URL = 'http://localhost/cdr/';
  const unauthorized = { status: 401, statusText: 'Unauthorized' };
  const renewedSession: LoginResponse = {
    token: 'jwt-nuevo', refreshToken: 'refresh-2', username: 'juan', message: 'Token renovado'
  };

  let http: HttpClient;
  let httpMock: HttpTestingController;
  let storage: LocalStorageStub;
  let loginService: LoginServiceStub;
  let errorHandler: HttpErrorHandlerStub;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: LocalStorageService, useClass: LocalStorageStub },
        { provide: LoginService, useClass: LoginServiceStub },
        { provide: HttpErrorHandlerService, useClass: HttpErrorHandlerStub },
        { provide: HTTP_INTERCEPTORS, useClass: HeaderInterceptor, multi: true }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    storage = TestBed.inject(LocalStorageService) as unknown as LocalStorageStub;
    loginService = TestBed.inject(LoginService) as unknown as LoginServiceStub;
    loginService.storage = storage;
    errorHandler = TestBed.inject(HttpErrorHandlerService) as unknown as HttpErrorHandlerStub;
  });

  afterEach(() => httpMock.verify());

  /** El interceptor persiste el par renovado llamando a `LoginService.setSession()`. */
  const emitRenewedSession = () => loginService.refresh$.next(renewedSession);

  const givenActiveSession = () => {
    storage.set(LOCAL_STORAGE.TOKEN, 'jwt-viejo');
    storage.set(LOCAL_STORAGE.REFRESH_TOKEN, 'refresh-1');
  };

  it('agrega el header Authorization con el token almacenado', () => {
    givenActiveSession();

    http.get(`${API_URL}tickets`).subscribe();

    const request = httpMock.expectOne(`${API_URL}tickets`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-viejo');
    request.flush({});
  });

  it('identifica el canal web con el header X-Client-Platform', () => {
    givenActiveSession();

    http.get(`${API_URL}tickets`).subscribe();

    const request = httpMock.expectOne(`${API_URL}tickets`);
    expect(request.request.headers.get(CLIENT_PLATFORM.HEADER)).toBe('WEB');
    request.flush({});
  });

  it('mantiene el header X-Client-Platform al reintentar tras renovar el token', () => {
    givenActiveSession();

    http.get(`${API_URL}tickets`).subscribe();
    httpMock.expectOne(`${API_URL}tickets`).flush({}, unauthorized);
    emitRenewedSession();

    const retry = httpMock.expectOne(`${API_URL}tickets`);
    expect(retry.request.headers.get(CLIENT_PLATFORM.HEADER)).toBe('WEB');
    retry.flush({});
  });

  it('ante un 401 renueva el token y reintenta la petición original con el token nuevo', () => {
    givenActiveSession();
    let result: unknown = null;

    http.get(`${API_URL}tickets`).subscribe((response) => result = response);

    httpMock.expectOne(`${API_URL}tickets`).flush({}, unauthorized);
    expect(loginService.refreshCalls).toBe(1);

    emitRenewedSession();

    const retry = httpMock.expectOne(`${API_URL}tickets`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer jwt-nuevo');
    retry.flush({ id: 1 });

    expect(result).toEqual({ id: 1 });
    expect(errorHandler.handled.length).toBe(0);
  });

  it('lanza una sola renovación aunque varias peticiones fallen en paralelo', () => {
    givenActiveSession();

    http.get(`${API_URL}tickets`).subscribe();
    http.get(`${API_URL}notifications`).subscribe();
    http.get(`${API_URL}users/me`).subscribe();

    const failed: TestRequest[] = httpMock.match(() => true);
    expect(failed.length).toBe(3);
    failed.forEach((request: TestRequest) => request.flush({}, unauthorized));

    // El backend rota el refresh token: una segunda renovación concurrente usaría uno ya revocado.
    expect(loginService.refreshCalls).toBe(1);

    emitRenewedSession();

    const retried: TestRequest[] = httpMock.match(() => true);
    expect(retried.length).toBe(3);
    retried.forEach((request: TestRequest) => {
      expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-nuevo');
      request.flush({});
    });
  });

  it('cierra la sesión una sola vez y propaga el error a todas las peticiones en espera si la renovación falla', () => {
    givenActiveSession();
    const errors: HttpErrorResponse[] = [];

    http.get(`${API_URL}tickets`).subscribe({ error: (error) => errors.push(error) });
    http.get(`${API_URL}notifications`).subscribe({ error: (error) => errors.push(error) });

    httpMock.match(() => true).forEach((request: TestRequest) => request.flush({}, unauthorized));
    expect(loginService.refreshCalls).toBe(1);

    loginService.refresh$.error(new HttpErrorResponse(unauthorized));

    // Ninguna petición debe quedar colgada esperando un token que nunca llegará.
    expect(errors.length).toBe(2);
    expect(loginService.logoutCalls).toBe(1);
    expect(errorHandler.handled.length).toBe(1);
  });

  it('permite renovar de nuevo en una sesión posterior tras una renovación fallida', () => {
    givenActiveSession();

    http.get(`${API_URL}tickets`).subscribe({ error: () => null });
    httpMock.expectOne(`${API_URL}tickets`).flush({}, unauthorized);
    loginService.refresh$.error(new HttpErrorResponse(unauthorized));

    // Nuevo login: el observable compartido debió liberarse.
    loginService.refresh$ = new Subject<LoginResponse>();
    givenActiveSession();

    http.get(`${API_URL}tickets`).subscribe();
    httpMock.expectOne(`${API_URL}tickets`).flush({}, unauthorized);

    expect(loginService.refreshCalls).toBe(2);
    emitRenewedSession();
    httpMock.expectOne(`${API_URL}tickets`).flush({});
  });

  it('no intenta renovar si no hay refresh token almacenado', () => {
    storage.set(LOCAL_STORAGE.TOKEN, 'jwt-viejo');
    let error: HttpErrorResponse | null = null;

    http.get(`${API_URL}tickets`).subscribe({ error: (err) => error = err });
    httpMock.expectOne(`${API_URL}tickets`).flush({}, unauthorized);

    expect(loginService.refreshCalls).toBe(0);
    expect(errorHandler.handled.length).toBe(1);
    expect(error).toBeTruthy();
  });

  it('no intenta renovar ante un 401 de login ni de auth/refresh', () => {
    givenActiveSession();

    http.post(`${API_URL}login`, {}).subscribe({ error: () => null });
    httpMock.expectOne(`${API_URL}login`).flush({}, unauthorized);

    http.post(`${API_URL}auth/refresh`, {}).subscribe({ error: () => null });
    httpMock.expectOne(`${API_URL}auth/refresh`).flush({}, unauthorized);

    expect(loginService.refreshCalls).toBe(0);
    expect(errorHandler.handled.length).toBe(2);
  });

  it('no intenta renovar ante un 403, que es denegación de permisos y no token expirado', () => {
    givenActiveSession();

    http.get(`${API_URL}tickets`).subscribe({ error: () => null });
    httpMock.expectOne(`${API_URL}tickets`).flush({}, { status: 403, statusText: 'Forbidden' });

    expect(loginService.refreshCalls).toBe(0);
    expect(errorHandler.handled.length).toBe(1);
  });
});
