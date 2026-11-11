import { Component, inject, signal } from '@angular/core';
import { ORDER_STATUS_SEVERITY } from '@core/enums/order-status';
import { OrderDetail } from '@core/models/order';
import { PipesModule } from '@core/pipes/pipes.module';
import { OrderService } from '@core/services/order.service';
import { PrimeModules } from '@shared/prime-components/prime-components.module';

/** Detalle de un pedido: fotografías del detalle, totales, pagos y línea de tiempo de estados. */
@Component({
  selector: 'app-modal-order-detail',
  imports: [PrimeModules, PipesModule],
  templateUrl: './modal-order-detail.component.html'
})
export class ModalOrderDetailComponent {

  private orderService = inject(OrderService);

  public readonly order = signal<OrderDetail | null>(null);
  public readonly severity = ORDER_STATUS_SEVERITY;
  public openModal = false;

  public open(id: number): void {
    this.order.set(null);
    this.openModal = true;
    this.orderService.getById(id).subscribe({
      next: order => this.order.set(order),
      error: () => this.openModal = false
    });
  }
}
