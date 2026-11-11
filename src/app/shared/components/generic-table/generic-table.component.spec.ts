import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { GenericTableComponent } from './generic-table.component';
import { TableColumn } from '@core/interfaces/table.interface';
import { TableColumnType } from '@core/enums/table-column-type.enum';

interface RowMock {
  id: number;
  name: string;
  price: number;
  active: boolean;
}

/** Reescrito para Vitest + strictNullChecks a partir del spec de la referencia. */
describe('GenericTableComponent', () => {
  let fixture: ComponentFixture<GenericTableComponent<RowMock>>;
  let component: GenericTableComponent<RowMock>;

  const rows: RowMock[] = [
    { id: 1, name: 'Capuchino', price: 15.5, active: true },
    { id: 2, name: 'Mocha', price: 16, active: false },
  ];
  const columns: TableColumn<RowMock>[] = [
    { field: 'name', header: 'Nombre' },
    { field: 'price', header: 'Precio', columnType: TableColumnType.AMOUNT },
    { field: 'active', header: 'Estado', columnType: TableColumnType.STATUS, notfilterByThisfield: true },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideNoopAnimations()] });
    fixture = TestBed.createComponent(GenericTableComponent<RowMock>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', rows);
    fixture.componentRef.setInput('tableColumnDefinitions', columns);
  });

  it('se registra en el padre al iniciar (selfEmitter)', () => {
    const registered: GenericTableComponent<RowMock>[] = [];
    component.selfEmitter.subscribe(table => registered.push(table));
    fixture.detectChanges();
    expect(registered).toEqual([component]);
  });

  it('el filtro global excluye las columnas marcadas con notfilterByThisfield', () => {
    fixture.detectChanges();
    expect(component.tableGlobalFilterFields()).toEqual(['name', 'price']);
  });

  it('muestra una fila por registro con el importe formateado', () => {
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelectorAll('tbody tr').length).toBe(2);
    expect(element.textContent).toContain('15.50');
  });

  it('al seleccionar emite la fila y al deseleccionar emite null', () => {
    fixture.detectChanges();
    const emitted: (RowMock | null)[] = [];
    component.onSelection.subscribe(row => emitted.push(row));

    component.onRowSelect({ data: rows[0] } as never);
    component.onRowUnselect();

    expect(emitted).toEqual([rows[0], null]);
    expect(component.selectedItem()).toBeNull();
  });

  it('reload deselecciona, pide datos al padre y vuelve a la primera página', () => {
    fixture.detectChanges();
    let requested = 0;
    component.requestData.subscribe(() => requested++);
    component.onRowSelect({ data: rows[1] } as never);
    component.table().first = 10;

    component.reload();

    expect(requested).toBe(1);
    expect(component.selectedItem()).toBeNull();
    expect(component.table().first).toBe(0);
  });
});
