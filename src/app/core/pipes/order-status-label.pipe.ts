import { Pipe, PipeTransform } from '@angular/core';
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '@core/enums/order-status';

/**
 * Estado del pedido legible: 'IN_PREPARATION' → 'En preparación'. El backend envía como statusLabel
 * la etiqueta técnica en mayúsculas (EN_PREPARACION); la UI muestra siempre la de ORDER_STATUS_LABELS.
 */
@Pipe({ name: 'orderStatusLabel' })
export class OrderStatusLabelPipe implements PipeTransform {
  transform(status: string | null | undefined): string {
    if (!status) {
      return '';
    }
    return ORDER_STATUS_LABELS[status as ORDER_STATUS] ?? status;
  }
}
