import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { type Mock } from 'vitest';
import { ModalFormComponent } from './modal-form.component';
import { CategoryService } from '../../services/category.service';
import { HelpersService } from '@core/services/helpers.service';
import { MESSAGES } from '@core/constants/messages';
import { Category } from '@core/models/category';

describe('Category ModalFormComponent', () => {
  const baseFields = { active: true, createdBy: '', updatedBy: '', createdAt: '', updatedAt: '' };
  const bebidas = { id: 4, name: 'Bebidas', description: 'Frías', imageBase64: null, ranking: 1, ...baseFields } as Category;

  let component: ModalFormComponent;
  let service: { eventFormComponent: { set: Mock }; eventTableComponent: Mock; getById: Mock; create: Mock; update: Mock };
  let helpers: { messageNotification: Mock };
  let table: { reload: Mock };

  beforeEach(() => {
    table = { reload: vi.fn() };
    service = {
      eventFormComponent: { set: vi.fn() },
      eventTableComponent: vi.fn().mockReturnValue(table),
      getById: vi.fn().mockReturnValue(of(bebidas)),
      create: vi.fn().mockReturnValue(of(bebidas)),
      update: vi.fn().mockReturnValue(of(bebidas)),
    };
    helpers = { messageNotification: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: CategoryService, useValue: service },
        { provide: HelpersService, useValue: helpers },
      ]
    });
    component = TestBed.runInInjectionContext(() => new ModalFormComponent());
  });

  const patchValidForm = () => component.formCategory.patchValue({ name: 'Postres', ranking: 2, active: true });

  it('ngOnInit se registra en el servicio', () => {
    component.ngOnInit();
    expect(service.eventFormComponent.set).toHaveBeenCalledWith(component);
  });

  it('openCreate limpia el formulario y abre el modal', () => {
    component.formCategory.patchValue({ name: 'algo' });
    component.openCreate();
    expect(component.openModal).toBe(true);
    expect(component.formCategory.controls.name.value).toBe('');
  });

  it('openEdit carga la categoría y abre el modal', () => {
    component.openEdit(4);
    expect(service.getById).toHaveBeenCalledWith(4);
    expect(component.formCategory.controls.name.value).toBe('Bebidas');
    expect(component.openModal).toBe(true);
  });

  it('save no envía si el formulario es inválido', () => {
    component.openCreate();
    component.save();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('save crea tras openCreate (sin id, descripción vacía como null), notifica y recarga', () => {
    component.openCreate();
    patchValidForm();
    component.formCategory.controls.description.setValue('   ');

    component.save();

    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Postres', description: null, ranking: 2 }));
    expect(service.create.mock.calls[0][0]).not.toHaveProperty('id');
    expect(helpers.messageNotification).toHaveBeenCalledWith('success', 'Correcto', MESSAGES.recordCreated, 3000);
    expect(component.openModal).toBe(false);
    expect(table.reload).toHaveBeenCalled();
  });

  it('save actualiza con el id tras openEdit', () => {
    component.openEdit(4);
    component.save();
    expect(service.update).toHaveBeenCalledWith(4, expect.objectContaining({ name: 'Bebidas' }));
    expect(helpers.messageNotification).toHaveBeenCalledWith('success', 'Correcto', MESSAGES.recordUpdated, 3000);
  });
});
