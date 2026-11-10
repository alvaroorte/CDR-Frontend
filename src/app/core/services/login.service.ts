import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, of, throwError } from 'rxjs';
import { LoginRequest, LoginResponse, UserInfo } from '@core/models/login';
import { environment } from '@core/environments/environment.development';
import { LocalStorageService } from './local-storage.service';
import { LOCAL_STORAGE } from '@core/constants/local-storage';
import { LABELS } from '@core/constants/labels';
import { AuthenticatedUser } from '@core/interfaces/authenticated-user';
import { ROLES_CODE_SYSTEM } from '@core/enums/roles';

/**
 * Estado de autenticación con signals (patrón de la referencia).
 * Cambios: sin empresa ni servicio de usuarios; datos y roles frescos desde GET /users/me;
 * sin EventEmitter (los consumidores reaccionan a los signals).
 */
@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private http = inject(HttpClient);
  private httpWithoutInterceptors = new HttpClient(inject(HttpBackend));
  private router = inject(Router);
  private localStorageService = inject(LocalStorageService);
  private serverUrl: string = environment.server_url;

  public user = signal<string>(LABELS.getInto);
  public fullName = signal<string>('');
  public userId = signal<number | null>(null);
  public rolesUser = signal<ROLES_CODE_SYSTEM[]>([]);
  public readonly isLoggedIn = computed(() => this.userId() !== null);

  public login(user: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.serverUrl + 'login', user);
  }

  public refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.localStorageService.get(LOCAL_STORAGE.REFRESH_TOKEN);
    if (refreshToken) {
      return this.httpWithoutInterceptors.post<LoginResponse>(this.serverUrl + 'auth/refresh', { refreshToken });
    }
    return throwError(() => new Error('No hay refresh token almacenado'));
  }

  public setSession(response: LoginResponse): void {
    this.localStorageService.set(LOCAL_STORAGE.TOKEN, response.token);
    this.localStorageService.set(LOCAL_STORAGE.REFRESH_TOKEN, response.refreshToken);
  }

  /** Decodifica el JWT una sola vez (como la referencia) y refresca datos/roles desde el backend. */
  public setUser(): void {
    const token = this.localStorageService.get(LOCAL_STORAGE.TOKEN);
    if (!token) {
      this.clearUser();
      return;
    }
    try {
      const authenticatedUser: AuthenticatedUser = JSON.parse(atob(token.split('.')[1]));
      this.userId.set(authenticatedUser.userId);
      this.rolesUser.set(authenticatedUser.authorities ?? []);
      this.user.set(authenticatedUser.sub);
      this.fullName.set(authenticatedUser.fullName ?? authenticatedUser.sub);
      this.loadCurrentUser();
    } catch {
      this.logout();
    }
  }

  public logout(): void {
    this.revokeRefreshToken();
    const theme = this.localStorageService.get(LOCAL_STORAGE.THEME);
    this.localStorageService.removeAll();
    if (theme) {
      this.localStorageService.set(LOCAL_STORAGE.THEME, theme);
    }
    this.clearUser();
    this.router.navigate(['/login']);
  }

  public haveSomeRole(roles: readonly ROLES_CODE_SYSTEM[]): boolean {
    return roles.some(role => this.rolesUser().includes(role));
  }

  /** Pantalla inicial tras el login. Etapa 1: 'inicio' para todos los roles. */
  public homeRoute(): string {
    return '/inicio';
  }

  private loadCurrentUser(): void {
    this.http.get<UserInfo>(this.serverUrl + 'users/me').subscribe({
      next: (info) => {
        this.fullName.set(info.fullName);
        this.rolesUser.set(info.roles.map(role => role.code as ROLES_CODE_SYSTEM));
      }
    });
  }

  private clearUser(): void {
    this.user.set(LABELS.getInto);
    this.fullName.set('');
    this.userId.set(null);
    this.rolesUser.set([]);
  }

  private revokeRefreshToken(): void {
    const refreshToken = this.localStorageService.get(LOCAL_STORAGE.REFRESH_TOKEN);
    if (refreshToken) {
      this.httpWithoutInterceptors.post<void>(this.serverUrl + 'auth/logout', { refreshToken })
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
  }
}
