import { Component, computed, inject } from '@angular/core';
import { LoginService } from '@core/services/login.service';
import { LABELS } from '@core/constants/labels';
import { ROLES_CODE_SYSTEM } from '@core/enums/roles';
import { PrimeModules } from '@shared/prime-components/prime-components.module';

const ROLE_LABELS: Record<ROLES_CODE_SYSTEM, string> = {
  [ROLES_CODE_SYSTEM.ADMIN]: 'Administrador',
  [ROLES_CODE_SYSTEM.CASHIER]: 'Cajero',
  [ROLES_CODE_SYSTEM.KITCHEN]: 'Cocina',
};

/**
 * Pantalla de inicio (Etapa 1). En etapas posteriores cada rol se redirige a su pantalla
 * operativa (CAJERO → POS, COCINA → tablero) — ver LoginService.homeRoute().
 */
@Component({
  selector: 'app-home',
  imports: [PrimeModules],
  templateUrl: './home.component.html'
})
export class HomeComponent {

  public loginService = inject(LoginService);
  public readonly labels = LABELS;
  public readonly roleLabels = computed(() =>
    this.loginService.rolesUser().map(role => ROLE_LABELS[role] ?? role));
}
