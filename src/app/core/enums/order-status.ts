/** Estados del pedido (backend: OrderStatusEnum; en BD el name() en inglés). */
export enum ORDER_STATUS {
    PENDING = "PENDING",
    IN_PREPARATION = "IN_PREPARATION",
    READY = "READY",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED"
}

/** Estados abiertos: ocupan el número de mesa y se muestran en cocina y seguimiento. */
export const OPEN_ORDER_STATUSES: readonly ORDER_STATUS[] = [ORDER_STATUS.PENDING, ORDER_STATUS.IN_PREPARATION, ORDER_STATUS.READY];

export const ORDER_STATUS_LABELS: Record<ORDER_STATUS, string> = {
    [ORDER_STATUS.PENDING]: 'Pendiente',
    [ORDER_STATUS.IN_PREPARATION]: 'En preparación',
    [ORDER_STATUS.READY]: 'Listo',
    [ORDER_STATUS.DELIVERED]: 'Entregado',
    [ORDER_STATUS.CANCELLED]: 'Cancelado',
};

/** Severidad de p-tag por estado. */
export const ORDER_STATUS_SEVERITY: Record<ORDER_STATUS, 'warn' | 'info' | 'success' | 'secondary' | 'danger'> = {
    [ORDER_STATUS.PENDING]: 'warn',
    [ORDER_STATUS.IN_PREPARATION]: 'info',
    [ORDER_STATUS.READY]: 'success',
    [ORDER_STATUS.DELIVERED]: 'secondary',
    [ORDER_STATUS.CANCELLED]: 'danger',
};
