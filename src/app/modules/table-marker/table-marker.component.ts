import { Component, inject, OnInit, signal } from '@angular/core';
import { TableMarkerService } from './services/table-marker.service';
import { TableMarker } from '@core/models/table-marker';
import { TableMarkerModule } from './table-marker.module';
import { ToolbarComponent } from '@shared/components/toolbar/toolbar.component';
import { ModalDeleteComponent } from '@shared/components/modal-delete/modal-delete.component';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { TableColumn } from '@core/interfaces/table.interface';
import { TableColumnDefinitions } from '@core/utils/table-column-definitions';
import { ModalFormComponent } from './components/modal-form/modal-form.component';

@Component({
    selector: 'app-table-marker',
    imports: [TableMarkerModule, ToolbarComponent, ModalDeleteComponent, GenericTableComponent, ModalFormComponent],
    templateUrl: './table-marker.component.html'
})
export class TableMarkerComponent implements OnInit {

  public tableMarkerService = inject(TableMarkerService);

  public titleTable = "Lista de números de mesa";
  public tableMarkerSelected = signal<TableMarker | null>(null);
  public tableMarkers = signal<TableMarker[]>([]);
  public tableColumnTableMarkerDefinitions: TableColumn<TableMarker>[] = TableColumnDefinitions.getTableMarkersColumnsDefinition();

  ngOnInit(): void {
    this.getTableMarkers();
  }

  public setTableMarker(tableMarker: TableMarker | null): void {
    this.tableMarkerSelected.set(tableMarker);
  }

  public getTableMarkers(): void {
    this.tableMarkerService.getAll().subscribe({
      next: (res) => {
        this.tableMarkers.set(res);
      }
    });
  }

  public onTableSelfEmision(table: GenericTableComponent<TableMarker>): void {
    this.tableMarkerService.eventTableComponent.set(table);
  }
}
