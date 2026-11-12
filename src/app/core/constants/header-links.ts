import { MenuHeader } from "@core/models/header";
import { ROLES_CODE_SYSTEM } from "../enums/roles";

const ADMIN = [ROLES_CODE_SYSTEM.ADMIN];
/** Cobran y registran pedidos: necesitan caja abierta. */
const CASH = [ROLES_CODE_SYSTEM.ADMIN, ROLES_CODE_SYSTEM.CASHIER];

/**
 * Mapa ruta → roles (patrón de la referencia). El authGuard lo usa para permitir la navegación y
 * el header para mostrar el menú (show: true en la barra superior).
 * El backend valida igualmente cada petición: esto solo controla la navegación y el menú.
 */
export const urlsWithPermissions: MenuHeader[] = [
  // ----- Operación (Etapa 3) -----
  { routerLink: 'pos', label: 'Nuevo pedido', access: CASH, show: true, icon: 'pi pi-shopping-cart' },
  { routerLink: 'orders', label: 'Pedidos', access: CASH, show: true, icon: 'pi pi-list' },
  { routerLink: 'kitchen', label: 'Cocina', access: [ROLES_CODE_SYSTEM.ADMIN, ROLES_CODE_SYSTEM.KITCHEN], show: true, icon: 'pi pi-stopwatch' },
  { routerLink: 'cash-register', label: 'Caja', access: CASH, show: true, icon: 'pi pi-wallet' },
  // ----- Reportes (Etapa 6, decisión aprobada: solo ADMIN) -----
  { routerLink: 'reports', label: 'Reportes', access: ADMIN, show: true, icon: 'pi pi-chart-bar' },
  // ----- Configuraciones (Etapa 2) -----
  { routerLink: 'categories', label: 'Categorías', access: ADMIN, show: false, icon: 'pi pi-th-large' },
  // CAJERO entra a productos solo para marcarlos agotados/disponibles (decisión aprobada).
  { routerLink: 'products', label: 'Productos', access: [ROLES_CODE_SYSTEM.ADMIN, ROLES_CODE_SYSTEM.CASHIER], show: false, icon: 'pi pi-shopping-bag' },
  { routerLink: 'addons', label: 'Adicionales', access: ADMIN, show: false, icon: 'pi pi-plus-circle' },
  { routerLink: 'table-markers', label: 'Números de mesa', access: ADMIN, show: false, icon: 'pi pi-hashtag' },
  { routerLink: 'payment-methods', label: 'Medios de pago', access: ADMIN, show: false, icon: 'pi pi-wallet' },
  { routerLink: 'parameters', label: 'Parámetros', access: ADMIN, show: false, icon: 'pi pi-sliders-h' },
  { routerLink: 'users', label: 'Usuarios', access: ADMIN, show: false, icon: 'pi pi-user' },
  { routerLink: 'roles', label: 'Roles y permisos', access: ADMIN, show: false, icon: 'pi pi-shield' },
];

/** Rutas que aparecen en el menú desplegable "Configuraciones" (filtradas por rol en el header). */
export const configurationLinks: string[] = [
  'categories', 'products', 'addons', 'table-markers', 'payment-methods', 'parameters', 'users', 'roles'
];
