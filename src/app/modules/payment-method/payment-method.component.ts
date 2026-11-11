import { Component, inject, OnInit, signal } from '@angular/core';
import { PaymentMethodService } from './services/payment-method.service';
import { PaymentMethod } from '@core/models/payment-method';
import { PaymentMethodModule } from './payment-method.module';
import { ToolbarComponent } from '@shared/components/toolbar/toolbar.component';
import { ModalDeleteComponent } from '@shared/components/modal-delete/modal-delete.component';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { TableColumn } from '@core/interfaces/table.interface';
import { TableColumnDefinitions } from '@core/utils/table-column-definitions';
import { ModalFormComponent } from './components/modal-form/modal-form.component';

@Component({
    selector: 'app-payment-method',
    imports: [PaymentMethodModule, ToolbarComponent, ModalDeleteComponent, GenericTableComponent, ModalFormComponent],
    templateUrl: './payment-method.component.html'
})
export class PaymentMethodComponent implements OnInit {

  public paymentMethodService = inject(PaymentMethodService);

  public titleTable = "Lista de medios de pago";
  public paymentMethodSelected = signal<PaymentMethod | null>(null);
  public paymentMethods = signal<PaymentMethod[]>([]);
  public tableColumnPaymentMethodDefinitions: TableColumn<PaymentMethod>[] = TableColumnDefinitions.getPaymentMethodsColumnsDefinition();

  ngOnInit(): void {
    this.getPaymentMethods();
  }

  public setPaymentMethod(paymentMethod: PaymentMethod | null): void {
    this.paymentMethodSelected.set(paymentMethod);
  }

  public getPaymentMethods(): void {
    this.paymentMethodService.getAll().subscribe({
      next: (res) => {
        this.paymentMethods.set(res);
      }
    });
  }

  public onTableSelfEmision(table: GenericTableComponent<PaymentMethod>): void {
    this.paymentMethodService.eventTableComponent.set(table);
  }
}
