import { Component, inject } from '@angular/core';
import { OrderWsService } from '@core/services/order-ws.service';

/** Indicador de conexión en vivo (cocina y seguimiento). Sin conexión, las acciones REST siguen funcionando. */
@Component({
  selector: 'app-connection-status',
  template: `
    <span class="inline-flex align-items-center gap-2 font-semibold" role="status"
      [class.text-green-600]="orderWs.connected()" [class.text-red-500]="!orderWs.connected()">
      <span class="connection-dot border-circle" [class.bg-green-500]="orderWs.connected()" [class.bg-red-500]="!orderWs.connected()"></span>
      {{ orderWs.connected() ? 'En línea' : 'Sin conexión — reconectando…' }}
    </span>
  `,
  styles: [`.connection-dot { width: 10px; height: 10px; display: inline-block; }`]
})
export class ConnectionStatusComponent {
  public readonly orderWs = inject(OrderWsService);
}
