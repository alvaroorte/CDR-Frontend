import { Component, computed, inject, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpStatusCode } from '@angular/common/http';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MESSAGES } from '@core/constants/messages';
import { FormattedHttpError } from '@core/interfaces/http-error-handling.interface';
import { CashClosePreview, CashSession } from '@core/models/cash-session';
import { PipesModule } from '@core/pipes/pipes.module';
import { CashSessionService } from '@core/services/cash-session.service';
import { round2 } from '@core/utils/money';
import { PrimeModules } from '@shared/prime-components/prime-components.module';

type DeclaredForm = FormGroup<{ paymentMethodId: FormControl<number>; amount: FormControl<number | null> }>;

/**
 * Arqueo y cierre de caja (Etapa 5): esperado por medio (calculado por el backend), importe
 * contado/declarado de cada medio y diferencia en vivo. Pedidos sin entregar: advertencia con
 * confirmación. Un ADMIN que cierra la caja de otro debe escribir una nota. 409 → recarga el esperado.
 */
@Component({
  selector: 'app-modal-close',
  imports: [PrimeModules, PipesModule, ReactiveFormsModule],
  templateUrl: './modal-close.component.html'
})
export class ModalCloseComponent {

  private cashSessionService = inject(CashSessionService);
  private formBuilder = inject(FormBuilder);

  public readonly closed = output<CashSession>();
  public readonly messages = MESSAGES;
  public readonly preview = signal<CashClosePreview | null>(null);
  public readonly saving = signal(false);
  public openModal = false;

  public formClose = this.formBuilder.group({
    declared: this.formBuilder.array<DeclaredForm>([]),
    note: this.formBuilder.nonNullable.control('', Validators.maxLength(500)),
    confirmOpenOrders: this.formBuilder.nonNullable.control(false),
  });

  private readonly formValue = toSignal(this.formClose.valueChanges, { initialValue: this.formClose.getRawValue() });

  /** Diferencia por medio (declarado − esperado), en el orden del preview. null si aún no declaró. */
  public readonly differences = computed(() => {
    const preview = this.preview();
    const declared = this.formValue().declared ?? [];
    return (preview?.methods ?? []).map((method, i) => {
      const amount = declared[i]?.amount;
      return amount === null || amount === undefined ? null : round2(amount - method.expectedAmount);
    });
  });

  public readonly totalDifference = computed(() =>
    round2(this.differences().reduce<number>((acc, d) => acc + (d ?? 0), 0)));

  public readonly canSubmit = computed(() => {
    const preview = this.preview();
    const value = this.formValue();
    if (!preview || this.saving()) {
      return false;
    }
    const allDeclared = this.differences().every(d => d !== null);
    const noteOk = preview.ownSession || !!value.note?.trim();
    const ordersOk = preview.openOrders.length === 0 || value.confirmOpenOrders === true;
    return allDeclared && noteOk && ordersOk && this.formClose.valid;
  });

  public get declaredArray(): FormArray<DeclaredForm> {
    return this.formClose.controls.declared;
  }

  public open(cashSessionId: number): void {
    this.openModal = true;
    this.loadPreview(cashSessionId);
  }

  public close(): void {
    this.openModal = false;
  }

  public submit(): void {
    const preview = this.preview();
    if (!preview || !this.canSubmit()) {
      this.formClose.markAllAsTouched();
      return;
    }
    const { declared, note } = this.formClose.getRawValue();
    this.saving.set(true);
    this.cashSessionService.close(preview.cashSessionId, {
      expectedVersion: preview.version,
      declared: declared.map(d => ({ paymentMethodId: d.paymentMethodId, amount: d.amount as number })),
      note: note.trim() ? note.trim() : null,
    }).subscribe({
      next: session => {
        this.saving.set(false);
        this.openModal = false;
        this.closed.emit(session);
      },
      error: (error: FormattedHttpError) => {
        this.saving.set(false);
        if (error.code === HttpStatusCode.Conflict) {
          // Hubo un cobro o movimiento durante el arqueo: recargar el esperado conservando lo contado
          this.loadPreview(preview.cashSessionId, declared.map(d => d.amount));
        }
      }
    });
  }

  private loadPreview(cashSessionId: number, keepAmounts: (number | null)[] = []): void {
    this.preview.set(null);
    this.cashSessionService.getClosePreview(cashSessionId).subscribe({
      next: preview => {
        this.declaredArray.clear();
        preview.methods.forEach((method, i) => this.declaredArray.push(this.formBuilder.group({
          paymentMethodId: this.formBuilder.nonNullable.control(method.paymentMethodId),
          amount: this.formBuilder.control<number | null>(keepAmounts[i] ?? null, [Validators.required, Validators.min(0)]),
        })));
        if (keepAmounts.length === 0) {
          this.formClose.controls.note.reset('');
          this.formClose.controls.confirmOpenOrders.reset(false);
        }
        this.preview.set(preview);
      },
      error: () => this.openModal = false
    });
  }
}
