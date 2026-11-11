import { WritableSignal } from "@angular/core";
import { ModalDeleteComponent } from "@shared/components/modal-delete/modal-delete.component";
import { Observable } from "rxjs";
import { IGenericTable } from "./generic-table.interface";
import { IGenericModalForm } from "./generic-modal-form.interface";

/**
 * Registro de componentes en el servicio de cada CRUD (patrón de la referencia).
 * Con strictNullChecks activo las señales admiten null hasta que el componente se registra.
 */
export interface IServiceCommon {
    eventFormComponent: WritableSignal<IGenericModalForm | null>;
    eventTableComponent: WritableSignal<IGenericTable | null>;
    eventModalDeleteComponent: WritableSignal<ModalDeleteComponent | null>;
    delete(id: number): Observable<string>;
}
