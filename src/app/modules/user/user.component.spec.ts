import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { type Mock } from 'vitest';
import { UserComponent } from './user.component';
import { UserService } from './services/user.service';
import { UserApp } from '@core/models/user-app';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { HelpersService } from '@core/services/helpers.service';

describe('UserComponent', () => {

  const baseFields = { active: true, createdBy: '', updatedBy: '', createdAt: '', updatedAt: '' };
  const usersMock = [{ id: 1, username: 'maria.caja', fullName: 'María', email: null, roles: [], rolesLabel: '', ...baseFields }] as UserApp[];

  let component: UserComponent;
  let serviceStub: { getAll: Mock; eventTableComponent: { set: Mock } };

  beforeEach(() => {
    serviceStub = {
      getAll: vi.fn().mockReturnValue(of(usersMock)),
      eventTableComponent: { set: vi.fn() },
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: UserService, useValue: serviceStub },
        { provide: HelpersService, useValue: { messageNotification: vi.fn() } },
      ]
    });
    component = TestBed.runInInjectionContext(() => new UserComponent());
  });

  it('ngOnInit carga los registros', () => {
    component.ngOnInit();
    expect(serviceStub.getAll).toHaveBeenCalled();
    expect(component.users()).toEqual(usersMock);
  });

  it('getUsers con respuesta vacía deja el signal en []', () => {
    serviceStub.getAll.mockReturnValue(of([]));
    component.getUsers();
    expect(component.users()).toEqual([]);
  });

  it('setUser actualiza la selección', () => {
    component.setUser(usersMock[0]);
    expect(component.userSelected()).toEqual(usersMock[0]);
    component.setUser(null);
    expect(component.userSelected()).toBeNull();
  });

  it('onTableSelfEmision registra la tabla en el servicio', () => {
    const table = {} as GenericTableComponent<UserApp>;
    component.onTableSelfEmision(table);
    expect(serviceStub.eventTableComponent.set).toHaveBeenCalledWith(table);
  });
});
