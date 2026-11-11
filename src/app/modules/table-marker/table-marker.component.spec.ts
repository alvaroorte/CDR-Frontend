import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { type Mock } from 'vitest';
import { TableMarkerComponent } from './table-marker.component';
import { TableMarkerService } from './services/table-marker.service';
import { TableMarker } from '@core/models/table-marker';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { HelpersService } from '@core/services/helpers.service';

describe('TableMarkerComponent', () => {

  const baseFields = { active: true, createdBy: '', updatedBy: '', createdAt: '', updatedAt: '' };
  const tableMarkersMock = [{ id: 1, number: 5, description: null, ...baseFields }] as TableMarker[];

  let component: TableMarkerComponent;
  let serviceStub: { getAll: Mock; eventTableComponent: { set: Mock } };

  beforeEach(() => {
    serviceStub = {
      getAll: vi.fn().mockReturnValue(of(tableMarkersMock)),
      eventTableComponent: { set: vi.fn() },
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: TableMarkerService, useValue: serviceStub },
        { provide: HelpersService, useValue: { messageNotification: vi.fn() } },
      ]
    });
    component = TestBed.runInInjectionContext(() => new TableMarkerComponent());
  });

  it('ngOnInit carga los registros', () => {
    component.ngOnInit();
    expect(serviceStub.getAll).toHaveBeenCalled();
    expect(component.tableMarkers()).toEqual(tableMarkersMock);
  });

  it('getTableMarkers con respuesta vacía deja el signal en []', () => {
    serviceStub.getAll.mockReturnValue(of([]));
    component.getTableMarkers();
    expect(component.tableMarkers()).toEqual([]);
  });

  it('setTableMarker actualiza la selección', () => {
    component.setTableMarker(tableMarkersMock[0]);
    expect(component.tableMarkerSelected()).toEqual(tableMarkersMock[0]);
    component.setTableMarker(null);
    expect(component.tableMarkerSelected()).toBeNull();
  });

  it('onTableSelfEmision registra la tabla en el servicio', () => {
    const table = {} as GenericTableComponent<TableMarker>;
    component.onTableSelfEmision(table);
    expect(serviceStub.eventTableComponent.set).toHaveBeenCalledWith(table);
  });
});
