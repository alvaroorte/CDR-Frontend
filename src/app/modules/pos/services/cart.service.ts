import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { LoginService } from '@core/services/login.service';
import { DISCOUNT_TYPE } from '@core/enums/discount-type';
import { DiscountRequest, OrderItemRequest } from '@core/models/order';
import { PosAddon, PosProduct } from '@core/models/pos-catalog';
import { previewDiscountAmount, round2 } from '@core/utils/money';

/** Línea del carrito. Los precios son solo para la VISTA PREVIA; nunca se envían al backend. */
export interface ICartLine {
  key: string;
  productId: number;
  productName: string;
  unitPrice: number;
  addons: PosAddon[];
  quantity: number;
  notes: string | null;
}

export interface ICartDiscount {
  type: DISCOUNT_TYPE;
  value: number;
  reason: string | null;
}

/**
 * Estado del carrito del POS con signals (skill frontend-component §3).
 * Subtotal/descuento/total son VISTA PREVIA: el resumen final viene de POST /order/quote.
 */
@Injectable({
  providedIn: 'root'
})
export class CartService {

  private readonly _lines = signal<ICartLine[]>([]);
  private readonly _discount = signal<ICartDiscount | null>(null);

  public readonly lines = this._lines.asReadonly();
  public readonly discount = this._discount.asReadonly();

  public readonly isEmpty = computed(() => this._lines().length === 0);
  public readonly itemCount = computed(() => this._lines().reduce((acc, l) => acc + l.quantity, 0));
  public readonly subtotal = computed(() =>
    round2(this._lines().reduce((acc, l) => acc + this.lineSubtotal(l), 0)));
  public readonly discountAmount = computed(() => {
    const d = this._discount();
    return previewDiscountAmount(this.subtotal(), d?.type ?? null, d?.value ?? null);
  });
  public readonly discountPercent = computed(() =>
    this.subtotal() > 0 ? round2(this.discountAmount() * 100 / this.subtotal()) : 0);
  public readonly total = computed(() => Math.max(0, round2(this.subtotal() - this.discountAmount())));

  constructor() {
    // Al cerrar sesión se vacía: el siguiente usuario no hereda el pedido en curso.
    const loginService = inject(LoginService);
    effect(() => {
      if (!loginService.isLoggedIn()) {
        untracked(() => this.clear());
      }
    });
  }

  public lineSubtotal(line: ICartLine): number {
    const addonsTotal = line.addons.reduce((acc, a) => acc + a.price, 0);
    return round2((line.unitPrice + addonsTotal) * line.quantity);
  }

  /**
   * Agrega un producto. Si ya existe una línea idéntica (mismos adicionales y observaciones) suma la
   * cantidad; si no, crea una línea nueva.
   */
  public addLine(product: PosProduct, quantity: number, addons: PosAddon[], notes: string | null): void {
    const sortedAddons = [...addons].sort((a, b) => a.id - b.id);
    const cleanNotes = this.cleanNotes(notes);
    const key = this.buildKey(product.id, sortedAddons, cleanNotes);
    this._lines.update(lines => {
      const existing = lines.find(l => l.key === key);
      if (existing) {
        return lines.map(l => l.key === key ? { ...l, quantity: Math.min(999, l.quantity + quantity) } : l);
      }
      return [...lines, {
        key, productId: product.id, productName: product.name, unitPrice: product.price,
        addons: sortedAddons, quantity, notes: cleanNotes
      }];
    });
  }

  public updateQuantity(key: string, quantity: number): void {
    if (quantity < 1) {
      this.removeLine(key);
      return;
    }
    this._lines.update(lines => lines.map(l => l.key === key ? { ...l, quantity: Math.min(999, quantity) } : l));
  }

  /**
   * Agrega, cambia o quita (vacío) la observación de una línea. Las observaciones forman parte de la
   * identidad de la línea: si ya existe otra igual (mismo producto, adicionales y observación) se fusionan
   * sumando cantidades, en la posición de la línea editada.
   */
  public updateNotes(key: string, notes: string | null): void {
    this._lines.update(lines => {
      const line = lines.find(l => l.key === key);
      if (!line) {
        return lines;
      }
      const cleanNotes = this.cleanNotes(notes);
      const newKey = this.buildKey(line.productId, line.addons, cleanNotes);
      if (newKey === key) {
        return lines;
      }
      const twin = lines.find(l => l.key === newKey);
      return lines
        .filter(l => l.key !== newKey)
        .map(l => l.key === key
          ? { ...l, key: newKey, notes: cleanNotes, quantity: Math.min(999, l.quantity + (twin?.quantity ?? 0)) }
          : l);
    });
  }

  public removeLine(key: string): void {
    this._lines.update(lines => lines.filter(l => l.key !== key));
  }

  private cleanNotes(notes: string | null): string | null {
    return notes?.trim() ? notes.trim() : null;
  }

  private buildKey(productId: number, sortedAddons: { id: number }[], notes: string | null): string {
    return `${productId}|${sortedAddons.map(a => a.id).join(',')}|${notes ?? ''}`;
  }

  public setDiscount(discount: ICartDiscount | null): void {
    this._discount.set(discount && discount.value > 0 ? discount : null);
  }

  public clear(): void {
    this._lines.set([]);
    this._discount.set(null);
  }

  /** Cuerpo para el backend: solo ids, cantidades y notas. */
  public toItemsRequest(): OrderItemRequest[] {
    return this._lines().map(l => ({
      productId: l.productId,
      quantity: l.quantity,
      addonIds: l.addons.map(a => a.id),
      notes: l.notes
    }));
  }

  public toDiscountRequest(): DiscountRequest | null {
    const d = this._discount();
    return d ? { type: d.type, value: d.value, reason: d.reason?.trim() ? d.reason.trim() : null } : null;
  }
}
