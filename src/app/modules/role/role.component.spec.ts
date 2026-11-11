import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { type Mock } from 'vitest';
import { RoleComponent } from './role.component';
import { RoleService } from './services/role.service';
import { Role } from '@core/models/role';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { HelpersService } from '@core/services/helpers.service';

describe('RoleComponent', () => {

  const baseFields = { active: true, createdBy: '', updatedBy: '', createdAt: '', updatedAt: '' };
  const rolesMock = [{ id: 1, name: 'Cajero', code: 'CAJERO', description: null, system: true, ...baseFields }] as Role[];

  let component: RoleComponent;
  let serviceStub: { getAll: Mock; eventTableComponent: { set: Mock } };

  beforeEach(() => {
    serviceStub = {
      getAll: vi.fn().mockReturnValue(of(rolesMock)),
      eventTableComponent: { set: vi.fn() },
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: RoleService, useValue: serviceStub },
        { provide: HelpersService, useValue: { messageNotification: vi.fn() } },
      ]
    });
    component = TestBed.runInInjectionContext(() => new RoleComponent());
  });

  it('ngOnInit carga los registros', () => {
    component.ngOnInit();
    expect(serviceStub.getAll).toHaveBeenCalled();
    expect(component.roles()).toEqual(rolesMock);
  });

  it('getRoles con respuesta vacía deja el signal en []', () => {
    serviceStub.getAll.mockReturnValue(of([]));
    component.getRoles();
    expect(component.roles()).toEqual([]);
  });

  it('setRole actualiza la selección', () => {
    component.setRole(rolesMock[0]);
    expect(component.roleSelected()).toEqual(rolesMock[0]);
    component.setRole(null);
    expect(component.roleSelected()).toBeNull();
  });

  it('onTableSelfEmision registra la tabla en el servicio', () => {
    const table = {} as GenericTableComponent<Role>;
    component.onTableSelfEmision(table);
    expect(serviceStub.eventTableComponent.set).toHaveBeenCalledWith(table);
  });
});
