export interface LoginRequest {
    username: string;
    /** Contraseña en base64 (patrón de la referencia; la protección real es HTTPS). */
    password: string;
}

export interface LoginResponse {
    message: string;
    refreshToken: string;
    token: string;
    username: string;
}

export interface UserRole {
    id: number;
    name: string;
    code: string;
}

/** Respuesta de GET /users/me. */
export interface UserInfo {
    id: number;
    username: string;
    fullName: string;
    email: string | null;
    roles: UserRole[];
}
