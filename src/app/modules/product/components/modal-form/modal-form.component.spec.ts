import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { type Mock } from 'vitest';
import { ModalFormComponent } from './modal-form.component';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '@modules/category/services/category.service';
import { AddonService } from '@modules/addon/services/addon.service';
import { HelpersService } from '@core/services/helpers.service';
import { Product } from '@core/models/product';

describe('Product ModalFormComponent', () => {
  const baseFields = { active: true, createdBy: '', updatedBy: '', createdAt: '', updatedAt: '' };
  const capuchino = {
    id: 9, categoryId: 4, categoryName: 'Bebidas', name: 'Capuchino', description: null, imageBase64: null,
    price: 15.5, available: true, version: 1, addons: [{ id: 2, name: 'Leche de almendra' }], ...baseFields
  } as Product;

  let component: ModalFormComponent;
  let service: { eventFormComponent: { set: Mock }; eventTableComponent: Mock; getById: Mock; create: Mock; update: Mock };
  let categoryService: { getSelect: Mock };
  let addonService: { getSelect: Mock };

  beforeEach(() => {
    service = {
      eventFormComponent: { set: vi.fn() },
      eventTableComponent: vi.fn().mockReturnValue({ reload: vi.fn() }),
      getById: vi.fn().mockReturnValue(of(capuchino)),
      create: vi.fn().mockReturnValue(of(capuchino)),
      update: vi.fn().mockReturnValue(of(capuchino)),
    };
    categoryService = { getSelect: vi.fn().mockReturnValue(of([{ id: 4, name: 'Bebidas' }])) };
    addonService = { getSelect: vi.fn().mockReturnValue(of([{ id: 2, name: 'Leche de almendra', price: 3 }])) };
    TestBed.configureTestingModule({
      providers: [
        { provide: ProductService, useValue: service },
        { provide: CategoryService, useValue: categoryService },
        { provide: AddonService, useValue: addonService },
        { provide: HelpersService, useValue: { messageNotification: vi.fn() } },
      ]
    });
    component = TestBed.runInInjectionContext(() => new ModalFormComponent());
  });

  it('openCreate carga los combos de categorías y adicionales activos', () => {
    component.openCreate();
    expect(categoryService.getSelect).toHaveBeenCalled();
    expect(addonService.getSelect).toHaveBeenCalled();
    expect(component.categories.length).toBe(1);
  });

  it('openEdit convierte los adicionales del producto en addonIds', () => {
    component.openEdit(9);
    expect(component.formProduct.controls.addonIds.value).toEqual([2]);
    expect(component.formProduct.controls.price.value).toBe(15.5);
  });

  it('save no envía sin categoría ni precio', () => {
    component.openCreate();
    component.formProduct.patchValue({ name: 'Mocha' });
    component.save();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('save crea con el cuerpo esperado por el backend (sin id ni version)', () => {
    component.openCreate();
    component.formProduct.patchValue({ name: 'Mocha', categoryId: 4, price: 16, addonIds: [2] });

    component.save();

    expect(service.create).toHaveBeenCalledWith({
      categoryId: 4, name: 'Mocha', description: null, imageBase64: null,
      price: 16, available: true, active: true, addonIds: [2],
    });
  });

  it('save actualiza el producto editado', () => {
    component.openEdit(9);
    component.save();
    expect(service.update).toHaveBeenCalledWith(9, expect.objectContaining({ name: 'Capuchino', addonIds: [2] }));
  });
});
