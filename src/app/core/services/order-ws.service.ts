import { Injectable, InjectionToken, computed, inject, signal } from '@angular/core';
import { Client, IMessage, StompConfig } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '@core/environments/environment.development';
import { LOCAL_STORAGE } from '@core/constants/local-storage';
import { OPEN_ORDER_STATUSES } from '@core/enums/order-status';
import { CatalogEvent, OrderBoard, OrderEvent } from '@core/models/order';
import { LocalStorageService } from './local-storage.service';
import { OrderService } from './order.service';

export const TOPIC_ORDERS = '/topic/orders';
export const TOPIC_CATALOG = '/topic/catalog';

/** Fábrica del cliente STOMP: inyectable para poder sustituirla en los tests. */
export const STOMP_CLIENT_FACTORY = new InjectionToken<(config: StompConfig) => Client>('STOMP_CLIENT_FACTORY', {
  providedIn: 'root',
  factory: () => (config: StompConfig) => new Client(config),
});

/**
 * Tiempo real (skill realtime-ws): STOMP/SockJS como la referencia, con JWT en el CONNECT,
 * resincronización con GET /order/board en CADA conexión y descarte de eventos con versión
 * menor o igual a la conocida. Mantiene los pedidos ABIERTOS (cocina y seguimiento).
 */
@Injectable({
  providedIn: 'root'
})
export class OrderWsService {

  private readonly localStorageService = inject(LocalStorageService);
  private readonly orderService = inject(OrderService);
  private readonly clientFactory = inject(STOMP_CLIENT_FACTORY);
  private readonly serverUrlWs = `${environment.server_url}ws-cdr`;
  private client: Client | null = null;

  private readonly _connected = signal(false);
  private readonly _orders = signal<ReadonlyMap<number, OrderBoard>>(new Map());
  /** Versión más alta vista por pedido, aunque ya no esté en el tablero (evita revivir pedidos cerrados). */
  private readonly versions = new Map<number, number>();

  public readonly connected = this._connected.asReadonly();
  /** Pedidos abiertos, del más antiguo al más reciente. */
  public readonly orders = computed(() =>
    [...this._orders().values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id));
  /** Último pedido creado (sonido / aviso en cocina). */
  public readonly lastCreated = signal<OrderBoard | null>(null);
  /** Último cambio de disponibilidad de producto (POS). */
  public readonly lastCatalogEvent = signal<CatalogEvent | null>(null);

  /** Conecta una sola vez por sesión. {@code withCatalog}: suscribir /topic/catalog (ADMIN, CAJERO). */
  public connect(withCatalog: boolean): void {
    if (this.client?.active) {
      return;
    }
    const client = this.clientFactory({
      webSocketFactory: () => new SockJS(this.serverUrlWs),
      reconnectDelay: 3000,
      beforeConnect: async () => {
        // Siempre el token vigente (el interceptor HTTP pudo refrescarlo)
        client.connectHeaders = { Authorization: `Bearer ${this.localStorageService.get(LOCAL_STORAGE.TOKEN) ?? ''}` };
      },
      onConnect: () => {
        this._connected.set(true);
        client.subscribe(TOPIC_ORDERS, (message: IMessage) => this.apply(JSON.parse(message.body) as OrderEvent));
        if (withCatalog) {
          client.subscribe(TOPIC_CATALOG, (message: IMessage) =>
            this.lastCatalogEvent.set(JSON.parse(message.body) as CatalogEvent));
        }
        this.resync();   // después de suscribirse: ningún evento queda entre medio
      },
      onWebSocketClose: () => this._connected.set(false),
      onStompError: () => this._connected.set(false),
    });
    this.client = client;
    client.activate();
  }

  public disconnect(): void {
    void this.client?.deactivate();
    this.client = null;
    this._connected.set(false);
    this._orders.set(new Map());
    this.versions.clear();
    this.lastCreated.set(null);
    this.lastCatalogEvent.set(null);
  }

  /** Recarga el tablero (también útil tras un 409 o al volver a la pantalla). */
  public resync(): void {
    this.orderService.getBoard(OPEN_ORDER_STATUSES).subscribe(board => this.merge(board));
  }

  /**
   * Fusiona el board: el board manda sobre qué pedidos están abiertos, pero si un evento más nuevo
   * llegó antes que la respuesta REST, se conserva la versión mayor.
   */
  public merge(board: OrderBoard[]): void {
    const current = this._orders();
    const next = new Map<number, OrderBoard>();
    for (const order of board) {
      const local = current.get(order.id);
      const keep = local && local.version > order.version ? local : order;
      next.set(order.id, keep);
      this.versions.set(order.id, Math.max(this.versions.get(order.id) ?? -1, keep.version));
    }
    this._orders.set(next);
  }

  public apply(event: OrderEvent): void {
    if (this.applyOrder(event.order) && event.type === 'ORDER_CREATED') {
      this.lastCreated.set(event.order);
    }
  }

  /** @returns false si el cambio era duplicado o desordenado (versión ≤ la conocida). */
  private applyOrder(order: OrderBoard): boolean {
    const known = this.versions.get(order.id);
    if (known !== undefined && order.version <= known) {
      return false;
    }
    this.versions.set(order.id, order.version);
    const next = new Map(this._orders());
    if (OPEN_ORDER_STATUSES.includes(order.status)) {
      next.set(order.id, order);
    } else {
      next.delete(order.id);
    }
    this._orders.set(next);
    return true;
  }
}
