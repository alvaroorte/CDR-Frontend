import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@core/environments/environment.development';
import { TableMarker } from '@core/models/table-marker';
import { IServiceCommon } from '@core/interfaces/service-common.interface';
import { IGenericModalForm } from '@core/interfaces/generic-modal-form.interface';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { ModalDeleteComponent } from '@shared/components/modal-delete/modal-delete.component';

@Injectable({
  providedIn: 'root'
})
export class TableMarkerService implements IServiceCommon {

  public eventFormComponent = signal<IGenericModalForm | null>(null);
  public eventTableComponent = signal<GenericTableComponent<TableMarker> | null>(null);
  public eventModalDeleteComponent = signal<ModalDeleteComponent | null>(null);

  private http = inject(HttpClient);
  private serverUrl: string = environment.server_url;

  public getAll(): Observable<TableMarker[]> {
    return this.http.get<TableMarker[]>(this.serverUrl + 'table-marker');
  }

  public getById(id: number): Observable<TableMarker> {
    return this.http.get<TableMarker>(this.serverUrl + 'table-marker/' + id);
  }

  public create(body: Partial<TableMarker>): Observable<TableMarker> {
    return this.http.post<TableMarker>(this.serverUrl + 'table-marker', body);
  }

  public update(id: number, body: Partial<TableMarker>): Observable<TableMarker> {
    return this.http.put<TableMarker>(this.serverUrl + 'table-marker/' + id, body);
  }

  /** Borrado lógico en el backend (desactiva). */
  public delete(id: number): Observable<string> {
    return this.http.delete(this.serverUrl + 'table-marker/' + id, { responseType: 'text' });
  }
}
