import { Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { HttpStatusCode } from '@angular/common/http';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TableLazyLoadEvent } from 'primeng/table';
import { ORDER_STATUS, ORDER_STATUS_LABELS, ORDER_STATUS_SEVERITY } from '@core/enums/order-status';
import { ROLES_CODE_SYSTEM } from '@core/enums/roles';
import { SERVICE_TYPE, SERVICE_TYPE_LABELS } from '@core/enums/service-type';
import { FormattedHttpError } from '@core/interfaces/http-error-handling.interface';
import { OrderBoard, OrderHistoryFilter, OrderListItem } from '@core/models/order';
import { PipesModule } from '@core/pipes/pipes.module';
import { CashSessionService } from '@core/services/cash-session.service';
import { HelpersService } from '@core/services/helpers.service';
import { LoginService } from '@core/services/login.service';
import { OrderService } from '@core/services/order.service';
import { OrderWsService } from '@core/services/order-ws.service';
import { TickService } from '@core/services/tick.service';
import { elapsedMinutes, formatElapsed } from '@core/utils/elapsed';
import { ConnectionStatusComponent } from '@shared/components/connection-status/connection-status.component';
import { PrimeModules } from '@shared/prime-components/prime-components.module';
import { ICancelRequest, ICancelTarget, ModalCancelComponent } from './components/modal-cancel/modal-cancel.component';
import { ModalOrderDetailComponent } from './components/modal-order-detail/modal-order-detail.component';

