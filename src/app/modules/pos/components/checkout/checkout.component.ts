import { Component, DestroyRef, computed, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { LABELS } from '@core/constants/labels';
import { MESSAGES } from '@core/constants/messages';
import { SERVICE_TYPE } from '@core/enums/service-type';
import { OrderQuote, PaymentRequest } from '@core/models/order';
import { PosPaymentMethod } from '@core/models/pos-catalog';
import { TableMarkerAvailability } from '@core/models/table-marker';
import { round2 } from '@core/utils/money';
import { PosModule } from '../../pos.module';

/** Datos del cobro que el contenedor junta con el carrito para POST /order. */
export interface ICheckoutData {
  serviceType: SERVICE_TYPE;
  tableMarkerId: number | null;
  customerName: string | null;
  payments: PaymentRequest[];
}

type PaymentForm = FormGroup<{
  paymentMethodId: FormControl<number | null>;
  amount: FormControl<number | null>;
  reference: FormControl<string>;
  /** Solo para calcular el vuelto en pantalla: NO se envía. */
  received: FormControl<number | null>;
}>;

enum STEP { SERVICE = 1, PAYMENT = 2, SUMMARY = 3 }

/**
 * Cobro del pedido en 3 pasos: modalidad (y adorno), pagos (con vuelto solo visual) y resumen
 * devuelto por POST /order/quote. Presentacional: las llamadas HTTP las hace el contenedor.
 */
@Component({
  selector: 'app-checkout',
  imports: [PosModule],
  templateUrl: './checkout.component.html'
})
export class CheckoutComponent {

  public readonly visible = model<boolean>(false);
  public readonly paymentMethods = input<PosPaymentMethod[]>([]);
  public readonly markers = input<TableMarkerAvailability[]>([]);
  /** Total de vista previa del carrito. */
  public readonly previewTotal = input<number>(0);
  public readonly quote = input<OrderQuote | null>(null);
  public readonly saving = input<boolean>(false);

  public readonly refreshMarkers = output<void>();
  public readonly requestQuote = output<void>();
  public readonly confirmOrder = output<ICheckoutData>();

  public readonly labels = LABELS;
  public readonly messages = MESSAGES;
  public readonly SERVICE_TYPE = SERVICE_TYPE;
  public readonly STEP = STEP;
  public readonly step = signal<STEP>(STEP.SERVICE);

  private formBuilder = inject(FormBuilder);
  public formCheckout = this.formBuilder.group({
    serviceType: this.formBuilder.control<SERVICE_TYPE | null>(null, Validators.required),
    tableMarkerId: this.formBuilder.control<number | null>(null),
    customerName: this.formBuilder.nonNullable.control('', Validators.maxLength(100)),
    payments: this.formBuilder.array<PaymentForm>([]),
  });

  private readonly formValue = toSignal(this.formCheckout.valueChanges, { initialValue: this.formCheckout.getRawValue() });

  public readonly serviceType = computed(() => this.formValue().serviceType ?? null);
  public readonly selectedMarkerId = computed(() => this.formValue().tableMarkerId ?? null);
  public readonly freeMarkers = computed(() => this.markers().filter(m => !m.inUse).length);

  /** Total contra el que se cuadran los pagos: el del backend si ya cotizó, si no la vista previa. */
  public readonly targetTotal = computed(() => this.quote()?.total ?? this.previewTotal());
  public readonly paymentsSum = computed(() =>
    round2((this.formValue().payments ?? []).reduce((acc, p) => acc + (p?.amount ?? 0), 0)));
  public readonly difference = computed(() => round2(this.targetTotal() - this.paymentsSum()));

  public readonly serviceStepValid = computed(() => {
    const type = this.serviceType();
    return type === SERVICE_TYPE.TAKEAWAY || (type === SERVICE_TYPE.DINE_IN && this.selectedMarkerId() !== null);
  });

  public readonly paymentsValid = computed(() => {
    const payments = this.formValue().payments ?? [];
    return payments.length > 0
      && payments.every(p => p?.paymentMethodId != null && (p.amount ?? 0) > 0
        && (!this.methodById(p.paymentMethodId)?.requiresReference || !!p.reference?.trim()))
      && this.difference() === 0;
  });

  constructor() {
    this.formCheckout.controls.serviceType.valueChanges.pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(type => {
        if (type === SERVICE_TYPE.TAKEAWAY) {
          this.formCheckout.controls.tableMarkerId.setValue(null);
        }
      });

    // Si un adorno elegido pasa a "en uso" (otro cajero lo tomó), se deselecciona.
    effect(() => {
      const markers = this.markers();
      const selected = untracked(() => this.formCheckout.controls.tableMarkerId.value);
      if (selected !== null && markers.find(m => m.id === selected)?.inUse !== false) {
        this.formCheckout.controls.tableMarkerId.setValue(null);
      }
    });

    // Con un solo pago, al llegar el total del backend se ajusta el importe automáticamente.
    effect(() => {
      const quote = this.quote();
      if (quote && untracked(() => this.paymentsArray.length) === 1) {
        this.paymentsArray.at(0).controls.amount.setValue(quote.total);
      }
    });
  }

  public get paymentsArray(): FormArray<PaymentForm> {
    return this.formCheckout.controls.payments;
  }

  /** Reinicia el cobro al abrirlo: un pago en el primer medio (efectivo si existe) por el total. */
  public start(): void {
    this.step.set(STEP.SERVICE);
    this.paymentsArray.clear();
    this.formCheckout.reset({ serviceType: null, tableMarkerId: null, customerName: '' });
    const methods = this.paymentMethods();
    const preferred = methods.find(m => m.givesChange) ?? methods[0];
    this.addPayment(preferred?.id ?? null, this.previewTotal());
  }

  public chooseServiceType(type: SERVICE_TYPE): void {
    this.formCheckout.controls.serviceType.setValue(type);
    if (type === SERVICE_TYPE.DINE_IN) {
      this.refreshMarkers.emit();
    }
  }

  public chooseMarker(marker: TableMarkerAvailability): void {
    if (!marker.inUse) {
      this.formCheckout.controls.tableMarkerId.setValue(marker.id);
    }
  }

  public addPayment(methodId: number | null = null, amount: number | null = null): void {
    const remaining = amount ?? Math.max(0, this.difference());
    this.paymentsArray.push(this.formBuilder.group({
      paymentMethodId: this.formBuilder.control<number | null>(methodId, Validators.required),
      amount: this.formBuilder.control<number | null>(remaining, [Validators.required, Validators.min(0.01)]),
      reference: this.formBuilder.nonNullable.control('', Validators.maxLength(100)),
      received: this.formBuilder.control<number | null>(null),
    }));
  }

  public removePayment(index: number): void {
    if (this.paymentsArray.length > 1) {
      this.paymentsArray.removeAt(index);
    }
  }

  public methodById(id: number | null | undefined): PosPaymentMethod | undefined {
    return this.paymentMethods().find(m => m.id === id);
  }

  /** Vuelto solo visual: recibido − importe aplicado. */
  public change(index: number): number | null {
    const row = this.paymentsArray.at(index)?.getRawValue();
    if (!row || row.received === null || row.amount === null) {
      return null;
    }
    const value = round2(row.received - row.amount);
    return value >= 0 ? value : null;
  }

  public goToPayment(): void {
    if (this.serviceStepValid()) {
      this.step.set(STEP.PAYMENT);
    }
  }

  public goToSummary(): void {
    this.paymentsArray.markAllAsTouched();
    if (this.paymentsValid()) {
      this.requestQuote.emit();
      this.step.set(STEP.SUMMARY);
    }
  }

  public back(): void {
    this.step.update(s => (s > STEP.SERVICE ? s - 1 : s));
  }

  /** Vuelve al paso de modalidad (p. ej. el adorno quedó en uso: 409). */
  public backToService(): void {
    this.step.set(STEP.SERVICE);
  }

  public confirm(): void {
    const value = this.formCheckout.getRawValue();
    if (!this.quote() || !this.paymentsValid() || value.serviceType === null) {
      return;
    }
    this.confirmOrder.emit({
      serviceType: value.serviceType,
      tableMarkerId: value.serviceType === SERVICE_TYPE.DINE_IN ? value.tableMarkerId : null,
      customerName: value.customerName.trim() ? value.customerName.trim() : null,
      payments: value.payments.map(p => ({
        paymentMethodId: p.paymentMethodId as number,
        amount: p.amount as number,
        reference: p.reference.trim() ? p.reference.trim() : null,
      })),
    });
  }

  public selectedMarkerNumber(): number | null {
    return this.markers().find(m => m.id === this.selectedMarkerId())?.number ?? null;
  }
}
