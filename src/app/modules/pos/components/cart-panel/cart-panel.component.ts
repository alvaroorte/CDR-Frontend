import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { LABELS } from '@core/constants/labels';
import { MESSAGES } from '@core/constants/messages';
import { DISCOUNT_TYPE } from '@core/enums/discount-type';
import { DiscountRules } from '@core/models/pos-catalog';
import { CartService } from '../../services/cart.service';
import { PosModule } from '../../pos.module';

/**
 * Carrito con descuento general y totales de VISTA PREVIA. Valida en pantalla las mismas reglas que
 * el backend (tope del cajero, motivo, total > 0) para avisar antes; el backend valida igual.
 */
@Component({
  selector: 'app-cart-panel',
  imports: [PosModule],
  templateUrl: './cart-panel.component.html'
})
export class CartPanelComponent {

  public readonly discountRules = input<DiscountRules | null>(null);
  public readonly canDiscount = input<boolean>(false);
  public readonly isAdmin = input<boolean>(false);
  public readonly continue = output<void>();

  public readonly cart = inject(CartService);
  public readonly labels = LABELS;
  public readonly messages = MESSAGES;

  private formBuilder = inject(FormBuilder);
  /** El descuento se ingresa solo en Bs (monto fijo); ya no se ofrece por porcentaje. */
  public formDiscount = this.formBuilder.nonNullable.group({
    value: this.formBuilder.control<number | null>(null, [Validators.min(0)]),
    reason: ['', [Validators.maxLength(255)]],
  });

  /** Primer problema del descuento/total que impide continuar, o null. */
  public readonly discountError = computed<string | null>(() => {
    if (this.cart.isEmpty()) {
      return null;
    }
    const discount = this.cart.discount();
    const rules = this.discountRules();
    if (discount) {
      if (discount.value > this.cart.subtotal()) {
        return this.messages.discountAboveSubtotal;
      }
      if (rules && !this.isAdmin() && this.cart.discountPercent() > rules.cashierMaxPercent) {
        return this.messages.discountAboveCashierMax(rules.cashierMaxPercent);
      }
      if (rules && this.cart.discountPercent() > rules.reasonRequiredAbovePercent && !discount.reason?.trim()) {
        return this.messages.discountReasonRequired;
      }
    }
    return this.cart.total() <= 0 ? this.messages.totalMustBePositive : null;
  });

  public readonly canContinue = computed(() => !this.cart.isEmpty() && this.discountError() === null);

  /** Línea cuya observación se está editando (una a la vez), o null. */
  public readonly editingNotesKey = signal<string | null>(null);
  public notesControl = this.formBuilder.nonNullable.control('', [Validators.maxLength(255)]);

  constructor() {
    const current = this.cart.discount();
    if (current) {
      this.formDiscount.reset({ value: current.value, reason: current.reason ?? '' });
    }
    this.formDiscount.valueChanges.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => this.applyDiscount());
  }

  public increment(key: string, quantity: number): void {
    this.cart.updateQuantity(key, quantity + 1);
  }

  public decrement(key: string, quantity: number): void {
    this.cart.updateQuantity(key, quantity - 1);
  }

  public startEditNotes(key: string, notes: string | null): void {
    this.notesControl.reset(notes ?? '');
    this.editingNotesKey.set(key);
  }

  public saveNotes(): void {
    const key = this.editingNotesKey();
    if (key === null || this.notesControl.invalid) {
      return;
    }
    this.cart.updateNotes(key, this.notesControl.value);
    this.editingNotesKey.set(null);
  }

  public cancelEditNotes(): void {
    this.editingNotesKey.set(null);
  }

  public clearDiscount(): void {
    this.formDiscount.reset({ value: null, reason: '' });
  }

  public clearCart(): void {
    this.cart.clear();
    this.clearDiscount();
  }

  public onContinue(): void {
    if (this.canContinue()) {
      this.continue.emit();
    }
  }

  private applyDiscount(): void {
    const { value, reason } = this.formDiscount.getRawValue();
    this.cart.setDiscount(value !== null && value > 0 ? { type: DISCOUNT_TYPE.FIXED_AMOUNT, value, reason } : null);
  }
}
