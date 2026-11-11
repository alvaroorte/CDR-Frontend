import { Component, computed, inject, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { LABELS } from '@core/constants/labels';
import { MESSAGES } from '@core/constants/messages';
import { PosAddon, PosProduct } from '@core/models/pos-catalog';
import { round2 } from '@core/utils/money';
import { PosModule } from '../../pos.module';

export interface IProductConfigured {
  product: PosProduct;
  quantity: number;
  addons: PosAddon[];
  notes: string | null;
}

/** Presentacional: cantidad, adicionales y observaciones de un producto antes de agregarlo. */
@Component({
  selector: 'app-modal-product-config',
  imports: [PosModule],
  templateUrl: './modal-product-config.component.html'
})
export class ModalProductConfigComponent {

  public readonly added = output<IProductConfigured>();

  public readonly labels = LABELS;
  public readonly messages = MESSAGES;
  public openModal = false;
  public readonly product = signal<PosProduct | null>(null);

  private formBuilder = inject(FormBuilder);
  public formConfig = this.formBuilder.nonNullable.group({
    quantity: [1, [Validators.required, Validators.min(1), Validators.max(999)]],
    addonIds: [[] as number[]],
    notes: ['', [Validators.maxLength(255)]],
  });

  private readonly formValue = toSignal(this.formConfig.valueChanges, { initialValue: this.formConfig.getRawValue() });

  /** Vista previa del importe de la línea. */
  public readonly lineTotal = computed(() => {
    const product = this.product();
    if (!product) {
      return 0;
    }
    const value = this.formValue();
    const addonIds = value.addonIds ?? [];
    const addonsTotal = product.addons.filter(a => addonIds.includes(a.id)).reduce((acc, a) => acc + a.price, 0);
    return round2((product.price + addonsTotal) * (value.quantity ?? 1));
  });

  public open(product: PosProduct): void {
    this.product.set(product);
    this.formConfig.reset({ quantity: 1, addonIds: [], notes: '' });
    this.openModal = true;
  }

  public add(): void {
    const product = this.product();
    if (!product || this.formConfig.invalid) {
      this.formConfig.markAllAsTouched();
      return;
    }
    const { quantity, addonIds, notes } = this.formConfig.getRawValue();
    this.added.emit({
      product,
      quantity,
      addons: product.addons.filter(a => addonIds.includes(a.id)),
      notes: notes.trim() ? notes.trim() : null,
    });
    this.openModal = false;
  }
}
