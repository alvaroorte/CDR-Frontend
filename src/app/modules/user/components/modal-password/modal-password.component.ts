import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { HelpersService } from '@core/services/helpers.service';
import { IOpenableModal } from '@core/interfaces/openable-modal.interface';
import { MESSAGES } from '@core/constants/messages';
import { LABELS } from '@core/constants/labels';
import { Severity } from '@core/enums/severity';
import { MessageRequiredFieldComponent } from '@shared/components/message-required-field/message-required-field.component';
import { UserModule } from '../../user.module';

/** Restablecimiento de contraseña por un ADMIN (no hay recuperación por correo en la v1). */
@Component({
    selector: 'app-modal-password',
    templateUrl: './modal-password.component.html',
    imports: [MessageRequiredFieldComponent, UserModule]
})
export class ModalPasswordComponent implements IOpenableModal, OnInit, OnDestroy {

  private formBuilder = inject(FormBuilder);
  private userService = inject(UserService);
  private helpersService = inject(HelpersService);

  public readonly labels = LABELS;
  public readonly messages = MESSAGES;
  public openModal: boolean = false;
  public titleForm: string = "";
  private userId: number = 0;

  public formPassword = this.formBuilder.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
  });

  ngOnInit(): void {
    this.userService.eventModalPasswordComponent.set(this);
  }

  ngOnDestroy(): void {
    this.userService.eventModalPasswordComponent.set(null);
  }

  public open(userId: number): void {
    this.formPassword.reset();
    this.userId = userId;
    this.userService.getById(userId).subscribe({
      next: (user) => {
        this.titleForm = `${LABELS.resetPassword}: ${user.fullName}`;
        this.openModal = true;
      }
    });
  }

  public hideModal(): void {
    this.openModal = false;
  }

  public save(): void {
    if (this.formPassword.invalid) {
      return;
    }
    this.userService.resetPassword(this.userId, this.formPassword.getRawValue().password).subscribe({
      next: () => {
        this.helpersService.messageNotification(Severity.success, "Correcto", MESSAGES.passwordUpdated);
        this.hideModal();
        this.formPassword.reset();
      }
    });
  }
}
