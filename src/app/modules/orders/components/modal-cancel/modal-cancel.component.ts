import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MESSAGES } from '@core/constants/messages';
import { LABELS } from '@core/constants/labels';
import { noSpaceValidator } from '@core/validators/noSpaceValidator';
import { PrimeModules } from '@shared/prime-components/prime-components.module';
import { PipesModule } from '@core/pipes/pipes.module';

export interface ICancelTarget {
  id: number;
  codeLabel: string;
  version: number;
  total: number;
}

export interface ICancelRequest {
  target: ICancelTarget;
  reason: string;
}

/** Cancelación con motivo obligatorio; avisa que el importe se devuelve desde la caja de quien cancela. */
@Component({
  selector: 'app-modal-cancel',
  imports: [PrimeModules, ReactiveFormsModule, PipesModule],
  templateUrl: './modal-cancel.component.html'
})
export class ModalCancelComponent {

  public readonly saving = input<boolean>(false);
  public readonly confirmCancel = output<ICancelRequest>();

  public readonly labels = LABELS;
  public readonly messages = MESSAGES;
  public readonly target = signal<ICancelTarget | null>(null);
  public openModal = false;

  private formBuilder = inject(FormBuilder);
  public formCancel = this.formBuilder.nonNullable.group({
    reason: ['', [Validators.required, Validators.maxLength(255), noSpaceValidator]],
  });

  public open(target: ICancelTarget): void {
    this.target.set(target);
    this.formCancel.reset({ reason: '' });
    this.openModal = true;
  }

  public close(): void {
    this.openModal = false;
  }

  public submit(): void {
    const target = this.target();
    const reason = this.formCancel.controls.reason.value.trim();
    if (!target || this.formCancel.invalid || !reason) {
      this.formCancel.markAllAsTouched();
      return;
    }
    this.confirmCancel.emit({ target, reason });
  }
}
