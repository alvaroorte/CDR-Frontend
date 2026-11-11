import { Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableLazyLoadEvent } from 'primeng/table';
import { LABELS } from '@core/constants/labels';
import { MESSAGES } from '@core/constants/messages';
import { CASH_OUTFLOW_TYPES, CASH_MOVEMENT_TYPE } from '@core/enums/cash-movement-type';
import { ROLES_CODE_SYSTEM } from '@core/enums/roles';
import { CashMovementRequest, CashSession, CashSessionFilter, CashSessionListItem } from '@core/models/cash-session';
import { SelectOption } from '@core/models/select-option';
import { PipesModule } from '@core/pipes/pipes.module';
import { CashSessionService } from '@core/services/cash-session.service';
import { HelpersService } from '@core/services/helpers.service';
import { LoginService } from '@core/services/login.service';
import { UserService } from '@modules/user/services/user.service';
import { toIsoDate } from '@core/utils/dates';
import { PrimeModules } from '@shared/prime-components/prime-components.module';
import { ModalCloseComponent } from './components/modal-close/modal-close.component';
import { ModalMovementComponent } from './components/modal-movement/modal-movement.component';
import { ModalSessionDetailComponent } from './components/modal-session-detail/modal-session-detail.component';

/**
 * Caja: apertura, totales y movimientos (Etapa 3); arqueo, cierre, historial y cajas abiertas de
 * otros usuarios para el ADMIN (Etapa 5).
 */
@Component({
  selector: 'app-cash-register',
  imports: [PrimeModules, PipesModule, ReactiveFormsModule, RouterLink, ModalMovementComponent, ModalCloseComponent,
    ModalSessionDetailComponent],
  templateUrl: './cash-register.component.html'
})
export class CashRegisterComponent implements OnInit {

  public cashSessionService = inject(CashSessionService);
  private helpersService = inject(HelpersService);
  private loginService = inject(LoginService);
  private userService = inject(UserService);
  private formBuilder = inject(FormBuilder);

  public readonly labels = LABELS;
  public readonly messages = MESSAGES;
  public readonly opening = signal<boolean>(false);
  public readonly savingMovement = signal<boolean>(false);
  public readonly isAdmin = computed(() => this.loginService.rolesUser().includes(ROLES_CODE_SYSTEM.ADMIN));
  public activeTab: 'current' | 'history' = 'current';

  /** ADMIN: cajas abiertas de otros usuarios (cajas olvidadas). */
  public readonly otherOpenSessions = signal<CashSessionListItem[]>([]);

  // ----- Historial -----
  public readonly history = signal<CashSessionListItem[]>([]);
  public readonly totalRecords = signal(0);
  public readonly loadingHistory = signal(false);
  public readonly users = signal<SelectOption[]>([]);
  public readonly statusOptions = [{ value: 'OPEN', label: 'Abierta' }, { value: 'CLOSED', label: 'Cerrada' }];
  public readonly rows = 10;
  private lastLazy: TableLazyLoadEvent = { first: 0, rows: this.rows };

  public formOpen = this.formBuilder.group({
    openingAmount: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(0)]),
  });

  public formFilter = this.formBuilder.group({
    dates: this.formBuilder.control<Date[] | null>(null),
    status: this.formBuilder.control<'OPEN' | 'CLOSED' | null>(null),
    userId: this.formBuilder.control<number | null>(null),
  });

  private readonly modalMovement = viewChild(ModalMovementComponent);
  private readonly modalClose = viewChild.required(ModalCloseComponent);
  private readonly modalDetail = viewChild.required(ModalSessionDetailComponent);

  ngOnInit(): void {
    this.cashSessionService.refresh().subscribe();
    if (this.isAdmin()) {
      this.loadOtherOpenSessions();
      this.userService.getAll().subscribe(users =>
        this.users.set(users.map(u => ({ id: u.id, name: `${u.fullName} (${u.username})` }))));
    }
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
    this.modalMovement()?.open();
  }

  public registerMovement(body: CashMovementRequest): void {
    this.savingMovement.set(true);
    this.cashSessionService.registerMovement(body).subscribe({
      next: () => {
        this.savingMovement.set(false);
        this.modalMovement()?.close();
        this.helpersService.messageNotification('success', LABELS.ok, MESSAGES.movementRegistered);
      },
      error: () => this.savingMovement.set(false)
    });
  }

  /** Arqueo y cierre de la caja indicada (la propia o, para el ADMIN, la de otro). */
  public startClose(cashSessionId: number): void {
    this.modalClose().open(cashSessionId);
  }

  public onClosed(session: CashSession): void {
    this.helpersService.messageNotification('success', LABELS.ok, 'Caja cerrada correctamente');
    this.modalDetail().show(session);
    if (this.isAdmin()) {
      this.loadOtherOpenSessions();
    }
    if (this.activeTab === 'history') {
      this.loadHistory(this.lastLazy);
    }
  }

  public openDetail(id: number): void {
    this.modalDetail().open(id);
  }

  public loadOtherOpenSessions(): void {
    const myId = this.loginService.userId();
    this.cashSessionService.getOpenSessions().subscribe(sessions =>
      this.otherOpenSessions.set(sessions.filter(s => s.userId !== myId)));
  }

  public loadHistory(event: TableLazyLoadEvent): void {
    this.lastLazy = event;
    const rows = event.rows ?? this.rows;
    this.loadingHistory.set(true);
    this.cashSessionService.getPageable(Math.floor((event.first ?? 0) / rows), rows, this.buildFilter()).subscribe({
      next: result => {
        this.history.set(result.content);
        this.totalRecords.set(result.totalElements);
        this.loadingHistory.set(false);
      },
      error: () => this.loadingHistory.set(false)
    });
  }

  public search(): void {
    this.loadHistory({ ...this.lastLazy, first: 0 });
  }

  public clearFilters(): void {
    this.formFilter.reset({ dates: null, status: null, userId: null });
    this.search();
  }

  public buildFilter(): CashSessionFilter {
    const { dates, status, userId } = this.formFilter.getRawValue();
    const from = dates?.[0] ?? null;
    return { dateFrom: toIsoDate(from), dateTo: toIsoDate(dates?.[1] ?? from), status, userId: this.isAdmin() ? userId : null };
  }

  public isOutflow(type: CASH_MOVEMENT_TYPE): boolean {
    return CASH_OUTFLOW_TYPES.includes(type);
  }

  public isOpening(type: CASH_MOVEMENT_TYPE): boolean {
    return type === CASH_MOVEMENT_TYPE.OPENING;
  }
}
