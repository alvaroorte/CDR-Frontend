import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { HelpersService } from '@core/services/helpers.service';
import { noSpaceValidator } from '@core/validators/noSpaceValidator';
import { PaymentMethodService } from '../../services/payment-method.service';
import { PaymentMethod } from '@core/models/payment-method';
import { MESSAGES } from '@core/constants/messages';
import { regex } from '@core/constants/regexs';
import { LABELS } from '@core/constants/labels';
import { TypeSubmitEnum } from '@core/enums/type-submit';
import { MessageRequiredFieldComponent } from '@shared/components/message-required-field/message-required-field.component';
import { PaymentMethodModule } from '../../payment-method.module';

/** El código se define al crear y no se edita (form-fields.md §6: campo no editable). */
@Component({
    selector: 'app-modal-form',
    templateUrl: './modal-form.component.html',
    imports: [MessageRequiredFieldComponent, PaymentMethodModule]
})
export class ModalFormComponent implements OnInit {

  private formBuilder = inject(FormBuilder);
  private helpersService = inject(HelpersService);
  private paymentMethodService = inject(PaymentMethodService);

  public readonly labels = LABELS;
  public readonly messages = MESSAGES;
  private paymentMethodId: number = 0;
  public openModal: boolean = false;
  public titleForm: string = "";
  private tableComponent = this.paymentMethodService.eventTableComponent;

  public formPaymentMethod = this.formBuilder.nonNullable.group({
    id: this.formBuilder.control<number | null>(null),
    code: ['', [Validators.required, Validators.pattern('^[A-Za-z0-9_]{2,30}$')]],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(regex.fieldName), noSpaceValidator]],
    requiresReference: [false],
    givesChange: [false],
    active: [true],
  });

  ngOnInit(): void {
    this.paymentMethodService.eventFormComponent.set(this);
  }

  public hideModal(): void {
    this.openModal = false;
  }

  public openCreate(): void {
    this.reset();
    this.formPaymentMethod.controls.code.enable();
    this.titleForm = this.labels.newRegistration("medio de pago");
    this.openModal = true;
  }

  public openEdit(id: number): void {
    this.reset();
    this.titleForm = this.labels.editRegistration("medio de pago");
    this.paymentMethodService.getById(id).subscribe({
      next: (res) => {
        this.paymentMethodId = res.id;
        this.formPaymentMethod.patchValue(res);
        this.formPaymentMethod.controls.code.disable();
        this.openModal = true;
      }
    });
  }

  public save(): void {
    if (this.formPaymentMethod.valid) {
      this.paymentMethodId > 0 ? this.submit(TypeSubmitEnum.UPDATE) : this.submit(TypeSubmitEnum.CREATE);
    }
  }

  private reset(): void {
    this.formPaymentMethod.reset();
    this.paymentMethodId = 0;
  }

  private submit(typeSubmitEnum: TypeSubmitEnum): void {
    const { id, ...data } = this.formPaymentMethod.getRawValue();
    const body: Partial<PaymentMethod> = { ...data, code: data.code.trim().toUpperCase() };
    const service = typeSubmitEnum === TypeSubmitEnum.CREATE
      ? this.paymentMethodService.create(body)
      : this.paymentMethodService.update(this.paymentMethodId, body);
    service.subscribe({
      next: () => {
        const message = typeSubmitEnum === TypeSubmitEnum.CREATE ? MESSAGES.recordCreated : MESSAGES.recordUpdated;
        this.helpersService.messageNotification("success", "Correcto", message, 3000);
        this.hideModal();
        this.reset();
      },
      complete: () => {
        this.tableComponent()?.reload();
      }
    });
  }
}
