/** Tipos de movimiento de caja (backend: CashMovementTypeEnum). */
export enum CASH_MOVEMENT_TYPE {
    OPENING = "OPENING",
    SALE = "SALE",
    REFUND = "REFUND",
    INCOME = "INCOME",
    EXPENSE = "EXPENSE"
}

/** Movimientos que restan del efectivo. */
export const CASH_OUTFLOW_TYPES: readonly CASH_MOVEMENT_TYPE[] = [CASH_MOVEMENT_TYPE.REFUND, CASH_MOVEMENT_TYPE.EXPENSE];
