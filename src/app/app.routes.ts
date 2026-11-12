import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

/** Rutas planas, todas lazy con loadComponent + authGuard (patrón de la referencia). */
export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./modules/login/login.component').then(c => c.LoginComponent),
  },
  // ----- Operación (Etapa 3) -----
  {
    path: 'pos',
    loadComponent: () => import('./modules/pos/pos.component').then(c => c.PosComponent),
    canActivate: [authGuard]
  },
  {
    path: 'cash-register',
    loadComponent: () => import('./modules/cash-register/cash-register.component').then(c => c.CashRegisterComponent),
    canActivate: [authGuard]
  },
  // ----- Tiempo real (Etapa 4) -----
  {
    path: 'kitchen',
    loadComponent: () => import('./modules/kitchen/kitchen.component').then(c => c.KitchenComponent),
    canActivate: [authGuard]
  },
  {
    path: 'orders',
    loadComponent: () => import('./modules/orders/orders.component').then(c => c.OrdersComponent),
    canActivate: [authGuard]
  },
  // ----- Reportes (Etapa 6) -----
  {
    path: 'reports',
    loadComponent: () => import('./modules/report/report.component').then(c => c.ReportComponent),
    canActivate: [authGuard]
  },
  // ----- Configuraciones (Etapa 2) -----
  {
    path: 'categories',
    loadComponent: () => import('./modules/category/category.component').then(c => c.CategoryComponent),
    canActivate: [authGuard]
  },
  {
    path: 'products',
    loadComponent: () => import('./modules/product/product.component').then(c => c.ProductComponent),
    canActivate: [authGuard]
  },
  {
    path: 'addons',
    loadComponent: () => import('./modules/addon/addon.component').then(c => c.AddonComponent),
    canActivate: [authGuard]
  },
  {
    path: 'table-markers',
    loadComponent: () => import('./modules/table-marker/table-marker.component').then(c => c.TableMarkerComponent),
    canActivate: [authGuard]
  },
  {
    path: 'payment-methods',
    loadComponent: () => import('./modules/payment-method/payment-method.component').then(c => c.PaymentMethodComponent),
    canActivate: [authGuard]
  },
  {
    path: 'parameters',
    loadComponent: () => import('./modules/parameter/parameter.component').then(c => c.ParameterComponent),
    canActivate: [authGuard]
  },
  {
    path: 'users',
    loadComponent: () => import('./modules/user/user.component').then(c => c.UserComponent),
    canActivate: [authGuard]
  },
  {
    path: 'roles',
    loadComponent: () => import('./modules/role/role.component').then(c => c.RoleComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(c => c.NotFoundComponent)
  }
];
