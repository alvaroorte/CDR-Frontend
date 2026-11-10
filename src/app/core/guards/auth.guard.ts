import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { LocalStorageService } from '@core/services/local-storage.service';
import { LoginService } from '@core/services/login.service';
import { LOCAL_STORAGE } from '@core/constants/local-storage';
import { urlsWithPermissions } from '@core/constants/header-links';
import { ROLES_CODE_SYSTEM } from '@core/enums/roles';

/**
 * Igual que la referencia: sin token → logout; con token → la ruta debe estar en
 * urlsWithPermissions y el usuario tener alguno de sus roles, si no → /404.
 * El backend valida igualmente cada petición (esto es solo navegación).
 */
export const authGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const localStorageService = inject(LocalStorageService);
  const loginService = inject(LoginService);

  if (!localStorageService.get(LOCAL_STORAGE.TOKEN)) {
    loginService.logout();
    return false;
  }
  // Recarga de página: restaurar la sesión desde el token antes de evaluar roles
  // (no depender del orden en que el header ejecuta ngOnInit).
  if (loginService.userId() === null) {
    loginService.setUser();
  }
  const allowed = verifyRouteByRole(route, loginService.rolesUser());
  if (!allowed) {
    router.navigate(['/404']);
  }
  return allowed;
};

const verifyRouteByRole = (route: ActivatedRouteSnapshot, roles: ROLES_CODE_SYSTEM[]): boolean => {
  const link = urlsWithPermissions.find(url => url.routerLink === route.url.join('/'));
  return !!link && link.access.some(role => roles.includes(role));
};
