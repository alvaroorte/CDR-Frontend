import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ProductService } from './services/product.service';
import { Product } from '@core/models/product';
import { ProductModule } from './product.module';
import { ToolbarComponent } from '@shared/components/toolbar/toolbar.component';
import { ModalDeleteComponent } from '@shared/components/modal-delete/modal-delete.component';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { TableColumn } from '@core/interfaces/table.interface';
import { TableColumnDefinitions } from '@core/utils/table-column-definitions';
import { ModalFormComponent } from './components/modal-form/modal-form.component';
import { LoginService } from '@core/services/login.service';
import { HelpersService } from '@core/services/helpers.service';
import { ROLES_CODE_SYSTEM } from '@core/enums/roles';
import { MESSAGES } from '@core/constants/messages';
import { Severity } from '@core/enums/severity';

/**
 * CRUD de productos (patrón schedule). El CAJERO solo ve el listado y el botón agotado/disponible;
 * el backend le niega igualmente cualquier otra escritura (403).
 */
@Component({
    selector: 'app-product',
    imports: [ProductModule, ToolbarComponent, ModalDeleteComponent, GenericTableComponent, ModalFormComponent],
    templateUrl: './product.component.html'
})
export class ProductComponent implements OnInit {

  public productService = inject(ProductService);
  private loginService = inject(LoginService);
  private helpersService = inject(HelpersService);

  public titleTable = "Lista de productos";
  public productSelected = signal<Product | null>(null);
  public products = signal<Product[]>([]);
  public tableColumnProductDefinitions: TableColumn<Product>[] = TableColumnDefinitions.getProductsColumnsDefinition();
  public readonly isAdmin = computed(() => this.loginService.haveSomeRole([ROLES_CODE_SYSTEM.ADMIN]));
  public readonly availabilityTooltip = computed(() =>
    this.productSelected()?.available ? 'Marcar como agotado' : 'Marcar como disponible');

  ngOnInit(): void {
    this.getProducts();
  }

  public setProduct(product: Product | null): void {
    this.productSelected.set(product);
  }

  public getProducts(): void {
    this.productService.getAll().subscribe({
      next: (res) => {
        this.products.set(res);
      }
    });
  }

  public onTableSelfEmision(table: GenericTableComponent<Product>): void {
    this.productService.eventTableComponent.set(table);
  }

  public toggleAvailability(): void {
    const product = this.productSelected();
    if (!product) {
      this.helpersService.messageNotification(Severity.warn, "Por favor", MESSAGES.selectARow);
      return;
    }
    const available = !product.available;
    this.productService.changeAvailability(product.id, available).subscribe({
      next: (res) => {
        this.helpersService.messageNotification(Severity.success, "Correcto",
          available ? MESSAGES.productMarkedAvailable(res.name) : MESSAGES.productMarkedUnavailable(res.name));
      },
      complete: () => {
        this.productService.eventTableComponent()?.reload();
      }
    });
  }
}
