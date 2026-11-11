import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { HelpersService } from '@core/services/helpers.service';
import { noSpaceValidator } from '@core/validators/noSpaceValidator';
import { UserService } from '../../services/user.service';
import { RoleService } from '@modules/role/services/role.service';
import { UserAppRequest } from '@core/models/user-app';
import { Role } from '@core/models/role';
import { MESSAGES } from '@core/constants/messages';
import { LABELS } from '@core/constants/labels';
import { TypeSubmitEnum } from '@core/enums/type-submit';
import { MessageRequiredFieldComponent } from '@shared/components/message-required-field/message-required-field.component';
import { UserModule } from '../../user.module';

/**
 * Alta/edición de usuario. La contraseña se pide solo al crear (para cambiarla: "Restablecer contraseña").
 * Las reglas "no desactivarse a sí mismo" y "siempre un ADMIN activo" las aplica el backend.
 */
@Component({
    selector: 'app-modal-form',
    templateUrl: './modal-form.component.html',
    imports: [MessageRequiredFieldComponent, UserModule]
})
export class ModalFormComponent implements OnInit {

  private formBuilder = inject(FormBuilder);
  private helpersService = inject(HelpersService);
  private userService = inject(UserService);
  private roleService = inject(RoleService);

  public readonly labels = LABELS;
  public readonly messages = MESSAGES;
  public userId: number = 0;
  public openModal: boolean = false;
  public titleForm: string = "";
  public roles: Role[] = [];
  private tableComponent = this.userService.eventTableComponent;

  public formUser = this.formBuilder.nonNullable.group({
    id: this.formBuilder.control<number | null>(null),
    username: ['', [Validators.required, Validators.pattern('^[A-Za-z0-9._-]{3,50}$')]],
    fullName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150), noSpaceValidator]],
    email: this.formBuilder.control<string | null>(null, [Validators.email, Validators.maxLength(150)]),
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    roleIds: this.formBuilder.nonNullable.control<number[]>([], [Validators.required]),
    active: [true],
  });

  ngOnInit(): void {
    this.userService.eventFormComponent.set(this);
  }

  public hideModal(): void {
    this.openModal = false;
  }

  public openCreate(): void {
    this.reset();
    this.loadRoles();
    this.formUser.controls.password.enable();
    this.titleForm = this.labels.newRegistration("usuario");
    this.openModal = true;
  }

  public openEdit(id: number): void {
    this.reset();
    this.loadRoles();
    this.formUser.controls.password.disable();
    this.titleForm = this.labels.editRegistration("usuario");
    this.userService.getById(id).subscribe({
      next: (res) => {
        this.userId = res.id;
        this.formUser.patchValue({ ...res, roleIds: res.roles.map(role => role.id) });
        this.openModal = true;
      }
    });
  }

  public save(): void {
    if (this.formUser.valid) {
      this.userId > 0 ? this.submit(TypeSubmitEnum.UPDATE) : this.submit(TypeSubmitEnum.CREATE);
    }
  }

  private loadRoles(): void {
    this.roleService.getSelect().subscribe({ next: (res) => this.roles = res });
  }

  private reset(): void {
    this.formUser.reset();
    this.userId = 0;
  }

  private submit(typeSubmitEnum: TypeSubmitEnum): void {
    const value = this.formUser.getRawValue();
    const body: UserAppRequest = {
      username: value.username.trim(),
      fullName: value.fullName.trim(),
      email: value.email?.trim() || null,
      password: typeSubmitEnum === TypeSubmitEnum.CREATE ? value.password : null,
      roleIds: value.roleIds,
      active: value.active,
    };
    const service = typeSubmitEnum === TypeSubmitEnum.CREATE
      ? this.userService.create(body)
      : this.userService.update(this.userId, body);
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
