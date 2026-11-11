import { Base } from "./base";

export class Role extends Base {
    id: number = 0;
    name: string = '';
    code: string = '';
    description: string | null = null;
    /** ADMIN, CAJERO, COCINA: no se desactivan ni cambian de código. */
    system: boolean = false;
}

export interface Permission {
    id: number;
    code: string;
    name: string;
    description: string;
    httpMethod: string;
    url: string;
}
