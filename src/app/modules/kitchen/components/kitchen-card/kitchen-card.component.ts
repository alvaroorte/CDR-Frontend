import { Component, computed, input, output } from '@angular/core';
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '@core/enums/order-status';
import { SERVICE_TYPE } from '@core/enums/service-type';
import { KitchenSettings, OrderBoard } from '@core/models/order';
import { elapsedMinutes, formatElapsed } from '@core/utils/elapsed';
import { PrimeModules } from '@shared/prime-components/prime-components.module';

export type DelayLevel = 'ok' | 'warn' | 'critical';

/** Siguiente paso de cocina y paso atrás (decisión Etapa 4: se puede retroceder uno). */
export const KITCHEN_NEXT: Partial<Record<ORDER_STATUS, ORDER_STATUS>> = {
  [ORDER_STATUS.PENDING]: ORDER_STATUS.IN_PREPARATION,
  [ORDER_STATUS.IN_PREPARATION]: ORDER_STATUS.READY,
};
export const KITCHEN_PREVIOUS: Partial<Record<ORDER_STATUS, ORDER_STATUS>> = {
  [ORDER_STATUS.IN_PREPARATION]: ORDER_STATUS.PENDING,
  [ORDER_STATUS.READY]: ORDER_STATUS.IN_PREPARATION,
};

export function delayLevel(minutes: number, settings: KitchenSettings | null): DelayLevel {
  if (!settings) {
    return 'ok';
  }
  if (minutes >= settings.delayCriticalMinutes) {
    return 'critical';
  }
  return minutes >= settings.delayWarningMinutes ? 'warn' : 'ok';
}

/** Tarjeta de un pedido en el tablero: número de mesa grande, detalle, tiempo y botones grandes. */
@Component({
  selector: 'app-kitchen-card',
  imports: [PrimeModules],
  templateUrl: './kitchen-card.component.html'
})
export class KitchenCardComponent {

  public readonly order = input.required<OrderBoard>();
  public readonly now = input.required<number>();
  public readonly settings = input<KitchenSettings | null>(null);
  public readonly busy = input<boolean>(false);
  public readonly compact = input<boolean>(false);
  public readonly advance = output<ORDER_STATUS>();
  public readonly back = output<ORDER_STATUS>();

  public readonly SERVICE_TYPE = SERVICE_TYPE;
  public readonly minutes = computed(() => elapsedMinutes(this.order().createdAt, this.now()));
  public readonly elapsed = computed(() => formatElapsed(this.minutes()));
  /** Las demoras solo se marcan mientras el pedido no está listo. */
  public readonly level = computed<DelayLevel>(() =>
    this.order().status === ORDER_STATUS.READY ? 'ok' : delayLevel(this.minutes(), this.settings()));
  public readonly next = computed(() => KITCHEN_NEXT[this.order().status] ?? null);
  public readonly previous = computed(() => KITCHEN_PREVIOUS[this.order().status] ?? null);
  public readonly nextLabel = computed(() => {
    const next = this.next();
    return next === ORDER_STATUS.IN_PREPARATION ? 'Preparar' : next === ORDER_STATUS.READY ? 'Listo' : '';
  });
  public readonly previousLabel = computed(() => {
    const previous = this.previous();
    return previous ? `Volver a ${ORDER_STATUS_LABELS[previous].toLowerCase()}` : '';
  });
}
