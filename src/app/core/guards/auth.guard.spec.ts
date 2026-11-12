import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlSegment } from '@angular/router';
import { authGuard } from './auth.guard';
import { LocalStorageService } from '@core/services/local-storage.service';
import { LoginService } from '@core/services/login.service';
import { ROLES_CODE_SYSTEM } from '@core/enums/roles';

describe('authGuard', () => {
  let token: string | null;
  const router = { navigate: vi.fn() };
  const loginService = {
    userId: signal<number | null>(1),
    rolesUser: signal<ROLES_CODE_SYSTEM[]>([]),
    logout: vi.fn(),
    setUser: vi.fn(),
  };

  const routeTo = (path: string) =>
    ({ url: [new UrlSegment(path, {})] }) as unknown as ActivatedRouteSnapshot;

  const run = (path: string) =>
    TestBed.runInInjectionContext(() => authGuard(routeTo(path), {} as RouterStateSnapshot));

  beforeEach(() => {
    token = 'jwt';
    vi.clearAllMocks();
    loginService.userId.set(1);
    loginService.rolesUser.set([ROLES_CODE_SYSTEM.CASHIER]);
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: LoginService, useValue: loginService },
        { provide: LocalStorageService, useValue: { get: () => token } },
      ]
    });
  });

  it('permite la ruta si el usuario tiene alguno de sus roles', () => {
    expect(run('pos')).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redirige a /404 si la ruta no está registrada en urlsWithPermissions', () => {
    expect(run('ruta-inexistente')).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/404']);
  });

  it('cierra sesión si no hay token', () => {
    token = null;
    expect(run('pos')).toBe(false);
    expect(loginService.logout).toHaveBeenCalled();
  });

  it('restaura la sesión desde el token tras recargar la página', () => {
    loginService.userId.set(null);
    run('pos');
    expect(loginService.setUser).toHaveBeenCalled();
  });
});
