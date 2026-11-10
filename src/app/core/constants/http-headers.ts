/**
 * Identifica el canal ante el backend para las métricas de uso por canal (web / móvil).
 * No es un secreto: el backend solo lo usa para contar actividad (`security.user_activity`).
 */
export const CLIENT_PLATFORM = {
    HEADER: 'X-Client-Platform',
    WEB: 'WEB',
} as const;
