import { Component, inject, OnInit, signal } from '@angular/core';
import { ParameterService } from './services/parameter.service';
import { Parameter } from '@core/models/parameter';
import { ParameterModule } from './parameter.module';
import { ToolbarComponent } from '@shared/components/toolbar/toolbar.component';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { TableColumn } from '@core/interfaces/table.interface';
import { TableColumnDefinitions } from '@core/utils/table-column-definitions';
import { ModalFormComponent } from './components/modal-form/modal-form.component';

@Component({
    selector: 'app-parameter',
    imports: [ParameterModule, ToolbarComponent, GenericTableComponent, ModalFormComponent],
    templateUrl: './parameter.component.html'
})
export class ParameterComponent implements OnInit {

  public parameterService = inject(ParameterService);

  public titleTable = "Lista de parámetros";
  public parameterSelected = signal<Parameter | null>(null);
  public parameters = signal<Parameter[]>([]);
  public tableColumnParameterDefinitions: TableColumn<Parameter>[] = TableColumnDefinitions.getParametersColumnsDefinition();

  ngOnInit(): void {
    this.getParameters();
  }

  public setParameter(parameter: Parameter | null): void {
    this.parameterSelected.set(parameter);
  }

  public getParameters(): void {
    this.parameterService.getAll().subscribe({
      next: (res) => {
        this.parameters.set(res);
      }
    });
  }

  public onTableSelfEmision(table: GenericTableComponent<Parameter>): void {
    this.parameterService.eventTableComponent.set(table);
  }
}
