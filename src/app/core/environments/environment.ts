import { Environment } from "@core/interfaces/environment.interface";

/**
 * Producción (npm run build:prod). Solo existen dos entornos: desarrollo (localhost) y producción.
 * La URL de prod aún no está definida: por defecto el frontend llama a la API en el MISMO dominio
 * ('/cdr/', detrás de un proxy inverso que envía /cdr al backend). Si la API queda en otro dominio,
 * cambiar aquí por la URL absoluta (p. ej. 'https://api.dominio.com/cdr/') y agregar el dominio del
 * frontend a APP_CORS_ALLOWED_ORIGINS en el backend.
 */
export const environment: Environment = {
    production: true,
    app_name: 'Ciudad de Refugio',
    server_url: '/cdr/',
};
