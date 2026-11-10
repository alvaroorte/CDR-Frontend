import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

/** Rutas planas, todas lazy con loadComponent + authGuard (patrón de la referencia). */
export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./modules/login/login.component').then(c => c.LoginComponent),
  },
  {
    path: 'inicio',
    loadComponent: () => import('./modules/home/home.component').then(c => c.HomeComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(c => c.NotFoundComponent)
  }
];
