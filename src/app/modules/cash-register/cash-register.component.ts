import { Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LABELS } from '@core/constants/labels';
import { MESSAGES } from '@core/constants/messages';
import { CASH_OUTFLOW_TYPES, CASH_MOVEMENT_TYPE } from '@core/enums/cash-movement-type';
import { CashMovementRequest } from '@core/models/cash-session';
import { CashSessionService } from '@core/services/cash-session.service';
import { HelpersService } from '@core/services/helpers.service';
import { PipesModule } from '@core/pipes/pipes.module';
import { PrimeModules } from '@shared/prime-components/prime-components.module';
import { ReactiveFormsModule } from '@angular/forms';
import { ModalMovementComponent } from './components/modal-movement/modal-movement.component';

/**
 * Caja del usuario: apertura, totales en curso y movimientos manuales (Etapa 3).
 * El cierre con arqueo llega en la Etapa 5.
 */
@Component({
  selector: 'app-cash-register',
  imports: [PrimeModules, PipesModule, ReactiveFormsModule, RouterLink, ModalMovementComponent],
  templateUrl: './cash-register.component.html'
})
export class CashRegisterComponent implements OnInit {

  public cashSessionService = inject(CashSessionService);
  private helpersService = inject(HelpersService);
  private formBuilder = inject(FormBuilder);

  public readonly labels = LABELS;
  public readonly messages = MESSAGES;
  public readonly opening = signal<boolean>(false);
  public readonly savingMovement = signal<boolean>(false);

  public formOpen = this.formBuilder.group({
    openingAmount: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(0)]),
  });

  private readonly modalMovement = viewChild.required(ModalMovementComponent);

  ngOnInit(): void {
    this.cashSessionService.refresh().subscribe();
  }

  public open(): void {
    const amount = this.formOpen.controls.openingAmount.value;
    if (this.formOpen.invalid || amount === null) {
      this.formOpen.markAllAsTouched();
      return;
    }
    this.opening.set(true);
    this.cashSessionService.open(amount).subscribe({
      next: () => {
        this.opening.set(false);
        this.formOpen.reset();
        this.helpersService.messageNotification('success', LABELS.ok, MESSAGES.cashOpened);
      },
      error: () => this.opening.set(false)
    });
  }

  public openMovement(): void {
    this.modalMovement().open();
  }

  public registerMovement(body: CashMovementRequest): void {
    this.savingMovement.set(true);
    this.cashSessionService.registerMovement(body).subscribe({
      next: () => {
        this.savingMovement.set(false);
        this.modalMovement().close();
        this.helpersService.messageNotification('success', LABELS.ok, MESSAGES.movementRegistered);
      },
      error: () => this.savingMovement.set(false)
    });
  }

  public isOutflow(type: CASH_MOVEMENT_TYPE): boolean {
    return CASH_OUTFLOW_TYPES.includes(type);
  }

  public isOpening(type: CASH_MOVEMENT_TYPE): boolean {
    return type === CASH_MOVEMENT_TYPE.OPENING;
  }
}
