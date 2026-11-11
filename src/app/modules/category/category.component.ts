import { Component, inject, OnInit, signal } from '@angular/core';
import { CategoryService } from './services/category.service';
import { Category } from '@core/models/category';
import { CategoryModule } from './category.module';
import { ToolbarComponent } from '@shared/components/toolbar/toolbar.component';
import { ModalDeleteComponent } from '@shared/components/modal-delete/modal-delete.component';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { TableColumn } from '@core/interfaces/table.interface';
import { TableColumnDefinitions } from '@core/utils/table-column-definitions';
import { ModalFormComponent } from './components/modal-form/modal-form.component';

@Component({
    selector: 'app-category',
    imports: [CategoryModule, ToolbarComponent, ModalDeleteComponent, GenericTableComponent, ModalFormComponent],
    templateUrl: './category.component.html'
})
export class CategoryComponent implements OnInit {

  public categoryService = inject(CategoryService);

  public titleTable = "Lista de categorías";
  public categorySelected = signal<Category | null>(null);
  public categories = signal<Category[]>([]);
  public tableColumnCategoryDefinitions: TableColumn<Category>[] = TableColumnDefinitions.getCategoriesColumnsDefinition();

  ngOnInit(): void {
    this.getCategories();
  }

  public setCategory(category: Category | null): void {
    this.categorySelected.set(category);
  }

  public getCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (res) => {
        this.categories.set(res);
      }
    });
  }

  public onTableSelfEmision(table: GenericTableComponent<Category>): void {
    this.categoryService.eventTableComponent.set(table);
  }
}