/** Formatea un Date como fecha de negocio 'YYYY-MM-DD' (hora local del navegador). */
export function toIsoDate(date: Date | null): string | null {
  if (!date) {
    return null;
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Pedidos: "En curso" en vivo (entregar / cancelar) e "Historial" paginado con filtros y detalle.
 * Las acciones envían la versión vista; un 409 recarga el tablero.
 */
@Component({
  selector: 'app-orders',
  imports: [PrimeModules, PipesModule, ReactiveFormsModule, FormsModule, ConnectionStatusComponent,
    ModalOrderDetailComponent, ModalCancelComponent],
  templateUrl: './orders.component.html'
})
export class OrdersComponent implements OnInit {

  public readonly orderWs = inject(OrderWsService);
  private orderService = inject(OrderService);
  private loginService = inject(LoginService);
  private cashSessionService = inject(CashSessionService);
  private helpersService = inject(HelpersService);
  private tick = inject(TickService);
  private formBuilder = inject(FormBuilder);

  public readonly ORDER_STATUS = ORDER_STATUS;
  public readonly severity = ORDER_STATUS_SEVERITY;
  public readonly statusOptions = Object.values(ORDER_STATUS).map(value => ({ value, label: ORDER_STATUS_LABELS[value] }));
  public readonly serviceTypeOptions = Object.values(SERVICE_TYPE).map(value => ({ value, label: SERVICE_TYPE_LABELS[value] }));

  public activeTab: 'live' | 'history' = 'live';
  public readonly busy = signal<ReadonlySet<number>>(new Set());
  public readonly cancelling = signal(false);
  public readonly isAdmin = computed(() => this.loginService.rolesUser().includes(ROLES_CODE_SYSTEM.ADMIN));

  /** Listos primero (hay que entregarlos), luego el resto por antigüedad. */
  public readonly liveOrders = computed(() => {
    const orders = this.orderWs.orders();
    return [...orders.filter(o => o.status === ORDER_STATUS.READY), ...orders.filter(o => o.status !== ORDER_STATUS.READY)];
  });

  // ----- Historial -----
  public readonly history = signal<OrderListItem[]>([]);
  public readonly totalRecords = signal(0);
  public readonly loadingHistory = signal(false);
  public readonly rows = 10;
  private lastLazy: TableLazyLoadEvent = { first: 0, rows: this.rows };

  public formFilter = this.formBuilder.group({
    dates: this.formBuilder.control<Date[] | null>([new Date(), new Date()]),
    status: this.formBuilder.control<ORDER_STATUS | null>(null),
    serviceType: this.formBuilder.control<SERVICE_TYPE | null>(null),
    code: this.formBuilder.control<number | null>(null),
  });

  private readonly detail = viewChild.required(ModalOrderDetailComponent);
  private readonly cancelModal = viewChild.required(ModalCancelComponent);

  ngOnInit(): void {
    this.orderWs.resync();
  }

  public elapsed(order: OrderBoard): string {
    return formatElapsed(elapsedMinutes(order.createdAt, this.tick.now()));
  }

  /** CAJERO solo cancela PENDIENTE; ADMIN cualquier pedido abierto (el backend valida igual). */
  public canCancel(status: ORDER_STATUS): boolean {
    return this.isAdmin() ? status !== ORDER_STATUS.DELIVERED && status !== ORDER_STATUS.CANCELLED
      : status === ORDER_STATUS.PENDING;
  }

  public statusSeverity(status: ORDER_STATUS) {
    return ORDER_STATUS_SEVERITY[status];
  }

  public isBusy(id: number): boolean {
    return this.busy().has(id);
  }

  public deliver(order: OrderBoard): void {
    this.setBusy(order.id, true);
    this.orderService.changeStatus(order.id, ORDER_STATUS.DELIVERED, order.version).subscribe({
      next: () => {
        this.setBusy(order.id, false);
        this.helpersService.messageNotification('success', 'Correcto', `Pedido ${order.codeLabel} entregado`);
        this.afterAction();
      },
      error: (error: FormattedHttpError) => this.onActionError(order.id, error)
    });
  }

  public openCancel(order: ICancelTarget): void {
    this.cancelModal().open({ id: order.id, codeLabel: order.codeLabel, version: order.version, total: order.total });
  }

  public cancel(request: ICancelRequest): void {
    this.cancelling.set(true);
    this.orderService.cancel(request.target.id, request.reason, request.target.version).subscribe({
      next: () => {
        this.cancelling.set(false);
        this.cancelModal().close();
        this.helpersService.messageNotification('success', 'Correcto', `Pedido ${request.target.codeLabel} cancelado`);
        this.afterAction();
        this.cashSessionService.refresh().subscribe();
        if (this.activeTab === 'history') {
          this.loadHistory(this.lastLazy);
        }
      },
      error: (error: FormattedHttpError) => {
        this.cancelling.set(false);
        if (error.code === HttpStatusCode.Conflict) {
          this.cancelModal().close();
          this.orderWs.resync();
        }
      }
    });
  }

  public openDetail(id: number): void {
    this.detail().open(id);
  }

  public loadHistory(event: TableLazyLoadEvent): void {
    this.lastLazy = event;
    const rows = event.rows ?? this.rows;
    const page = Math.floor((event.first ?? 0) / rows);
    this.loadingHistory.set(true);
    this.orderService.getPageable(page, rows, this.buildFilter()).subscribe({
      next: result => {
        this.history.set(result.content);
        this.totalRecords.set(result.totalElements);
        this.loadingHistory.set(false);
      },
      error: () => this.loadingHistory.set(false)
    });
  }

  public search(): void {
    this.loadHistory({ ...this.lastLazy, first: 0 });
  }

  public clearFilters(): void {
    this.formFilter.reset({ dates: [new Date(), new Date()], status: null, serviceType: null, code: null });
    this.search();
  }

  public buildFilter(): OrderHistoryFilter {
    const { dates, status, serviceType, code } = this.formFilter.getRawValue();
    const from = dates?.[0] ?? null;
    const to = dates?.[1] ?? from;
    return { dateFrom: toIsoDate(from), dateTo: toIsoDate(to), status, serviceType, code };
  }

  private afterAction(): void {
    if (!this.orderWs.connected()) {
      this.orderWs.resync();
    }
  }

  private onActionError(id: number, error: FormattedHttpError): void {
    this.setBusy(id, false);
    if (error.code === HttpStatusCode.Conflict) {
      this.orderWs.resync();
    }
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
}
