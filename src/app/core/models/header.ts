import { ROLES_CODE_SYSTEM } from "@core/enums/roles";

export interface MenuHeader {
    label: string;
    routerLink: string;
    access: ROLES_CODE_SYSTEM[];
    show: boolean;
    icon?: string;
}
