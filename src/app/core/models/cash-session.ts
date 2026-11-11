import { CASH_MOVEMENT_TYPE } from "@core/enums/cash-movement-type";

export interface CashMovement {
    id: number;
    type: CASH_MOVEMENT_TYPE;
    typeLabel: string;
    paymentMethodId: number | null;
    paymentMethodCode: string | null;
    paymentMethodName: string | null;
    /** Siempre positivo; el tipo indica si suma o resta. */
    amount: number;
    orderId: number | null;
    description: string | null;
    createdBy: string;
    createdAt: string;
}

export interface CashMethodTotal {
    paymentMethodId: number;
    paymentMethodCode: string;
    paymentMethodName: string;
    amount: number;
}

/** GET /cash-session/current (204 = sin caja abierta). */
export interface CashSession {
    id: number;
    userId: number;
    username: string;
    userFullName: string;
    status: string;
    statusLabel: string;
    openingAmount: number;
    openedAt: string;
    closedAt: string | null;
    salesTotal: number;
    refundsTotal: number;
    incomeTotal: number;
    expenseTotal: number;
    /** Informativo; el arqueo y cierre son de la Etapa 5. */
    expectedCash: number;
    salesByMethod: CashMethodTotal[];
    movements: CashMovement[];
    version: number;
}

export interface CashMovementRequest {
    type: CASH_MOVEMENT_TYPE.INCOME | CASH_MOVEMENT_TYPE.EXPENSE;
    amount: number;
    description: string;
}
