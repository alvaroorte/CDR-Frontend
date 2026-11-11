import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@core/environments/environment.development';
import { Addon } from '@core/models/addon';
import { IServiceCommon } from '@core/interfaces/service-common.interface';
import { IGenericModalForm } from '@core/interfaces/generic-modal-form.interface';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { ModalDeleteComponent } from '@shared/components/modal-delete/modal-delete.component';

@Injectable({
  providedIn: 'root'
})
export class AddonService implements IServiceCommon {

  public eventFormComponent = signal<IGenericModalForm | null>(null);
  public eventTableComponent = signal<GenericTableComponent<Addon> | null>(null);
  public eventModalDeleteComponent = signal<ModalDeleteComponent | null>(null);

  private http = inject(HttpClient);
  private serverUrl: string = environment.server_url;

  public getAll(): Observable<Addon[]> {
    return this.http.get<Addon[]>(this.serverUrl + 'addon');
  }

  /** Solo adicionales activos (formulario de productos). */
  public getSelect(): Observable<Addon[]> {
    return this.http.get<Addon[]>(this.serverUrl + 'addon/select');
  }

  public getById(id: number): Observable<Addon> {
    return this.http.get<Addon>(this.serverUrl + 'addon/' + id);
  }

  public create(body: Partial<Addon>): Observable<Addon> {
    return this.http.post<Addon>(this.serverUrl + 'addon', body);
  }

  public update(id: number, body: Partial<Addon>): Observable<Addon> {
    return this.http.put<Addon>(this.serverUrl + 'addon/' + id, body);
  }

  /** Borrado lógico en el backend (desactiva). */
  public delete(id: number): Observable<string> {
    return this.http.delete(this.serverUrl + 'addon/' + id, { responseType: 'text' });
  }
}
