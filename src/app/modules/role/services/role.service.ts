import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@core/environments/environment.development';
import { Permission, Role } from '@core/models/role';
import { IServiceCommon } from '@core/interfaces/service-common.interface';
import { IGenericModalForm } from '@core/interfaces/generic-modal-form.interface';
import { IOpenableModal } from '@core/interfaces/openable-modal.interface';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { ModalDeleteComponent } from '@shared/components/modal-delete/modal-delete.component';

@Injectable({
  providedIn: 'root'
})
export class RoleService implements IServiceCommon {

  public eventFormComponent = signal<IGenericModalForm | null>(null);
  public eventTableComponent = signal<GenericTableComponent<Role> | null>(null);
  public eventModalDeleteComponent = signal<ModalDeleteComponent | null>(null);
  /** Modal de asignación de permisos (registro por signal, sin EventEmitter). */
  public eventModalPermissionsComponent = signal<IOpenableModal | null>(null);

  private http = inject(HttpClient);
  private serverUrl: string = environment.server_url;

  public getAll(): Observable<Role[]> {
    return this.http.get<Role[]>(this.serverUrl + 'roles');
  }

  /** Solo roles activos (combo de usuarios). */
  public getSelect(): Observable<Role[]> {
    return this.http.get<Role[]>(this.serverUrl + 'roles/select');
  }

  public getById(id: number): Observable<Role> {
    return this.http.get<Role>(this.serverUrl + 'roles/' + id);
  }

  public create(body: Partial<Role>): Observable<Role> {
    return this.http.post<Role>(this.serverUrl + 'roles', body);
  }

  public update(id: number, body: Partial<Role>): Observable<Role> {
    return this.http.put<Role>(this.serverUrl + 'roles/' + id, body);
  }

  /** Borrado lógico (desactiva). El backend lo rechaza para roles del sistema o con usuarios activos. */
  public delete(id: number): Observable<string> {
    return this.http.delete(this.serverUrl + 'roles/' + id, { responseType: 'text' });
  }

  public getAllPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(this.serverUrl + 'permission');
  }

  public getPermissionIds(roleId: number): Observable<number[]> {
    return this.http.get<number[]>(this.serverUrl + 'roles/' + roleId + '/permissions');
  }

  public replacePermissions(roleId: number, permissionIds: number[]): Observable<number[]> {
    return this.http.put<number[]>(this.serverUrl + 'roles/' + roleId + '/permissions', { permissionIds });
  }
}
