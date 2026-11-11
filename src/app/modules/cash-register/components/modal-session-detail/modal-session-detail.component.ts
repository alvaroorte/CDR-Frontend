import { Component, computed, inject, signal } from '@angular/core';
import { CASH_OUTFLOW_TYPES, CASH_MOVEMENT_TYPE } from '@core/enums/cash-movement-type';
import { CashSession } from '@core/models/cash-session';
import { PipesModule } from '@core/pipes/pipes.module';
import { CashSessionService } from '@core/services/cash-session.service';
import { PrimeModules } from '@shared/prime-components/prime-components.module';

/** Detalle de una sesión de caja: arqueo por medio (si está cerrada), totales y movimientos. */
@Component({
  selector: 'app-modal-session-detail',
  imports: [PrimeModules, PipesModule],
  templateUrl: './modal-session-detail.component.html'
})
export class ModalSessionDetailComponent {

  private cashSessionService = inject(CashSessionService);

  public readonly session = signal<CashSession | null>(null);
  public readonly totalDifference = computed(() =>
    (this.session()?.summaries ?? []).reduce((acc, s) => acc + s.difference, 0));
  public openModal = false;

  public open(id: number): void {
    this.session.set(null);
    this.openModal = true;
    this.cashSessionService.getById(id).subscribe({
      next: session => this.session.set(session),
      error: () => this.openModal = false
    });
  }

  /** Muestra una sesión ya cargada (p. ej. la respuesta del cierre). */
  public show(session: CashSession): void {
    this.session.set(session);
    this.openModal = true;
  }

  public isOutflow(type: CASH_MOVEMENT_TYPE): boolean {
    return CASH_OUTFLOW_TYPES.includes(type);
  }
}
