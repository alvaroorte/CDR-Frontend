import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { config, of, throwError } from 'rxjs';
import { type Mock } from 'vitest';
import { ModalDeleteComponent } from './modal-delete.component';
import { HelpersService } from '@core/services/helpers.service';
import { IServiceCommon } from '@core/interfaces/service-common.interface';
import { IGenericModalForm } from '@core/interfaces/generic-modal-form.interface';
import { IGenericTable } from '@core/interfaces/generic-table.interface';
import { MESSAGES } from '@core/constants/messages';
import { Severity } from '@core/enums/severity';

/** Reescrito para Vitest + strictNullChecks a partir del spec de la referencia. */
describe('ModalDeleteComponent', () => {
  let component: ModalDeleteComponent;
  let service: IServiceCommon & { delete: Mock };
  let table: { reload: Mock };
  let helpers: { messageNotification: Mock };

  const create = (objectId: number | null) => {
    const fixture = TestBed.createComponent(ModalDeleteComponent);
    fixture.componentRef.setInput('serviceGeneric', service);
    fixture.componentRef.setInput('objectId', objectId);
    return fixture.componentInstance;
  };

  beforeEach(() => {
    table = { reload: vi.fn() };
    service = {
      eventFormComponent: signal<IGenericModalForm | null>(null),
      eventTableComponent: signal<IGenericTable | null>(table),
      eventModalDeleteComponent: signal<ModalDeleteComponent | null>(null),
      delete: vi.fn().mockReturnValue(of('ok')),
    };
    helpers = { messageNotification: vi.fn() };
    TestBed.configureTestingModule({ providers: [{ provide: HelpersService, useValue: helpers }] });
    component = create(7);
  });

  it('ngOnInit se registra en el servicio y ngOnDestroy se des-registra', () => {
    component.ngOnInit();
    expect(service.eventModalDeleteComponent()).toBe(component);
    component.ngOnDestroy();
    expect(service.eventModalDeleteComponent()).toBeNull();
  });

  it('openConfirm abre el diálogo', () => {
    component.openConfirm();
    expect(component.openModal()).toBe(true);
  });

  it('confirmDelete desactiva por id, recarga la tabla y avisa con el mensaje de desactivación', () => {
    const emitted: unknown[] = [];
    component.onDeleteSuccess.subscribe(() => emitted.push(true));
    component.openConfirm();

    component.confirmDelete();

    expect(component.openModal()).toBe(false);
    expect(service.delete).toHaveBeenCalledExactlyOnceWith(7);
    expect(table.reload).toHaveBeenCalledOnce();
    expect(emitted.length).toBe(1);
    expect(helpers.messageNotification).toHaveBeenCalledWith(Severity.success, 'Correcto', MESSAGES.recordDeactivated);
  });

  it('no llama al backend si no hay registro seleccionado', () => {
    component = create(null);
    component.confirmDelete();
    expect(service.delete).not.toHaveBeenCalled();
  });

  it('si el backend falla no recarga ni muestra éxito (el error lo muestra el interceptor)', async () => {
    const previous = config.onUnhandledError;
    config.onUnhandledError = vi.fn();
    service.delete.mockReturnValue(throwError(() => new Error('400')));
    component.confirmDelete();
    await new Promise(resolve => setTimeout(resolve)); // RxJS reporta el error en un setTimeout
    config.onUnhandledError = previous;
    expect(table.reload).not.toHaveBeenCalled();
    expect(helpers.messageNotification).not.toHaveBeenCalled();
  });
});
