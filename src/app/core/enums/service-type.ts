/** Modalidad del pedido (backend: ServiceTypeEnum). */
export enum SERVICE_TYPE {
    DINE_IN = "DINE_IN",
    TAKEAWAY = "TAKEAWAY"
}

export const SERVICE_TYPE_LABELS: Record<SERVICE_TYPE, string> = {
    [SERVICE_TYPE.DINE_IN]: "En el local",
    [SERVICE_TYPE.TAKEAWAY]: "Para llevar",
};
