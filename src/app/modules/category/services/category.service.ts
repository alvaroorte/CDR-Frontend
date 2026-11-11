import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@core/environments/environment.development';
import { Category } from '@core/models/category';
import { SelectOption } from '@core/models/select-option';
import { IServiceCommon } from '@core/interfaces/service-common.interface';
import { IGenericModalForm } from '@core/interfaces/generic-modal-form.interface';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { ModalDeleteComponent } from '@shared/components/modal-delete/modal-delete.component';

@Injectable({
  providedIn: 'root'
})
export class CategoryService implements IServiceCommon {

  public eventFormComponent = signal<IGenericModalForm | null>(null);
  public eventTableComponent = signal<GenericTableComponent<Category> | null>(null);
  public eventModalDeleteComponent = signal<ModalDeleteComponent | null>(null);

  private http = inject(HttpClient);
  private serverUrl: string = environment.server_url;

  public getAll(): Observable<Category[]> {
    return this.http.get<Category[]>(this.serverUrl + 'category');
  }

  /** Solo categorías activas (combos). */
  public getSelect(): Observable<SelectOption[]> {
    return this.http.get<SelectOption[]>(this.serverUrl + 'category/select');
  }

  public getById(id: number): Observable<Category> {
    return this.http.get<Category>(this.serverUrl + 'category/' + id);
  }

  public create(body: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(this.serverUrl + 'category', body);
  }

  public update(id: number, body: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(this.serverUrl + 'category/' + id, body);
  }

  /** Borrado lógico en el backend (desactiva). */
  public delete(id: number): Observable<string> {
    return this.http.delete(this.serverUrl + 'category/' + id, { responseType: 'text' });
  }
}
