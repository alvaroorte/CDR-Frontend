import { Base } from "./base";
import { UserRole } from "./login";

export class UserApp extends Base {
    id: number = 0;
    username: string = '';
    fullName: string = '';
    email: string | null = null;
    roles: UserRole[] = [];
    /** Texto para la tabla (nombres de roles separados por coma). */
    rolesLabel: string = '';
}

/** Cuerpo de POST/PUT /users (password solo al crear). */
export interface UserAppRequest {
    username: string;
    fullName: string;
    email: string | null;
    password: string | null;
    roleIds: number[];
    active: boolean;
}
