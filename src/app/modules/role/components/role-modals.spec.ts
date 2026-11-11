import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { type Mock } from 'vitest';
import { ModalFormComponent } from './modal-form/modal-form.component';
import { ModalPermissionsComponent } from './modal-permissions/modal-permissions.component';
import { RoleService } from '../services/role.service';
import { HelpersService } from '@core/services/helpers.service';
import { Role } from '@core/models/role';
import { MESSAGES } from '@core/constants/messages';

describe('Role modals', () => {
  const baseFields = { active: true, createdBy: '', updatedBy: '', createdAt: '', updatedAt: '' };
  const cajero = { id: 2, name: 'Cajero', code: 'CAJERO', description: null, system: true, ...baseFields } as Role;
  const mesero = { id: 5, name: 'Mesero', code: 'MESERO', description: null, system: false, ...baseFields } as Role;

  let service: {
    eventFormComponent: { set: Mock }; eventTableComponent: Mock; eventModalPermissionsComponent: { set: Mock };
    getById: Mock; create: Mock; update: Mock; getAllPermissions: Mock; getPermissionIds: Mock; replacePermissions: Mock;
  };
  let helpers: { messageNotification: Mock };

  beforeEach(() => {
    service = {
      eventFormComponent: { set: vi.fn() },
      eventTableComponent: vi.fn().mockReturnValue({ reload: vi.fn() }),
      eventModalPermissionsComponent: { set: vi.fn() },
      getById: vi.fn().mockReturnValue(of(cajero)),
      create: vi.fn().mockReturnValue(of(mesero)),
      update: vi.fn().mockReturnValue(of(cajero)),
      getAllPermissions: vi.fn().mockReturnValue(of([
        { id: 10, code: 'GET__PRODUCT', name: '', description: '', httpMethod: 'GET', url: '/product' },
        { id: 11, code: 'PATCH__PRODUCT_AVAILABILITY', name: '', description: '', httpMethod: 'PATCH', url: '/product/{id}/availability' },
      ])),
      getPermissionIds: vi.fn().mockReturnValue(of([10])),
      replacePermissions: vi.fn().mockReturnValue(of([10, 11])),
    };
    helpers = { messageNotification: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: RoleService, useValue: service },
        { provide: HelpersService, useValue: helpers },
      ]
    });
  });

  describe('ModalFormComponent', () => {
    let component: ModalFormComponent;
    beforeEach(() => component = TestBed.runInInjectionContext(() => new ModalFormComponent()));

    it('en un rol del sistema el código y el estado no se editan', () => {
      component.openEdit(2);
      expect(component.formRole.controls.code.disabled).toBe(true);
      expect(component.formRole.controls.active.disabled).toBe(true);
    });

    it('en un rol propio el estado se puede cambiar pero el código no', () => {
      service.getById.mockReturnValue(of(mesero));
      component.openEdit(5);
      expect(component.formRole.controls.code.disabled).toBe(true);
      expect(component.formRole.controls.active.enabled).toBe(true);
    });

    it('al crear envía el código en mayúsculas', () => {
      component.openCreate();
      component.formRole.patchValue({ code: 'mesero', name: 'Mesero' });
      component.save();
      expect(service.create).toHaveBeenCalledWith(expect.objectContaining({ code: 'MESERO', name: 'Mesero' }));
    });
  });

  describe('ModalPermissionsComponent', () => {
    let component: ModalPermissionsComponent;
    beforeEach(() => component = TestBed.runInInjectionContext(() => new ModalPermissionsComponent()));

    it('se registra y des-registra en el servicio', () => {
      component.ngOnInit();
      expect(service.eventModalPermissionsComponent.set).toHaveBeenCalledWith(component);
      component.ngOnDestroy();
      expect(service.eventModalPermissionsComponent.set).toHaveBeenLastCalledWith(null);
    });

    it('open preselecciona los permisos ya asignados al rol', () => {
      component.open(2);
      expect(component.openModal).toBe(true);
      expect(component.selectedPermissions.map(p => p.id)).toEqual([10]);
    });

    it('save reemplaza el conjunto completo de permisos', () => {
      component.open(2);
      component.selectedPermissions = component.permissions();
      component.save();
      expect(service.replacePermissions).toHaveBeenCalledWith(2, [10, 11]);
      expect(helpers.messageNotification).toHaveBeenCalledWith('success', 'Correcto', MESSAGES.permissionsUpdated);
      expect(component.openModal).toBe(false);
    });
  });
});
