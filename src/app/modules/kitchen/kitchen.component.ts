import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { HttpStatusCode } from '@angular/common/http';
import { ORDER_STATUS } from '@core/enums/order-status';
import { FormattedHttpError } from '@core/interfaces/http-error-handling.interface';
import { KitchenSettings, OrderBoard } from '@core/models/order';
import { OrderService } from '@core/services/order.service';
import { OrderWsService } from '@core/services/order-ws.service';
import { TickService } from '@core/services/tick.service';
import { ConnectionStatusComponent } from '@shared/components/connection-status/connection-status.component';
import { PrimeModules } from '@shared/prime-components/prime-components.module';
import { KitchenCardComponent } from './components/kitchen-card/kitchen-card.component';

/**
 * Tablero de cocina en tiempo real: PENDIENTE y EN PREPARACIÓN destacados, LISTO compacto.
 * El estado viene de OrderWsService (board + eventos); las acciones van por REST con la versión vista.
 */
@Component({
  selector: 'app-kitchen',
  imports: [PrimeModules, KitchenCardComponent, ConnectionStatusComponent],
  templateUrl: './kitchen.component.html'
})
export class KitchenComponent implements OnInit {

  public readonly orderWs = inject(OrderWsService);
  private orderService = inject(OrderService);
  private tick = inject(TickService);

  public readonly now = this.tick.now;
  public readonly settings = signal<KitchenSettings | null>(null);
  public readonly busy = signal<ReadonlySet<number>>(new Set());
  public readonly soundEnabled = signal(true);

  public readonly pending = computed(() => this.byStatus(ORDER_STATUS.PENDING));
  public readonly inPreparation = computed(() => this.byStatus(ORDER_STATUS.IN_PREPARATION));
  public readonly ready = computed(() => this.byStatus(ORDER_STATUS.READY));

  constructor() {
    // Sonido al llegar un pedido nuevo (patrón playNotificationSound de la referencia)
    effect(() => {
      if (this.orderWs.lastCreated() && this.soundEnabled()) {
        this.playSound();
      }
    });
  }

  ngOnInit(): void {
    this.orderService.getKitchenSettings().subscribe(settings => this.settings.set(settings));
    this.orderWs.resync();
  }

  public changeStatus(order: OrderBoard, toStatus: ORDER_STATUS): void {
    this.setBusy(order.id, true);
    this.orderService.changeStatus(order.id, toStatus, order.version).subscribe({
      next: () => {
        this.setBusy(order.id, false);
        if (!this.orderWs.connected()) {
          this.orderWs.resync();
        }
      },
      error: (error: FormattedHttpError) => {
        this.setBusy(order.id, false);
        if (error.code === HttpStatusCode.Conflict) {
          this.orderWs.resync();   // otro usuario lo cambió: mostrar el estado real
        }
      }
    });
  }

  public toggleSound(): void {
    this.soundEnabled.update(enabled => !enabled);
  }

  public isBusy(id: number): boolean {
    return this.busy().has(id);
  }

  private byStatus(status: ORDER_STATUS): OrderBoard[] {
    return this.orderWs.orders().filter(order => order.status === status);
  }

  private setBusy(id: number, value: boolean): void {
    this.busy.update(current => {
      const next = new Set(current);
      if (value) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  private playSound(): void {
    const audio = new Audio('assets/sounds/new-order.mp3');
    audio.play().catch(() => { /* el navegador bloquea el audio hasta la primera interacción */ });
  }
}
