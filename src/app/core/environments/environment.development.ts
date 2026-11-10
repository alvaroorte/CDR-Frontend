import { Environment } from "@core/interfaces/environment.interface";

// Desarrollo local (npm start). angular.json lo reemplaza en los demás builds.
export const environment: Environment = {
    production: false,
    app_name: 'Ciudad de Refugio',
    server_url: 'http://localhost:8086/cdr/',
};
