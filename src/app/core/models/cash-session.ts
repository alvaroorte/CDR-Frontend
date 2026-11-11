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
    /** Efectivo esperado en curso: apertura + ventas − devoluciones + ingresos − egresos. */
    expectedCash: number;
    salesByMethod: CashMethodTotal[];
    movements: CashMovement[];
    /** Arqueo por medio (solo en cajas cerradas). */
    summaries: CashSummary[];
    closedBy: string | null;
    closingNote: string | null;
    version: number;
}

export interface CashMovementRequest {
    type: CASH_MOVEMENT_TYPE.INCOME | CASH_MOVEMENT_TYPE.EXPENSE;
    amount: number;
    description: string;
}

/** Arqueo por medio de pago; difference = declarado − esperado (negativo = faltante). */
export interface CashSummary {
    cashSessionId: number;
    paymentMethodId: number;
    paymentMethodCode: string;
    paymentMethodName: string;
    expectedAmount: number;
    declaredAmount: number;
    difference: number;
}

export interface CashMethodExpected {
    paymentMethodId: number;
    paymentMethodCode: string;
    paymentMethodName: string;
    /** Efectivo: incluye apertura, ingresos y egresos. */
    cash: boolean;
    expectedAmount: number;
}

export interface CashOpenOrder {
    id: number;
    codeLabel: string;
    status: string;
    statusLabel: string;
}

/** GET /cash-session/{id}/close-preview */
export interface CashClosePreview {
    cashSessionId: number;
    version: number;
    userId: number;
    userFullName: string;
    /** false = un ADMIN cerrando la caja de otro (nota obligatoria). */
    ownSession: boolean;
    openedAt: string;
    openingAmount: number;
    methods: CashMethodExpected[];
    /** Pedidos de esta caja sin entregar: se puede cerrar igual (advertencia). */
    openOrders: CashOpenOrder[];
}

export interface CashCloseRequest {
    expectedVersion: number;
    declared: { paymentMethodId: number; amount: number }[];
    note: string | null;
}

/** Fila del historial y de "cajas abiertas". Totales del arqueo null si está abierta. */
export interface CashSessionListItem {
    id: number;
    userId: number;
    username: string;
    userFullName: string;
    status: 'OPEN' | 'CLOSED';
    statusLabel: string;
    openedAt: string;
    closedAt: string | null;
    closedBy: string | null;
    openingAmount: number;
    expectedTotal: number | null;
    declaredTotal: number | null;
    differenceTotal: number | null;
    version: number;
}

export interface CashSessionFilter {
    userId: number | null;
    status: 'OPEN' | 'CLOSED' | null;
    dateFrom: string | null;
    dateTo: string | null;
}
