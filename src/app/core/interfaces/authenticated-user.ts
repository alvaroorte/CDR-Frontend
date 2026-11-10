import { ROLES_CODE_SYSTEM } from "@core/enums/roles";

/** Claims del JWT emitido por cdr-backend (JwtService). */
export interface AuthenticatedUser {
  iat: number;
  exp: number;
  isAdmin: boolean;
  sub: string;
  userId: number;
  fullName: string;
  authorities: ROLES_CODE_SYSTEM[];
}
