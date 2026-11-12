import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { LoginComponent } from './login.component';
import { LoginService } from '@core/services/login.service';
import { HelpersService } from '@core/services/helpers.service';

describe('LoginComponent', () => {
  const loginResponse = { token: 't', refreshToken: 'r', username: 'maria.caja', message: 'ok' };
  let loginService: {
    isLoggedIn: ReturnType<typeof signal<boolean>>;
    login: ReturnType<typeof vi.fn>;
    setSession: ReturnType<typeof vi.fn>;
    setUser: ReturnType<typeof vi.fn>;
    homeRoute: () => string;
  };
  let component: LoginComponent;

  beforeEach(() => {
    loginService = {
      isLoggedIn: signal(false),
      login: vi.fn().mockReturnValue(of(loginResponse)),
      setSession: vi.fn(),
      setUser: vi.fn(),
      homeRoute: () => '/pos',
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: LoginService, useValue: loginService },
        { provide: HelpersService, useValue: { messageNotification: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ]
    });
    component = TestBed.runInInjectionContext(() => new LoginComponent());
  });

  it('no envía el formulario si es inválido', () => {
    component.submitLogin();
    expect(loginService.login).not.toHaveBeenCalled();
  });

  it('envía el usuario recortado y la contraseña en base64, guarda la sesión y carga el usuario', () => {
    component.formLogin.setValue({ username: '  maria.caja ', password: 'Clave#ñ1' });

    component.submitLogin();

    expect(loginService.login).toHaveBeenCalledWith({
      username: 'maria.caja',
      password: LoginComponent.toBase64('Clave#ñ1'),
    });
    expect(loginService.setSession).toHaveBeenCalledWith(loginResponse);
    expect(loginService.setUser).toHaveBeenCalled();
  });

  it('toBase64 codifica en UTF-8 (caracteres como ñ no rompen btoa)', () => {
    expect(LoginComponent.toBase64('ñ')).toBe('w7E=');
  });
});
