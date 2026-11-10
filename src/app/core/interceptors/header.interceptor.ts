import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Observable, catchError, finalize, shareReplay, switchMap, take, tap } from 'rxjs';
import { LOCAL_STORAGE } from '@core/constants/local-storage';
import { CLIENT_PLATFORM } from '@core/constants/http-headers';
import { LocalStorageService } from '@core/services/local-storage.service';
import { HttpErrorHandlerService } from '@core/services/http-error-handler.service';
import { LoginService } from '@core/services/login.service';
import { LoginResponse } from '@core/models/login';

/**
 * Rutas de autenticación que nunca deben disparar una renovación: `login` porque un 401 ahí son
 * credenciales incorrectas, y `auth/*` para no reentrar en el propio flujo de refresh.
 */
const AUTH_URLS: string[] = ['login', 'auth/refresh', 'auth/logout'];

/** Copiado de la referencia: Bearer + renovación compartida del token ante 401 + reintento. */
@Injectable()
export class HeaderInterceptor implements HttpInterceptor {

  private localStorageService = inject(LocalStorageService);
  private httpErrorHandlerService = inject(HttpErrorHandlerService);
  private loginService = inject(LoginService);

  private refreshRequest$: Observable<LoginResponse> | null = null;

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(this.addToken(request)).pipe(
      catchError((error: HttpErrorResponse): Observable<HttpEvent<unknown>> => {
        if (error.status == HttpStatusCode.Unauthorized && this.canRefresh(request)) {
          return this.tryRefreshToken(request, next);
        }
        return this.httpErrorHandlerService.handleAndThrow(error);
      })
    );
  }

  private tryRefreshToken(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Solo la primera petición en fallar crea la renovación; el resto se engancha a la misma. El
    // backend rota el refresh token, así que dos renovaciones concurrentes harían que la segunda
    // usara uno ya revocado y terminara cerrando la sesión.
    if (!this.refreshRequest$) {
      this.refreshRequest$ = this.loginService.refreshToken().pipe(
        tap((response: LoginResponse) => this.loginService.setSession(response)),
        catchError((refreshError: HttpErrorResponse): Observable<never> => {
          this.loginService.logout();
          return this.httpErrorHandlerService.handleAndThrow(refreshError);
        }),
        finalize(() => { this.refreshRequest$ = null; }),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }

    return this.refreshRequest$.pipe(take(1),
      switchMap(() => next.handle(this.addToken(request)))
    );
  }

  private addToken(request: HttpRequest<unknown>): HttpRequest<unknown> {
    const token = this.localStorageService.get(LOCAL_STORAGE.TOKEN);
    const headers: Record<string, string> = { [CLIENT_PLATFORM.HEADER]: CLIENT_PLATFORM.WEB };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return request.clone({ setHeaders: headers });
  }

  private canRefresh(request: HttpRequest<unknown>): boolean {
    const refreshToken = this.localStorageService.get(LOCAL_STORAGE.REFRESH_TOKEN);
    return !!refreshToken && !AUTH_URLS.some((url: string) => request.url.endsWith(url));
  }
}
