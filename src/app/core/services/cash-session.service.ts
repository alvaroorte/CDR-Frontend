import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '@core/environments/environment.development';
import { CashMovementRequest, CashSession } from '@core/models/cash-session';

/**
 * Caja del usuario autenticado: HTTP + estado compartido con signals (POS, pantalla de caja y
 * header leen el mismo signal). `current() === null` con `loaded() === true` = sin caja abierta.
 */
@Injectable({
  providedIn: 'root'
})
export class CashSessionService {

  private http = inject(HttpClient);
  private serverUrl: string = environment.server_url;

  private readonly _current = signal<CashSession | null>(null);
  private readonly _loaded = signal<boolean>(false);

  public readonly current = this._current.asReadonly();
  public readonly loaded = this._loaded.asReadonly();
  public readonly isOpen = computed(() => this._current() !== null);

  /** GET /cash-session/current: 204 → null. */
  public refresh(): Observable<CashSession | null> {
    return this.http.get<CashSession | null>(this.serverUrl + 'cash-session/current').pipe(
      map(session => session ?? null),
      tap(session => this.setCurrent(session))
    );
  }

  public open(openingAmount: number): Observable<CashSession> {
    return this.http.post<CashSession>(this.serverUrl + 'cash-session/open', { openingAmount }).pipe(
      tap(session => this.setCurrent(session))
    );
  }

  public registerMovement(body: CashMovementRequest): Observable<CashSession> {
    return this.http.post<CashSession>(this.serverUrl + 'cash-session/movement', body).pipe(
      tap(session => this.setCurrent(session))
    );
  }

  /** Al cerrar sesión de usuario. */
  public reset(): void {
    this._current.set(null);
    this._loaded.set(false);
  }

  private setCurrent(session: CashSession | null): void {
    this._current.set(session);
    this._loaded.set(true);
  }
}
