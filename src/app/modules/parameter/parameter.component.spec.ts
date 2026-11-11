import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { type Mock } from 'vitest';
import { ParameterComponent } from './parameter.component';
import { ParameterService } from './services/parameter.service';
import { Parameter } from '@core/models/parameter';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { HelpersService } from '@core/services/helpers.service';

describe('ParameterComponent', () => {

  const baseFields = { active: true, createdBy: '', updatedBy: '', createdAt: '', updatedAt: '' };
  const parametersMock = [{ id: 1, folder: 'DESCUENTOS', code: 'CASHIER_MAX_DISCOUNT_PERCENT', name: 'Descuento', value: '50', valueType: 'PERCENTAGE', description: null, editable: true, ...baseFields }] as Parameter[];

  let component: ParameterComponent;
  let serviceStub: { getAll: Mock; eventTableComponent: { set: Mock } };

  beforeEach(() => {
    serviceStub = {
      getAll: vi.fn().mockReturnValue(of(parametersMock)),
      eventTableComponent: { set: vi.fn() },
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: ParameterService, useValue: serviceStub },
        { provide: HelpersService, useValue: { messageNotification: vi.fn() } },
      ]
    });
    component = TestBed.runInInjectionContext(() => new ParameterComponent());
  });

  it('ngOnInit carga los registros', () => {
    component.ngOnInit();
    expect(serviceStub.getAll).toHaveBeenCalled();
    expect(component.parameters()).toEqual(parametersMock);
  });

  it('getParameters con respuesta vacía deja el signal en []', () => {
    serviceStub.getAll.mockReturnValue(of([]));
    component.getParameters();
    expect(component.parameters()).toEqual([]);
  });

  it('setParameter actualiza la selección', () => {
    component.setParameter(parametersMock[0]);
    expect(component.parameterSelected()).toEqual(parametersMock[0]);
    component.setParameter(null);
    expect(component.parameterSelected()).toBeNull();
  });

  it('onTableSelfEmision registra la tabla en el servicio', () => {
    const table = {} as GenericTableComponent<Parameter>;
    component.onTableSelfEmision(table);
    expect(serviceStub.eventTableComponent.set).toHaveBeenCalledWith(table);
  });
});
