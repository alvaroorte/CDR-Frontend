import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { type Mock } from 'vitest';
import { ProductComponent } from './product.component';
import { ProductService } from './services/product.service';
import { Product } from '@core/models/product';
import { LoginService } from '@core/services/login.service';
import { HelpersService } from '@core/services/helpers.service';
import { ROLES_CODE_SYSTEM } from '@core/enums/roles';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';

describe('ProductComponent', () => {

  const baseFields = { active: true, createdBy: '', updatedBy: '', createdAt: '', updatedAt: '' };
  const capuchino = {
    id: 1, categoryId: 1, categoryName: 'Bebidas', name: 'Capuchino', description: null, imageBase64: null,
    price: 15.5, available: true, version: 0, addons: [], ...baseFields
  } as Product;

  let component: ProductComponent;
  let serviceStub: { getAll: Mock; changeAvailability: Mock; eventTableComponent: Mock & { set: Mock } };
  let helpers: { messageNotification: Mock };
  let table: { reload: Mock };
  const roles = signal<ROLES_CODE_SYSTEM[]>([]);

  beforeEach(() => {
    table = { reload: vi.fn() };
    const eventTableComponent = Object.assign(vi.fn().mockReturnValue(table), { set: vi.fn() });
    serviceStub = {
      getAll: vi.fn().mockReturnValue(of([capuchino])),
      changeAvailability: vi.fn().mockReturnValue(of({ ...capuchino, available: false })),
      eventTableComponent,
    };
    helpers = { messageNotification: vi.fn() };
    roles.set([ROLES_CODE_SYSTEM.CASHIER]);
    TestBed.configureTestingModule({
      providers: [
        { provide: ProductService, useValue: serviceStub },
        { provide: HelpersService, useValue: helpers },
        { provide: LoginService, useValue: { haveSomeRole: (r: ROLES_CODE_SYSTEM[]) => r.some(x => roles().includes(x)) } },
      ]
    });
    component = TestBed.runInInjectionContext(() => new ProductComponent());
  });

  it('ngOnInit carga los productos', () => {
    component.ngOnInit();
    expect(component.products()).toEqual([capuchino]);
  });

  it('isAdmin es false para el CAJERO (solo ve el botón de disponibilidad)', () => {
    expect(component.isAdmin()).toBe(false);
    roles.set([ROLES_CODE_SYSTEM.ADMIN]);
    expect(component.isAdmin()).toBe(true);
  });

  it('toggleAvailability marca agotado un producto disponible y recarga la tabla', () => {
    component.setProduct(capuchino);

    component.toggleAvailability();

    expect(serviceStub.changeAvailability).toHaveBeenCalledWith(1, false);
    expect(helpers.messageNotification).toHaveBeenCalledWith('success', 'Correcto', 'Capuchino marcado como agotado');
    expect(table.reload).toHaveBeenCalled();
  });

  it('toggleAvailability sin selección avisa y no llama al backend', () => {
    component.toggleAvailability();
    expect(serviceStub.changeAvailability).not.toHaveBeenCalled();
    expect(helpers.messageNotification).toHaveBeenCalled();
  });

  it('onTableSelfEmision registra la tabla en el servicio', () => {
    const tableComponent = {} as GenericTableComponent<Product>;
    component.onTableSelfEmision(tableComponent);
    expect(serviceStub.eventTableComponent.set).toHaveBeenCalledWith(tableComponent);
  });
});
