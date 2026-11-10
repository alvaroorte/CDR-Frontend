---
name: realtime-ws
description: Estándar de cdr-frontend para la comunicación en tiempo real con cdr-backend mediante STOMP/SockJS — conexión autenticada con JWT, suscripción a /topic/orders y /topic/catalog, resincronización inicial y tras reconexión, descarte de eventos duplicados por versión, indicador de conexión y sonido de nuevo pedido. Úsala siempre que se toque OrderWsService, el tablero de cocina, el seguimiento de pedidos en vivo, la disponibilidad de productos en vivo o cualquier suscripción WebSocket.
---

# Tiempo real (cliente) — cdr-frontend

Basado en `../ticket-frontend/src/app/core/services/message.service.ts` (`MessageWsService`:
`@stomp/stompjs` `Client` + `SockJS`, `reconnectDelay: 3000`). Contrato del servidor y eventos en
`../cdr-backend/docs/architecture/realtime.md` y skill `cdr-order-management` §11.

## 1. Diferencias aprobadas respecto a la referencia

| Referencia | cdr-frontend |
|---|---|
| Conexión sin token | `connectHeaders.Authorization = 'Bearer ' + token` en `beforeConnect` (token vigente) |
| `EventEmitter` en el servicio (`eventOnConnect`, ...) | Signals (`connected`, `orders`) |
| Topics por email de usuario | `/topic/orders`, `/topic/catalog` (autorizados por rol en el servidor) |
| Sin resync | `GET /order/board` en **cada** `onConnect` |
| Sin control de duplicados | Descarta eventos con `version <=` la local |

## 2. Servicio — `core/services/order-ws.service.ts`

```ts
@Injectable({ providedIn: 'root' })
export class OrderWsService {
  private readonly localStorageService = inject(LocalStorageService);
  private readonly orderService = inject(OrderService);          // REST /order/board
  private readonly serverUrlWs = `${environment.server_url}ws-cdr`;
  private client: Client | null = null;

  private readonly _connected = signal(false);
  private readonly _orders = signal<ReadonlyMap<number, IOrderBoard>>(new Map());
  public readonly connected = this._connected.asReadonly();
  public readonly orders = computed(() => [...this._orders().values()]);
  public readonly lastCreated = signal<IOrderBoard | null>(null);   // para sonido/aviso

  public connect(statuses: OrderStatus[]): void {
    if (this.client?.active) return;
    this.client = new Client({
      webSocketFactory: () => new SockJS(this.serverUrlWs),
      reconnectDelay: 3000,
      beforeConnect: async () => {
        this.client!.connectHeaders = { Authorization: `Bearer ${this.localStorageService.getItem(LOCAL_STORAGE.TOKEN)}` };
      },
      onConnect: () => {
        this._connected.set(true);
        this.client!.subscribe('/topic/orders', (msg: IMessage) => this.apply(JSON.parse(msg.body) as IOrderEvent));
        this.resync(statuses);                     // SIEMPRE después de suscribirse
      },
      onWebSocketClose: () => this._connected.set(false),
      onStompError: () => this._connected.set(false),
    });
    this.client.activate();
  }

  public disconnect(): void {
    void this.client?.deactivate();
    this.client = null;
    this._connected.set(false);
    this._orders.set(new Map());
  }

  private resync(statuses: OrderStatus[]): void {
    this.orderService.getBoard(statuses).subscribe({
      next: (board) => this._orders.set(new Map(board.map(o => [o.id, o]))),
    });
  }

  private apply(event: IOrderEvent): void {
    const current = this._orders().get(event.orderId);
    if (current && event.version <= current.version) return;          // duplicado / desordenado
    const next = new Map(this._orders());
    if (event.status === 'ENTREGADO' || event.status === 'CANCELADO') next.delete(event.orderId);
    else next.set(event.orderId, event.order);
    this._orders.set(next);
    if (event.type === 'ORDER_CREATED') this.lastCreated.set(event.order);
  }
}
```

Notas:
- Suscribirse **antes** de pedir el board: así ningún evento queda entre medio; si llega un evento
  antes que la respuesta REST, el `set` del board puede pisarlo — por eso `resync` debe **fusionar**
  quedándose con la mayor `version` por pedido (implementarlo así; el ejemplo lo simplifica).
- Qué estados retirar depende de la vista: cocina retira ENTREGADO/CANCELADO; seguimiento del cajero
  puede conservarlos el día. Parametrizar con el filtro `statuses`.
- `connect` se llama desde el contenedor de la pantalla (cocina, seguimiento) o desde el header tras
  login; `disconnect` en logout (`LoginService.logout`).
- Sonido: `effect()` sobre `lastCreated` en la pantalla de cocina → `new Audio('assets/sounds/new-order.mp3').play()`
  (patrón `playNotificationSound` de la referencia).

## 3. Interfaces (`core/interfaces/order-event.interface.ts`)

```ts
export type OrderEventType = 'ORDER_CREATED' | 'ORDER_STATUS_CHANGED' | 'ORDER_CANCELLED';
export interface IOrderEvent {
  eventId: string; type: OrderEventType; orderId: number; version: number;
  status: OrderStatus; occurredAt: string; order: IOrderBoard;
}
```
`OrderStatus` = etiquetas españolas que expone la API (`'PENDIENTE' | 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO' | 'CANCELADO'`)
en `core/enums/order-status.enum.ts`.

## 4. UI de conexión

`shared/components/connection-status`: punto verde "En línea" / rojo "Reconectando..." leyendo
`orderWsService.connected()`. Mientras está desconectado, las acciones REST siguen funcionando; el
409 por versión evita inconsistencias.

## 5. Tests (Vitest)

- `apply`: ignora versión igual/menor; reemplaza con versión mayor; retira entregados/cancelados;
  marca `lastCreated` en `ORDER_CREATED`.
- `resync`: reemplaza/fusiona el mapa con la respuesta del board.
- No se prueba la librería STOMP: aislar `Client` detrás de una fábrica inyectable si hace falta.

## 6. Checklist

- [ ] Token en `beforeConnect` (siempre el vigente tras refresh).
- [ ] Suscripción y luego resync en cada `onConnect`.
- [ ] Dedupe por `version`; fusión por mayor versión en el resync.
- [ ] Signals readonly expuestos; sin `EventEmitter`.
- [ ] `disconnect` en logout.
- [ ] Indicador de conexión visible en cocina y seguimiento.
