import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@core/environments/environment.development';
import { PosCatalog } from '@core/models/pos-catalog';
import { TableMarkerAvailability } from '@core/models/table-marker';
import { Order, OrderQuote, OrderQuoteRequest, OrderRequest } from '@core/models/order';

/** HTTP del POS: catálogo, adornos libres/en uso, cotización y registro del pedido. */
@Injectable({
  providedIn: 'root'
})
export class PosService {

  private http = inject(HttpClient);
  private serverUrl: string = environment.server_url;

  public getCatalog(): Observable<PosCatalog> {
    return this.http.get<PosCatalog>(this.serverUrl + 'pos/catalog');
  }

  public getMarkerAvailability(): Observable<TableMarkerAvailability[]> {
    return this.http.get<TableMarkerAvailability[]>(this.serverUrl + 'table-marker/availability');
  }

  /** Mismo cálculo que el registro, sin persistir: fuente del resumen de confirmación. */
  public quote(body: OrderQuoteRequest): Observable<OrderQuote> {
    return this.http.post<OrderQuote>(this.serverUrl + 'order/quote', body);
  }

  public create(body: OrderRequest): Observable<Order> {
    return this.http.post<Order>(this.serverUrl + 'order', body);
  }
}
