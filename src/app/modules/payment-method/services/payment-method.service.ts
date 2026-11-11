import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@core/environments/environment.development';
import { PaymentMethod } from '@core/models/payment-method';
import { IServiceCommon } from '@core/interfaces/service-common.interface';
import { IGenericModalForm } from '@core/interfaces/generic-modal-form.interface';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { ModalDeleteComponent } from '@shared/components/modal-delete/modal-delete.component';

@Injectable({
  providedIn: 'root'
})
export class PaymentMethodService implements IServiceCommon {

  public eventFormComponent = signal<IGenericModalForm | null>(null);
  public eventTableComponent = signal<GenericTableComponent<PaymentMethod> | null>(null);
  public eventModalDeleteComponent = signal<ModalDeleteComponent | null>(null);

  private http = inject(HttpClient);
  private serverUrl: string = environment.server_url;

  public getAll(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(this.serverUrl + 'payment-method');
  }

  public getById(id: number): Observable<PaymentMethod> {
    return this.http.get<PaymentMethod>(this.serverUrl + 'payment-method/' + id);
  }

  public create(body: Partial<PaymentMethod>): Observable<PaymentMethod> {
    return this.http.post<PaymentMethod>(this.serverUrl + 'payment-method', body);
  }

  public update(id: number, body: Partial<PaymentMethod>): Observable<PaymentMethod> {
    return this.http.put<PaymentMethod>(this.serverUrl + 'payment-method/' + id, body);
  }

  /** Borrado lógico en el backend (desactiva). */
  public delete(id: number): Observable<string> {
    return this.http.delete(this.serverUrl + 'payment-method/' + id, { responseType: 'text' });
  }
}
