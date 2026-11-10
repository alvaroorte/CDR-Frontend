import { MenuHeader } from "@core/models/header";
import { ROLES_CODE_SYSTEM } from "../enums/roles";

const ALL_ROLES = [ROLES_CODE_SYSTEM.ADMIN, ROLES_CODE_SYSTEM.CASHIER, ROLES_CODE_SYSTEM.KITCHEN];

/**
 * Mapa ruta → roles (patrón de la referencia). El authGuard lo usa para permitir la navegación y
 * el header para mostrar el menú (show: true en la barra superior).
 * Cada etapa añade aquí sus rutas (pos, orders, kitchen, cash-register, reports, CRUDs...).
 */
export const urlsWithPermissions: MenuHeader[] = [
  { routerLink: 'inicio', label: 'Inicio', access: ALL_ROLES, show: true, icon: 'pi pi-home' },
];

/** Rutas que aparecen en el menú desplegable "Configuraciones" (CRUDs de administración, Etapa 2). */
export const configurationLinks: string[] = [];
