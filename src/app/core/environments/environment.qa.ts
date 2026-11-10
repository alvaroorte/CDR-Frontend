import { Environment } from "@core/interfaces/environment.interface";

// TODO: URL del entorno qa pendiente de definir (decisión pendiente #16).
export const environment: Environment = {
    production: false,
    app_name: 'Ciudad de Refugio',
    server_url: 'http://localhost:8086/cdr/',
};
