import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  TemplateRef,
  output,
  input,
  signal,
  computed,
  viewChild
} from '@angular/core';
import { NgClass } from '@angular/common';
import { Table, TableRowSelectEvent } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { TableColumnType } from 'src/app/core/enums/table-column-type.enum';
import { PipesModule } from 'src/app/core/pipes/pipes.module';
import { FilterService } from 'primeng/api';
import { MESSAGES } from 'src/app/core/constants/messages';
import { PrimeModules } from '@shared/prime-components/prime-components.module';
import { LABELS } from '@core/constants/labels';
import { TOOLTIPS } from '@core/constants/tooltips';
import { PLACEHOLDERS } from '@core/constants/placeholder';
import { COMMON } from '@core/constants/common';
import { PrimeTableProps } from '@core/utils/prime-table-props';
import { TableColumn } from '@core/interfaces/table.interface';
import { TABLE_START_INDEX } from '@core/constants/constants';
import { IGenericTable } from '@core/interfaces/generic-table.interface';

/**
 * GenericTableComponent provides a reusable and customizable PrimeNG-based table component
 * for displaying, filtering, and selecting local data with support for templates and column toggling.
 *
 * @template T - Type of the data item displayed in the table.
 */
@Component({
  selector: 'app-generic-table',
  standalone: true,
  providers: [FilterService],
  imports: [PrimeModules, FormsModule, PipesModule, NgClass],
  templateUrl: './generic-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenericTableComponent<T> implements IGenericTable, OnInit {

  /** Reference to the PrimeNgTable. */
  readonly table = viewChild.required<Table>('primeTable');

  /** Emits when the parent should request the table data. */
  readonly requestData = output<void>();

  /** Emits a reference to this component instance. */
  readonly selfEmitter = output<GenericTableComponent<T>>();

  /** Emits the currently selected row, or null if unselected. */
  readonly onSelection = output<T | null>();

  /** Table configuration options like sorting, paginator, etc. */
  readonly tableProps = input<PrimeTableProps>(new PrimeTableProps());

  /** List of data items to display in the table. */
  readonly items = input.required<T[]>();

  /** Column configuration for rendering the table. */
  readonly tableColumnDefinitions = input.required<TableColumn<T>[]>();
  
  /** Title the table. */
  readonly titleTable = input<string>('');

  public readonly messages = MESSAGES;
  public readonly labels = LABELS;
  public readonly common = COMMON;
  public readonly tooltips = TOOLTIPS;
  public readonly placeholders = PLACEHOLDERS;

  /** Default name for the custom date filter. */
  public readonly defaultDateFilterName = 'custom-date-filter';

  /** Currently selected item. */
  public selectedItem = signal<T | null>(null);

  /** Table column format type enum reference. */
  public tableColumnFormatTypes = TableColumnType;

  /** Custom right toolbar template (optional). */
  public rightToolbarTemplate: TemplateRef<any> | null = null;

  /** List of column fields included in global filtering. */
  public readonly tableGlobalFilterFields = computed(() =>
    this.tableColumnDefinitions().filter(c => !c.notfilterByThisfield).map(c => c.field)
  );

  /** List of column fields for show in tooltip. */
  public readonly tooltipFilterFields = computed(() => {
    const titles = this.tableColumnDefinitions().filter(c => !c.notfilterByThisfield).map(c => c.header);
    return 'Este campo busca por: ' + titles.join(', ');
  });

  /** Initializes component state and registers the date filter. */
  ngOnInit() {
    this.initialSetup();    
  }

  /**
   * Applies a global filter to the table using the given input event.
   *
   * @param table - PrimeNG Table instance.
   * @param event - DOM input event.
   */
  public onGlobalFilter(event: Event): void {
    this.table().filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  /**
   * Resets row selection and notifies the parent to reload data.
   */
  public reload(): void {
    this.onRowUnselect();
    this.requestData.emit();
    this.table().first = TABLE_START_INDEX;
  }

  /**
   * Emits the currently selected row.
   *
   * @param selectedRow - The selected data item.
   */
  public onRowSelect(selectedRow: TableRowSelectEvent): void {
    this.emitSelection(selectedRow.data as T);
  }

  /**
   * Emits null to indicate no row is selected.
   */
  public onRowUnselect(): void {
    this.emitSelection(null);
  }

  /**
   * Internal method to handle row selection emission.
   *
   * @param selectedRow - Selected row or null.
   */
  private emitSelection(selectedRow: T | null): void {
    this.selectedItem.set(selectedRow);
    this.onSelection.emit(selectedRow);
  }

  /** Performs initial column and filter setup. */
  private initialSetup(): void {
    this.selfEmitter.emit(this);
  }

}

