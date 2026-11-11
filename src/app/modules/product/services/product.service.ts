import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@core/environments/environment.development';
import { Product, ProductRequest } from '@core/models/product';
import { IServiceCommon } from '@core/interfaces/service-common.interface';
import { IGenericModalForm } from '@core/interfaces/generic-modal-form.interface';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { ModalDeleteComponent } from '@shared/components/modal-delete/modal-delete.component';

@Injectable({
  providedIn: 'root'
})
export class ProductService implements IServiceCommon {

  public eventFormComponent = signal<IGenericModalForm | null>(null);
  public eventTableComponent = signal<GenericTableComponent<Product> | null>(null);
  public eventModalDeleteComponent = signal<ModalDeleteComponent | null>(null);

  private http = inject(HttpClient);
  private serverUrl: string = environment.server_url;

  public getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.serverUrl + 'product');
  }

  public getById(id: number): Observable<Product> {
    return this.http.get<Product>(this.serverUrl + 'product/' + id);
  }

  public create(body: ProductRequest): Observable<Product> {
    return this.http.post<Product>(this.serverUrl + 'product', body);
  }

  public update(id: number, body: ProductRequest): Observable<Product> {
    return this.http.put<Product>(this.serverUrl + 'product/' + id, body);
  }

  /** Agotado / disponible (ADMIN y CAJERO). */
  public changeAvailability(id: number, available: boolean): Observable<Product> {
    return this.http.patch<Product>(this.serverUrl + 'product/' + id + '/availability', { available });
  }

  /** Borrado lógico en el backend (desactiva). */
  public delete(id: number): Observable<string> {
    return this.http.delete(this.serverUrl + 'product/' + id, { responseType: 'text' });
  }
}
