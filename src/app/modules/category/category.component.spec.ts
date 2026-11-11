import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { type Mock } from 'vitest';
import { CategoryComponent } from './category.component';
import { CategoryService } from './services/category.service';
import { Category } from '@core/models/category';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { HelpersService } from '@core/services/helpers.service';

describe('CategoryComponent', () => {

  const baseFields = { active: true, createdBy: '', updatedBy: '', createdAt: '', updatedAt: '' };
  const categoriesMock = [{ id: 1, name: 'Bebidas', description: null, imageBase64: null, ranking: 1, ...baseFields }] as Category[];

  let component: CategoryComponent;
  let serviceStub: { getAll: Mock; eventTableComponent: { set: Mock } };

  beforeEach(() => {
    serviceStub = {
      getAll: vi.fn().mockReturnValue(of(categoriesMock)),
      eventTableComponent: { set: vi.fn() },
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: CategoryService, useValue: serviceStub },
        { provide: HelpersService, useValue: { messageNotification: vi.fn() } },
      ]
    });
    component = TestBed.runInInjectionContext(() => new CategoryComponent());
  });

  it('ngOnInit carga los registros', () => {
    component.ngOnInit();
    expect(serviceStub.getAll).toHaveBeenCalled();
    expect(component.categories()).toEqual(categoriesMock);
  });

  it('getCategories con respuesta vacía deja el signal en []', () => {
    serviceStub.getAll.mockReturnValue(of([]));
    component.getCategories();
    expect(component.categories()).toEqual([]);
  });

  it('setCategory actualiza la selección', () => {
    component.setCategory(categoriesMock[0]);
    expect(component.categorySelected()).toEqual(categoriesMock[0]);
    component.setCategory(null);
    expect(component.categorySelected()).toBeNull();
  });

  it('onTableSelfEmision registra la tabla en el servicio', () => {
    const table = {} as GenericTableComponent<Category>;
    component.onTableSelfEmision(table);
    expect(serviceStub.eventTableComponent.set).toHaveBeenCalledWith(table);
  });
});
