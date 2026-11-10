import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { HttpErrorHandlerService } from './http-error-handler.service';
import { LoginService } from './login.service';
import { MESSAGES } from '@core/constants/messages';

class LoginServiceStub {
  public logoutCalls: number = 0;
  public logout(): void { this.logoutCalls++; }
}

describe('HttpErrorHandlerService', () => {
  let service: HttpErrorHandlerService;
  let loginService: LoginServiceStub;

  const errorResponse = (status: number, url: string, message?: string) => new HttpErrorResponse({
    status,
    statusText: 'Error',
    url,
    error: { code: status, status: 'ERROR', message, path: new URL(url).pathname }
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HttpErrorHandlerService,
        MessageService,
        { provide: LoginService, useClass: LoginServiceStub }
      ]
    });
    service = TestBed.inject(HttpErrorHandlerService);
    loginService = TestBed.inject(LoginService) as unknown as LoginServiceStub;
  });

  it('un 401 en el login muestra el mensaje de credenciales del backend sin cerrar sesión', () => {
    const result = service.httpErrorFormatter(errorResponse(HttpStatusCode.Unauthorized, 'http://api/login', 'Usuario o contraseña incorrectos'));

    expect(result.errors).toEqual(['Usuario o contraseña incorrectos']);
    expect(loginService.logoutCalls).toBe(0);
  });

  it('un 401 en el login sin mensaje usa el texto por defecto de credenciales', () => {
    const result = service.httpErrorFormatter(errorResponse(HttpStatusCode.Unauthorized, 'http://api/login'));

    expect(result.errors).toEqual([MESSAGES.invalidCredentials]);
  });

  it('un 401 en otra ruta indica sesión expirada y cierra sesión', () => {
    const result = service.httpErrorFormatter(errorResponse(HttpStatusCode.Unauthorized, 'http://api/orders', 'Token inválido'));

    expect(result.errors).toEqual([MESSAGES.yourSessionExpiredLoginAgain]);
    expect(loginService.logoutCalls).toBe(1);
  });

  it('un 403 indica falta de permisos y NO cierra sesión (cambio respecto a la referencia)', () => {
    const result = service.httpErrorFormatter(errorResponse(HttpStatusCode.Forbidden, 'http://api/product/1'));

    expect(result.errors).toEqual([MESSAGES.accessDenied]);
    expect(loginService.logoutCalls).toBe(0);
  });

  it('un 409 muestra el mensaje de conflicto del backend', () => {
    const result = service.httpErrorFormatter(errorResponse(HttpStatusCode.Conflict, 'http://api/order/1/status', 'El registro fue modificado por otro usuario.'));

    expect(result.errors).toEqual(['El registro fue modificado por otro usuario.']);
  });

  it('sin conexión con el backend (status 0) no falla al leer el cuerpo vacío', () => {
    const result = service.httpErrorFormatter(new HttpErrorResponse({ status: 0, statusText: 'Unknown Error', url: 'http://api/login' }));

    expect(result.errors[0]).toContain('No se pudo conectar');
  });

  it('agrupa los errores de validación de campos', () => {
    const response = new HttpErrorResponse({
      status: HttpStatusCode.BadRequest, statusText: 'Bad Request', url: 'http://api/login',
      error: { code: 400, status: 'BAD_REQUEST', path: '/cdr/login',
        errors: [{ field: 'username', message: 'El nombre de usuario es obligatorio.', code: 'NotBlank' }] }
    });

    expect(service.httpErrorFormatter(response).errors).toEqual(['El nombre de usuario es obligatorio.']);
  });
});
