import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from '@core/environments/environment.development';
import { Parameter } from '@core/models/parameter';
import { IServiceCommon } from '@core/interfaces/service-common.interface';
import { IGenericModalForm } from '@core/interfaces/generic-modal-form.interface';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { ModalDeleteComponent } from '@shared/components/modal-delete/modal-delete.component';

/** Los parámetros los define el backend (migraciones): aquí solo se listan y se edita su valor. */
@Injectable({
  providedIn: 'root'
})
export class ParameterService implements IServiceCommon {

  public eventFormComponent = signal<IGenericModalForm | null>(null);
  public eventTableComponent = signal<GenericTableComponent<Parameter> | null>(null);
  public eventModalDeleteComponent = signal<ModalDeleteComponent | null>(null);

  private http = inject(HttpClient);
  private serverUrl: string = environment.server_url;

  public getAll(): Observable<Parameter[]> {
    return this.http.get<Parameter[]>(this.serverUrl + 'parameter');
  }

  public getById(id: number): Observable<Parameter> {
    return this.http.get<Parameter>(this.serverUrl + 'parameter/' + id);
  }

  public updateValue(id: number, value: string): Observable<Parameter> {
    return this.http.put<Parameter>(this.serverUrl + 'parameter/' + id, { value });
  }

  /** Requerido por IServiceCommon; el backend no expone DELETE /parameter (la UI no lo ofrece). */
  public delete(_id: number): Observable<string> {
    return throwError(() => new Error('Los parámetros no se eliminan.'));
  }
}
