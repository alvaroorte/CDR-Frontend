import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@core/environments/environment.development';
import { ORDER_STATUS } from '@core/enums/order-status';
import { IPageable } from '@core/interfaces/pageable.interface';
import { KitchenSettings, OrderBoard, OrderDetail, OrderHistoryFilter, OrderListItem } from '@core/models/order';

/** REST de pedidos para cocina, seguimiento e historial (Etapa 4). El registro está en PosService. */
@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private http = inject(HttpClient);
  private serverUrl: string = environment.server_url;

  /** Fuente de verdad del tablero (al conectar y en cada reconexión del WebSocket). */
  public getBoard(statuses: readonly ORDER_STATUS[] = []): Observable<OrderBoard[]> {
    let params = new HttpParams();
    statuses.forEach(status => params = params.append('statuses', status));
    return this.http.get<OrderBoard[]>(this.serverUrl + 'order/board', { params });
  }

  public getById(id: number): Observable<OrderDetail> {
    return this.http.get<OrderDetail>(this.serverUrl + 'order/' + id);
  }

  public getKitchenSettings(): Observable<KitchenSettings> {
    return this.http.get<KitchenSettings>(this.serverUrl + 'order/kitchen-settings');
  }

  /** {@code expectedVersion}: la versión que el usuario está viendo (409 si otro la cambió). */
  public changeStatus(id: number, toStatus: ORDER_STATUS, expectedVersion: number): Observable<OrderDetail> {
    return this.http.patch<OrderDetail>(this.serverUrl + `order/${id}/status`, { toStatus, expectedVersion });
  }

  public cancel(id: number, reason: string, expectedVersion: number): Observable<OrderDetail> {
    return this.http.post<OrderDetail>(this.serverUrl + `order/${id}/cancel`, { reason, expectedVersion });
  }

  public getPageable(page: number, size: number, filter: OrderHistoryFilter, sortBy = 'createdAt',
                     sortOrder: 'ASC' | 'DESC' = 'DESC'): Observable<IPageable<OrderListItem>> {
    let params = new HttpParams().set('page', page).set('size', size).set('sortBy', sortBy).set('sortOrder', sortOrder);
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<IPageable<OrderListItem>>(this.serverUrl + 'order/pageable', { params });
  }
}
