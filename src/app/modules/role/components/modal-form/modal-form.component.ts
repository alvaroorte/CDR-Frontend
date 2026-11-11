import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { HelpersService } from '@core/services/helpers.service';
import { noSpaceValidator } from '@core/validators/noSpaceValidator';
import { RoleService } from '../../services/role.service';
import { Role } from '@core/models/role';
import { MESSAGES } from '@core/constants/messages';
import { regex } from '@core/constants/regexs';
import { LABELS } from '@core/constants/labels';
import { TypeSubmitEnum } from '@core/enums/type-submit';
import { MessageRequiredFieldComponent } from '@shared/components/message-required-field/message-required-field.component';
import { RoleModule } from '../../role.module';

/**
 * El código solo se define al crear. En roles del sistema (ADMIN, CAJERO, COCINA) tampoco se
 * puede desactivar: el backend lo rechaza y la UI deshabilita el interruptor.
 */
@Component({
    selector: 'app-modal-form',
    templateUrl: './modal-form.component.html',
    imports: [MessageRequiredFieldComponent, RoleModule]
})
export class ModalFormComponent implements OnInit {

  private formBuilder = inject(FormBuilder);
  private helpersService = inject(HelpersService);
  private roleService = inject(RoleService);

  public readonly labels = LABELS;
  public readonly messages = MESSAGES;
  private roleId: number = 0;
  public openModal: boolean = false;
  public titleForm: string = "";
  private tableComponent = this.roleService.eventTableComponent;

  public formRole = this.formBuilder.nonNullable.group({
    id: this.formBuilder.control<number | null>(null),
    code: ['', [Validators.required, Validators.pattern('^[A-Za-z_]{3,15}$')]],
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100), Validators.pattern(regex.fieldName), noSpaceValidator]],
    description: this.formBuilder.control<string | null>(null, [Validators.maxLength(255)]),
    active: [true],
  });

  ngOnInit(): void {
    this.roleService.eventFormComponent.set(this);
  }

  public hideModal(): void {
    this.openModal = false;
  }

  public openCreate(): void {
    this.reset();
    this.formRole.controls.code.enable();
    this.formRole.controls.active.enable();
    this.titleForm = this.labels.newRegistration("rol");
    this.openModal = true;
  }

  public openEdit(id: number): void {
    this.reset();
    this.titleForm = this.labels.editRegistration("rol");
    this.roleService.getById(id).subscribe({
      next: (res) => {
        this.roleId = res.id;
        this.formRole.patchValue(res);
        this.formRole.controls.code.disable();
        res.system ? this.formRole.controls.active.disable() : this.formRole.controls.active.enable();
        this.openModal = true;
      }
    });
  }

  public save(): void {
    if (this.formRole.valid) {
      this.roleId > 0 ? this.submit(TypeSubmitEnum.UPDATE) : this.submit(TypeSubmitEnum.CREATE);
    }
  }

  private reset(): void {
    this.formRole.reset();
    this.roleId = 0;
  }

  private submit(typeSubmitEnum: TypeSubmitEnum): void {
    const { id, ...data } = this.formRole.getRawValue();
    const body: Partial<Role> = { ...data, code: data.code.trim().toUpperCase(), description: data.description?.trim() || null };
    const service = typeSubmitEnum === TypeSubmitEnum.CREATE
      ? this.roleService.create(body)
      : this.roleService.update(this.roleId, body);
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
