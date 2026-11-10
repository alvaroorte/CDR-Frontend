import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Lara from '@primeng/themes/lara';
import { routes } from './app.routes';
import { MessageService } from 'primeng/api';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { HeaderInterceptor } from '@core/interceptors/header.interceptor';
import { LoaderInterceptor } from '@core/interceptors/loader.interceptor';

/** Igual que la referencia sin reCAPTCHA ni hidratación (no hay SSR). */
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Lara,
        options: {
          prefix: 'p',
          darkModeSelector: '.cdr-mode-dark',
          cssLayer: false
        }
      },
      ripple: true,
    }),
    provideHttpClient(withInterceptorsFromDi()),
    MessageService,
    DatePipe,
    { provide: HTTP_INTERCEPTORS, useClass: HeaderInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true },
  ]
};
