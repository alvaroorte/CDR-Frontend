import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { APIErrorBase, CustomValidationError, DtoValidationError, EntityValidatorMultipleError, FormattedHttpError } from '../interfaces/http-error-handling.interface';
import { LoginService } from './login.service';
import { MESSAGES } from '@core/constants/messages';

/**
 * Formatea y muestra los errores HTTP como toasts (copiado de la referencia).
 * Cambios: 403 = sin permiso (NO cierra sesión: en este sistema el 403 lo emite AuthorizationFilter
 * por rol); sin caso 402 (no hay licencia); tolera respuestas sin cuerpo (backend caído, status 0).
 */
@Injectable({
  providedIn: 'root',
})
export class HttpErrorHandlerService {

  private messageService = inject(MessageService);
  private loginService = inject(LoginService);

  public handleAndThrow(httpErrorResponse: HttpErrorResponse): Observable<never> {
    const formattedError = this.httpErrorFormatter(httpErrorResponse);
    this.displayErrors(formattedError.errors);
    return throwError(() => formattedError);
  }

  public httpErrorFormatter(httpErrorResponse: HttpErrorResponse): FormattedHttpError {
    const apiErrorBase: APIErrorBase = this.parseBody(httpErrorResponse);
    const base = { code: httpErrorResponse.status, status: httpErrorResponse.statusText, path: apiErrorBase.path ?? '/' };

    switch (httpErrorResponse.status) {
      case 0:
        return { ...base, errors: ['No se pudo conectar con el servidor. Verifique su conexión.'] };
      case HttpStatusCode.InternalServerError:
        return { ...base, errors: [this.shortMessage(apiErrorBase) ?? 'Error Interno del Servidor'] };
      case HttpStatusCode.Forbidden:
        return { ...base, errors: [MESSAGES.accessDenied] };
      case HttpStatusCode.Unauthorized:
        // Un 401 en el login son credenciales incorrectas (o usuario deshabilitado), no una sesión expirada.
        if (this.isLoginRequest(httpErrorResponse)) {
          return { ...base, errors: [apiErrorBase.message ?? MESSAGES.invalidCredentials] };
        }
        this.loginService.logout();
        return { ...base, errors: [MESSAGES.yourSessionExpiredLoginAgain] };
      case HttpStatusCode.NotFound:
        return { ...base, errors: [apiErrorBase.message ?? apiErrorBase.error ?? 'Ruta no encontrada.'] };
      default:
        break;
    }

    const errors: string[] = [];
    if (apiErrorBase.message) {
      errors.push(apiErrorBase.message);
    }
    if (apiErrorBase.errors) {
      errors.push(...apiErrorBase.errors.map((error: DtoValidationError) => error.message));
    }
    if (apiErrorBase.errorList) {
      if (this.isCustomValidationErrorArray(apiErrorBase.errorList)) {
        errors.push(this.convertArrayToPlainTextList(apiErrorBase.errorList));
      } else {
        errors.push(...(apiErrorBase.errorList as EntityValidatorMultipleError[]).map((error: EntityValidatorMultipleError) => error.message));
      }
    }
    return {
      code: apiErrorBase.code ?? httpErrorResponse.status,
      status: apiErrorBase.status ?? httpErrorResponse.statusText,
      path: apiErrorBase.path,
      errors
    };
  }

  private parseBody(httpErrorResponse: HttpErrorResponse): APIErrorBase {
    const body: unknown = httpErrorResponse.error;
    if (typeof body === 'string') {
      try {
        return JSON.parse(body) as APIErrorBase;
      } catch {
        return {} as APIErrorBase;
      }
    }
    return (body && typeof body === 'object' ? body : {}) as APIErrorBase;
  }

  private shortMessage(apiErrorBase: APIErrorBase): string | undefined {
    const message = apiErrorBase.message ?? apiErrorBase.error;
    return message && message.length < 120 ? message : undefined;
  }

  private isLoginRequest(httpErrorResponse: HttpErrorResponse): boolean {
    return !!httpErrorResponse.url?.endsWith('/login');
  }

  private convertArrayToPlainTextList(details: CustomValidationError[]): string {
    return details.map((error: CustomValidationError) => `• ${error.message}`).join('\n');
  }

  private isCustomValidationErrorArray(obj: unknown): obj is CustomValidationError[] {
    return Array.isArray(obj) && obj.every(item =>
      typeof item.field === 'string' && typeof item.message === 'string' && typeof item.code === 'string');
  }

  private displayErrors(errors: string[]): void {
    errors.forEach((message: string) =>
      this.messageService.add({ severity: 'error', detail: message, life: 3000 })
    );
  }
}
