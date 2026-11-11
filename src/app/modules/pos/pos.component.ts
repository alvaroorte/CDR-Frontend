import { Component, OnInit, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { HttpStatusCode } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { LABELS } from '@core/constants/labels';
import { MESSAGES } from '@core/constants/messages';
import { ROLES_CODE_SYSTEM } from '@core/enums/roles';
import { FormattedHttpError } from '@core/interfaces/http-error-handling.interface';
import { Order, OrderQuote } from '@core/models/order';
import { PosCatalog, PosProduct } from '@core/models/pos-catalog';
import { TableMarkerAvailability } from '@core/models/table-marker';
import { CashSessionService } from '@core/services/cash-session.service';
import { HelpersService } from '@core/services/helpers.service';
import { LoginService } from '@core/services/login.service';
import { OrderWsService } from '@core/services/order-ws.service';
import { CartPanelComponent } from './components/cart-panel/cart-panel.component';
import { CheckoutComponent, ICheckoutData } from './components/checkout/checkout.component';
import { IProductConfigured, ModalProductConfigComponent } from './components/modal-product-config/modal-product-config.component';
import { ProductGridComponent } from './components/product-grid/product-grid.component';
import { CartService } from './services/cart.service';
import { PosService } from './services/pos.service';
import { PosModule } from './pos.module';

/**
 * Contenedor del POS: carga catálogo y caja, orquesta carrito → cobro → registro.
 * Las llamadas HTTP se hacen aquí; los hijos son presentacionales (skill frontend-component §2).
 */
@Component({
  selector: 'app-pos',
  imports: [PosModule, RouterLink, ProductGridComponent, ModalProductConfigComponent, CartPanelComponent, CheckoutComponent],
  templateUrl: './pos.component.html'
})
export class PosComponent implements OnInit {

  private posService = inject(PosService);
  private helpersService = inject(HelpersService);
  private loginService = inject(LoginService);
  public cashSessionService = inject(CashSessionService);
  public cart = inject(CartService);

  public readonly labels = LABELS;
  public readonly messages = MESSAGES;

  public readonly catalog = signal<PosCatalog | null>(null);
  public readonly markers = signal<TableMarkerAvailability[]>([]);
  public readonly quote = signal<OrderQuote | null>(null);
  public readonly saving = signal<boolean>(false);
  public readonly createdOrder = signal<Order | null>(null);
  public checkoutVisible = signal<boolean>(false);
  public createdVisible = false;

  public readonly isAdmin = computed(() => this.loginService.rolesUser().includes(ROLES_CODE_SYSTEM.ADMIN));
  public readonly canDiscount = computed(() =>
    this.loginService.haveSomeRole([ROLES_CODE_SYSTEM.ADMIN, ROLES_CODE_SYSTEM.CASHIER]));

  private readonly productConfig = viewChild.required(ModalProductConfigComponent);
  private readonly checkout = viewChild.required(CheckoutComponent);

  constructor() {
    // Agotado / disponible en vivo (/topic/catalog): actualiza la tarjeta sin recargar el catálogo
    const orderWs = inject(OrderWsService);
    effect(() => {
      const event = orderWs.lastCatalogEvent();
      if (event) {
        untracked(() => this.applyAvailability(event.productId, event.available));
      }
    });
  }

  public applyAvailability(productId: number, available: boolean): void {
    this.catalog.update(catalog => catalog && {
      ...catalog,
      categories: catalog.categories.map(category => ({
        ...category,
        products: category.products.map(p => p.id === productId ? { ...p, available } : p)
      }))
    });
  }

  ngOnInit(): void {
    this.loadCatalog();
    this.cashSessionService.refresh().subscribe();
  }

  public loadCatalog(): void {
    this.posService.getCatalog().subscribe(catalog => this.catalog.set(catalog));
  }

  /** Sin adicionales entra directo al carrito (1 unidad); con adicionales abre la configuración. */
  public onProductSelected(product: PosProduct): void {
    if (product.addons.length === 0) {
      this.cart.addLine(product, 1, [], null);
      return;
    }
    this.productConfig().open(product);
  }

  public onProductConfigured(config: IProductConfigured): void {
    this.cart.addLine(config.product, config.quantity, config.addons, config.notes);
  }

  public openCheckout(): void {
    if (!this.cashSessionService.isOpen()) {
      this.helpersService.messageNotification('warn', LABELS.warning, MESSAGES.cashRegisterRequired);
      return;
    }
    this.quote.set(null);
    this.checkout().start();
    this.checkoutVisible.set(true);
  }

  public loadMarkers(): void {
    this.posService.getMarkerAvailability().subscribe(markers => this.markers.set(markers));
  }

  public requestQuote(): void {
    this.quote.set(null);
    this.posService.quote({ items: this.cart.toItemsRequest(), discount: this.cart.toDiscountRequest() }).subscribe({
      next: quote => this.quote.set(quote),
      // El backend rechazó el carrito (p. ej. producto agotado): volver a editar con el catálogo fresco
      error: () => {
        this.checkoutVisible.set(false);
        this.loadCatalog();
      }
    });
  }

  public confirmOrder(data: ICheckoutData): void {
    this.saving.set(true);
    this.posService.create({
      items: this.cart.toItemsRequest(),
      discount: this.cart.toDiscountRequest(),
      ...data,
    }).subscribe({
      next: order => {
        this.saving.set(false);
        this.checkoutVisible.set(false);
        this.cart.clear();
        this.createdOrder.set(order);
        this.createdVisible = true;
        this.helpersService.messageNotification('success', LABELS.ok, MESSAGES.orderCreated(order.codeLabel));
        this.cashSessionService.refresh().subscribe();
      },
      error: (error: FormattedHttpError) => {
        this.saving.set(false);
        if (error.code === HttpStatusCode.Conflict) {
          // Número de mesa tomado por otro cajero: recargar y volver a elegir
          this.loadMarkers();
          this.checkout().backToService();
        }
      }
    });
  }

  public newOrder(): void {
    this.createdVisible = false;
    this.createdOrder.set(null);
  }
}
