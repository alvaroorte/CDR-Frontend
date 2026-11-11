import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { type Mock } from 'vitest';
import { ModalFormComponent } from './modal-form.component';
import { UserService } from '../../services/user.service';
import { RoleService } from '@modules/role/services/role.service';
import { HelpersService } from '@core/services/helpers.service';
import { UserApp } from '@core/models/user-app';

describe('User ModalFormComponent', () => {
  const baseFields = { active: true, createdBy: '', updatedBy: '', createdAt: '', updatedAt: '' };
  const maria = {
    id: 7, username: 'maria.caja', fullName: 'María Caja', email: null, rolesLabel: '',
    roles: [{ id: 2, name: 'Cajero', code: 'CAJERO' }], ...baseFields
  } as UserApp;

  let component: ModalFormComponent;
  let service: { eventFormComponent: { set: Mock }; eventTableComponent: Mock; getById: Mock; create: Mock; update: Mock };

  beforeEach(() => {
    service = {
      eventFormComponent: { set: vi.fn() },
      eventTableComponent: vi.fn().mockReturnValue({ reload: vi.fn() }),
      getById: vi.fn().mockReturnValue(of(maria)),
      create: vi.fn().mockReturnValue(of(maria)),
      update: vi.fn().mockReturnValue(of(maria)),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: UserService, useValue: service },
        { provide: RoleService, useValue: { getSelect: vi.fn().mockReturnValue(of([{ id: 2, name: 'Cajero', code: 'CAJERO' }])) } },
        { provide: HelpersService, useValue: { messageNotification: vi.fn() } },
      ]
    });
    component = TestBed.runInInjectionContext(() => new ModalFormComponent());
  });

  it('al crear la contraseña es obligatoria (mínimo 8)', () => {
    component.openCreate();
    component.formUser.patchValue({ username: 'pepe', fullName: 'Pepe Cocina', roleIds: [3], password: 'corta' });
    expect(component.formUser.valid).toBe(false);
    component.formUser.controls.password.setValue('Clave2026');
    expect(component.formUser.valid).toBe(true);
  });

  it('save crea enviando la contraseña y los roles', () => {
    component.openCreate();
    component.formUser.patchValue({ username: 'pepe', fullName: ' Pepe Cocina ', roleIds: [3], password: 'Clave2026', email: '' });
    component.save();
    expect(service.create).toHaveBeenCalledWith({
      username: 'pepe', fullName: 'Pepe Cocina', email: null, password: 'Clave2026', roleIds: [3], active: true,
    });
  });

  it('al editar la contraseña se deshabilita y no se envía', () => {
    component.openEdit(7);
    expect(component.formUser.controls.password.disabled).toBe(true);
    expect(component.formUser.controls.roleIds.value).toEqual([2]);

    component.save();

    expect(service.update).toHaveBeenCalledWith(7, expect.objectContaining({ username: 'maria.caja', password: null, roleIds: [2] }));
  });

  it('no envía si no se elige ningún rol', () => {
    component.openCreate();
    component.formUser.patchValue({ username: 'pepe', fullName: 'Pepe Cocina', roleIds: [], password: 'Clave2026' });
    component.save();
    expect(service.create).not.toHaveBeenCalled();
  });
});
