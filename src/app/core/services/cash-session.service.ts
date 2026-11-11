import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '@core/environments/environment.development';
import { IPageable } from '@core/interfaces/pageable.interface';
import {
  CashClosePreview, CashCloseRequest, CashMovementRequest, CashSession, CashSessionFilter, CashSessionListItem
} from '@core/models/cash-session';

/**
 * Caja del usuario autenticado: HTTP + estado compartido con signals (POS, pantalla de caja y
 * header leen el mismo signal). `current() === null` con `loaded() === true` = sin caja abierta.
 * Etapa 5: arqueo, cierre, historial y cajas abiertas (ADMIN).
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

  /** Esperado por medio y pedidos sin entregar (dueño o ADMIN). */
  public getClosePreview(id: number): Observable<CashClosePreview> {
    return this.http.get<CashClosePreview>(this.serverUrl + `cash-session/${id}/close-preview`);
  }

  /** Cierre con arqueo. Si es la caja propia, el estado compartido pasa a "sin caja abierta". */
  public close(id: number, body: CashCloseRequest): Observable<CashSession> {
    return this.http.post<CashSession>(this.serverUrl + `cash-session/${id}/close`, body).pipe(
      tap(() => {
        if (this._current()?.id === id) {
          this.setCurrent(null);
        }
      })
    );
  }

  public getById(id: number): Observable<CashSession> {
    return this.http.get<CashSession>(this.serverUrl + `cash-session/${id}`);
  }

  /** Historial: el backend limita al CAJERO a sus propias cajas. */
  public getPageable(page: number, size: number, filter: CashSessionFilter): Observable<IPageable<CashSessionListItem>> {
    let params = new HttpParams().set('page', page).set('size', size).set('sortBy', 'openedAt').set('sortOrder', 'DESC');
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<IPageable<CashSessionListItem>>(this.serverUrl + 'cash-session/pageable', { params });
  }

  /** Cajas abiertas de todos (solo ADMIN). */
  public getOpenSessions(): Observable<CashSessionListItem[]> {
    return this.http.get<CashSessionListItem[]>(this.serverUrl + 'cash-session/open-sessions');
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
