import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { HelpersService } from '@core/services/helpers.service';
import { ParameterService } from '../../services/parameter.service';
import { Parameter, ParameterValueType } from '@core/models/parameter';
import { MESSAGES } from '@core/constants/messages';
import { LABELS } from '@core/constants/labels';
import { MessageRequiredFieldComponent } from '@shared/components/message-required-field/message-required-field.component';
import { ParameterModule } from '../../parameter.module';

/**
 * Edición del valor de un parámetro. El control de entrada depende del tipo (porcentaje, número,
 * texto o sí/no); el backend valida de nuevo el rango y el formato.
 */
@Component({
    selector: 'app-modal-form',
    templateUrl: './modal-form.component.html',
    imports: [MessageRequiredFieldComponent, ParameterModule]
})
export class ModalFormComponent implements OnInit {

  private formBuilder = inject(FormBuilder);
  private helpersService = inject(HelpersService);
  private parameterService = inject(ParameterService);

  public readonly labels = LABELS;
  public readonly messages = MESSAGES;
  private parameterId: number = 0;
  public openModal: boolean = false;
  public titleForm: string = "";
  public parameter: Parameter | null = null;
  private tableComponent = this.parameterService.eventTableComponent;

  public formParameter = this.formBuilder.nonNullable.group({
    id: this.formBuilder.control<number | null>(null),
    numberValue: this.formBuilder.control<number | null>(null),
    textValue: [''],
    booleanValue: [false],
  });

  ngOnInit(): void {
    this.parameterService.eventFormComponent.set(this);
  }

  public get valueType(): ParameterValueType {
    return this.parameter?.valueType ?? 'TEXT';
  }

  public hideModal(): void {
    this.openModal = false;
  }

  /** No se crean parámetros desde la UI (los define el backend). */
  public openCreate(): void {
    return;
  }

  public openEdit(id: number): void {
    this.reset();
    this.parameterService.getById(id).subscribe({
      next: (res) => {
        this.parameterId = res.id;
        this.parameter = res;
        this.titleForm = this.labels.editRegistration(res.name);
        this.configureValidators(res.valueType);
        this.formParameter.patchValue({
          id: res.id,
          numberValue: res.valueType === 'PERCENTAGE' || res.valueType === 'NUMBER' ? Number(res.value) : null,
          textValue: res.valueType === 'TEXT' ? res.value : '',
          booleanValue: res.valueType === 'BOOLEAN' ? res.value === 'true' : false,
        });
        this.openModal = true;
      }
    });
  }

  public save(): void {
    if (this.formParameter.valid && this.parameterId > 0) {
      this.parameterService.updateValue(this.parameterId, this.currentValue()).subscribe({
        next: () => {
          this.helpersService.messageNotification("success", "Correcto", MESSAGES.recordUpdated, 3000);
          this.hideModal();
          this.reset();
        },
        complete: () => {
          this.tableComponent()?.reload();
        }
      });
    }
  }

  private currentValue(): string {
    const value = this.formParameter.getRawValue();
    switch (this.valueType) {
      case 'PERCENTAGE':
      case 'NUMBER':
        return String(value.numberValue ?? 0);
      case 'BOOLEAN':
        return String(value.booleanValue);
      default:
        return value.textValue.trim();
    }
  }

  private configureValidators(type: ParameterValueType): void {
    const { numberValue, textValue } = this.formParameter.controls;
    numberValue.clearValidators();
    textValue.clearValidators();
    if (type === 'PERCENTAGE') {
      numberValue.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
    } else if (type === 'NUMBER') {
      numberValue.setValidators([Validators.required]);
    } else if (type === 'TEXT') {
      textValue.setValidators([Validators.required, Validators.maxLength(255)]);
    }
    numberValue.updateValueAndValidity();
    textValue.updateValueAndValidity();
  }

  private reset(): void {
    this.formParameter.reset();
    this.parameterId = 0;
    this.parameter = null;
  }
}
