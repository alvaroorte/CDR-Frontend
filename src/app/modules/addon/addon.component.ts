import { Component, inject, OnInit, signal } from '@angular/core';
import { AddonService } from './services/addon.service';
import { Addon } from '@core/models/addon';
import { AddonModule } from './addon.module';
import { ToolbarComponent } from '@shared/components/toolbar/toolbar.component';
import { ModalDeleteComponent } from '@shared/components/modal-delete/modal-delete.component';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { TableColumn } from '@core/interfaces/table.interface';
import { TableColumnDefinitions } from '@core/utils/table-column-definitions';
import { ModalFormComponent } from './components/modal-form/modal-form.component';

@Component({
    selector: 'app-addon',
    imports: [AddonModule, ToolbarComponent, ModalDeleteComponent, GenericTableComponent, ModalFormComponent],
    templateUrl: './addon.component.html'
})
export class AddonComponent implements OnInit {

  public addonService = inject(AddonService);

  public titleTable = "Lista de adicionales";
  public addonSelected = signal<Addon | null>(null);
  public addons = signal<Addon[]>([]);
  public tableColumnAddonDefinitions: TableColumn<Addon>[] = TableColumnDefinitions.getAddonsColumnsDefinition();

  ngOnInit(): void {
    this.getAddons();
  }

  public setAddon(addon: Addon | null): void {
    this.addonSelected.set(addon);
  }

  public getAddons(): void {
    this.addonService.getAll().subscribe({
      next: (res) => {
        this.addons.set(res);
      }
    });
  }

  public onTableSelfEmision(table: GenericTableComponent<Addon>): void {
    this.addonService.eventTableComponent.set(table);
  }
}
