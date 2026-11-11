import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@core/environments/environment.development';
import { UserApp, UserAppRequest } from '@core/models/user-app';
import { IServiceCommon } from '@core/interfaces/service-common.interface';
import { IGenericModalForm } from '@core/interfaces/generic-modal-form.interface';
import { IOpenableModal } from '@core/interfaces/openable-modal.interface';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { ModalDeleteComponent } from '@shared/components/modal-delete/modal-delete.component';

@Injectable({
  providedIn: 'root'
})
export class UserService implements IServiceCommon {

  public eventFormComponent = signal<IGenericModalForm | null>(null);
  public eventTableComponent = signal<GenericTableComponent<UserApp> | null>(null);
  public eventModalDeleteComponent = signal<ModalDeleteComponent | null>(null);
  /** Modal de restablecimiento de contraseña (registro por signal, sin EventEmitter). */
  public eventModalPasswordComponent = signal<IOpenableModal | null>(null);

  private http = inject(HttpClient);
  private serverUrl: string = environment.server_url;

  /** Agrega rolesLabel para mostrar los roles en la tabla genérica. */
  public getAll(): Observable<UserApp[]> {
    return this.http.get<UserApp[]>(this.serverUrl + 'users').pipe(
      map(users => users.map(user => ({ ...user, rolesLabel: user.roles.map(role => role.name).join(', ') })))
    );
  }

  public getById(id: number): Observable<UserApp> {
    return this.http.get<UserApp>(this.serverUrl + 'users/' + id);
  }

  public create(body: UserAppRequest): Observable<UserApp> {
    return this.http.post<UserApp>(this.serverUrl + 'users', body);
  }

  public update(id: number, body: UserAppRequest): Observable<UserApp> {
    return this.http.put<UserApp>(this.serverUrl + 'users/' + id, body);
  }

  public resetPassword(id: number, password: string): Observable<void> {
    return this.http.patch<void>(this.serverUrl + 'users/' + id + '/password', { password });
  }

  /** Desactiva el usuario y revoca sus sesiones (backend). */
  public delete(id: number): Observable<string> {
    return this.http.delete(this.serverUrl + 'users/' + id, { responseType: 'text' });
  }
}
