import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MESSAGES } from '@core/constants/messages';
import { LABELS } from '@core/constants/labels';
import { LoginService } from '@core/services/login.service';
import { HelpersService } from '@core/services/helpers.service';
import { LoginRequest } from '@core/models/login';
import { Severity } from '@core/enums/severity';
import { PrimeModules } from '@shared/prime-components/prime-components.module';
import { environment } from '@core/environments/environment.development';

/**
 * Login de la referencia sin reCAPTCHA ni badges de tiendas móviles.
 * Login por nombre de usuario; contraseña enviada en base64 (patrón de la referencia).
 */
@Component({
    selector: 'app-login',
    imports: [PrimeModules, ReactiveFormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  private loginService = inject(LoginService);
  private router = inject(Router);
  private helpersService = inject(HelpersService);
  private formBuilder = inject(FormBuilder);

  public readonly labels = LABELS;
  public readonly messages = MESSAGES;
  public readonly appName = environment.app_name;
  public readonly formLogin = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  constructor() {
    effect(() => {
      if (this.loginService.isLoggedIn()) {
        this.router.navigate([this.loginService.homeRoute()]);
      }
    });
  }

  public submitLogin(): void {
    if (this.formLogin.invalid) {
      return;
    }
    const { username, password } = this.formLogin.getRawValue();
    const data: LoginRequest = { username: username.trim(), password: LoginComponent.toBase64(password) };
    this.loginService.login(data).subscribe({
      next: (res) => {
        this.loginService.setSession(res);
        this.helpersService.messageNotification(Severity.success, LABELS.ok, MESSAGES.welcome(res.username));
      },
      complete: () => {
        this.loginService.setUser();
      }
    });
  }

  /** UTF-8 → base64 (igual que la referencia: btoa no admite caracteres fuera de Latin-1). */
  public static toBase64(value: string): string {
    const utf8Bytes = new TextEncoder().encode(value);
    return btoa(String.fromCharCode(...utf8Bytes));
  }
}
