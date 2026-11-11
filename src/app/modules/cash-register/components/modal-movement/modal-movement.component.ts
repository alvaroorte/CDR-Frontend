import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LABELS } from '@core/constants/labels';
import { MESSAGES } from '@core/constants/messages';
import { CASH_MOVEMENT_TYPE } from '@core/enums/cash-movement-type';
import { CashMovementRequest } from '@core/models/cash-session';
import { noSpaceValidator } from '@core/validators/noSpaceValidator';
import { PrimeModules } from '@shared/prime-components/prime-components.module';

/** Ingreso o egreso manual de caja (descripción obligatoria). */
@Component({
  selector: 'app-modal-movement',
  imports: [PrimeModules, ReactiveFormsModule],
  templateUrl: './modal-movement.component.html'
})
export class ModalMovementComponent {

  public readonly saving = input<boolean>(false);
  public readonly save = output<CashMovementRequest>();

  public readonly labels = LABELS;
  public readonly messages = MESSAGES;
  public readonly types = [
    { label: LABELS.income, value: CASH_MOVEMENT_TYPE.INCOME },
    { label: LABELS.expense, value: CASH_MOVEMENT_TYPE.EXPENSE },
  ];
  public openModal = false;

  private formBuilder = inject(FormBuilder);
  public formMovement = this.formBuilder.group({
    type: this.formBuilder.nonNullable.control<CASH_MOVEMENT_TYPE.INCOME | CASH_MOVEMENT_TYPE.EXPENSE>(CASH_MOVEMENT_TYPE.EXPENSE),
    amount: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    description: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(255), noSpaceValidator]),
  });

  public open(): void {
    this.formMovement.reset({ type: CASH_MOVEMENT_TYPE.EXPENSE, amount: null, description: '' });
    this.openModal = true;
  }

  public close(): void {
    this.openModal = false;
  }

  public submit(): void {
    const { type, amount, description } = this.formMovement.getRawValue();
    if (this.formMovement.invalid || amount === null) {
      this.formMovement.markAllAsTouched();
      return;
    }
    this.save.emit({ type, amount, description: description.trim() });
  }
}
