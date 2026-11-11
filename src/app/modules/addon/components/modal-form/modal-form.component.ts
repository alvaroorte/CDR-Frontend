import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { HelpersService } from '@core/services/helpers.service';
import { noSpaceValidator } from '@core/validators/noSpaceValidator';
import { AddonService } from '../../services/addon.service';
import { Addon } from '@core/models/addon';
import { MESSAGES } from '@core/constants/messages';
import { regex } from '@core/constants/regexs';
import { LABELS } from '@core/constants/labels';
import { TypeSubmitEnum } from '@core/enums/type-submit';
import { MessageRequiredFieldComponent } from '@shared/components/message-required-field/message-required-field.component';
import { AddonModule } from '../../addon.module';

@Component({
    selector: 'app-modal-form',
    templateUrl: './modal-form.component.html',
    imports: [MessageRequiredFieldComponent, AddonModule]
})
export class ModalFormComponent implements OnInit {

  private formBuilder = inject(FormBuilder);
  private helpersService = inject(HelpersService);
  private addonService = inject(AddonService);

  public readonly labels = LABELS;
  public readonly messages = MESSAGES;
  private addonId: number = 0;
  public openModal: boolean = false;
  public titleForm: string = "";
  private tableComponent = this.addonService.eventTableComponent;

  public formAddon = this.formBuilder.nonNullable.group({
    id: this.formBuilder.control<number | null>(null),
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(regex.fieldName), noSpaceValidator]],
    price: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(0)]),
    active: [true],
  });

  ngOnInit(): void {
    this.addonService.eventFormComponent.set(this);
  }

  public hideModal(): void {
    this.openModal = false;
  }

  public openCreate(): void {
    this.reset();
    this.titleForm = this.labels.newRegistration("adicional");
    this.openModal = true;
  }

  public openEdit(id: number): void {
    this.reset();
    this.titleForm = this.labels.editRegistration("adicional");
    this.addonService.getById(id).subscribe({
      next: (res) => {
        this.addonId = res.id;
        this.formAddon.patchValue(res);
        this.openModal = true;
      }
    });
  }

  public save(): void {
    if (this.formAddon.valid) {
      this.addonId > 0 ? this.submit(TypeSubmitEnum.UPDATE) : this.submit(TypeSubmitEnum.CREATE);
    }
  }

  private reset(): void {
    this.formAddon.reset();
    this.addonId = 0;
  }

  private submit(typeSubmitEnum: TypeSubmitEnum): void {
    const { id, ...data } = this.formAddon.getRawValue();
    const body: Partial<Addon> = { ...data, price: data.price ?? 0 };
    const service = typeSubmitEnum === TypeSubmitEnum.CREATE
      ? this.addonService.create(body)
      : this.addonService.update(this.addonId, body);
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
