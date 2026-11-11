import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { type Mock } from 'vitest';
import { AddonComponent } from './addon.component';
import { AddonService } from './services/addon.service';
import { Addon } from '@core/models/addon';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { HelpersService } from '@core/services/helpers.service';

describe('AddonComponent', () => {

  const baseFields = { active: true, createdBy: '', updatedBy: '', createdAt: '', updatedAt: '' };
  const addonsMock = [{ id: 1, name: 'Leche de almendra', price: 3.5, ...baseFields }] as Addon[];

  let component: AddonComponent;
  let serviceStub: { getAll: Mock; eventTableComponent: { set: Mock } };

  beforeEach(() => {
    serviceStub = {
      getAll: vi.fn().mockReturnValue(of(addonsMock)),
      eventTableComponent: { set: vi.fn() },
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: AddonService, useValue: serviceStub },
        { provide: HelpersService, useValue: { messageNotification: vi.fn() } },
      ]
    });
    component = TestBed.runInInjectionContext(() => new AddonComponent());
  });

  it('ngOnInit carga los registros', () => {
    component.ngOnInit();
    expect(serviceStub.getAll).toHaveBeenCalled();
    expect(component.addons()).toEqual(addonsMock);
  });

  it('getAddons con respuesta vacía deja el signal en []', () => {
    serviceStub.getAll.mockReturnValue(of([]));
    component.getAddons();
    expect(component.addons()).toEqual([]);
  });

  it('setAddon actualiza la selección', () => {
    component.setAddon(addonsMock[0]);
    expect(component.addonSelected()).toEqual(addonsMock[0]);
    component.setAddon(null);
    expect(component.addonSelected()).toBeNull();
  });

  it('onTableSelfEmision registra la tabla en el servicio', () => {
    const table = {} as GenericTableComponent<Addon>;
    component.onTableSelfEmision(table);
    expect(serviceStub.eventTableComponent.set).toHaveBeenCalledWith(table);
  });
});
