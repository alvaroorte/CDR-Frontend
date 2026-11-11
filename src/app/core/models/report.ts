import { REPORT_GROUP_BY } from "@core/enums/report-type";
import { SERVICE_TYPE } from "@core/enums/service-type";

/**
 * Reportes (GET /report/*). Importes calculados en el backend desde las fotografías del pedido:
 * Bruto (subtotal), Descuentos, Neto (total) y Pagado (pagos vigentes). Sin cancelados salvo donde se indica.
 */

/** Filtros: fechas de negocio 'YYYY-MM-DD' obligatorias; el resto opcional (null = sin filtro). */
export interface ReportFilter {
    dateFrom: string;
    dateTo: string;
    groupBy: REPORT_GROUP_BY | null;
    userId: number | null;
    serviceType: SERVICE_TYPE | null;
    categoryId: number | null;
    paymentMethodId: number | null;
}

export interface SalesReport {
    dateFrom: string;
    dateTo: string;
    groupBy: REPORT_GROUP_BY;
    groupByLabel: string;
    summary: SalesSummary;
    periods: SalesPeriod[];
    serviceTypes: ServiceTypeSales[];
}

export interface SalesSummary {
    orderCount: number;
    gross: number;
    discount: number;
    net: number;
    /** Pagos vigentes (PAID). */
    paid: number;
    /** Devoluciones de pedidos cancelados del rango. */
    refunded: number;
    averageTicket: number;
    cancelledCount: number;
    cancelledAmount: number;
}

export interface SalesPeriod {
    periodStart: string;
    orderCount: number;
    gross: number;
    discount: number;
    net: number;
}

export interface ServiceTypeSales {
    serviceType: SERVICE_TYPE;
    serviceTypeLabel: string;
    orderCount: number;
    net: number;
    sharePercent: number;
}

/** gross = líneas antes del descuento general del pedido (no se reparte por línea). */
export interface ProductsReport {
    dateFrom: string;
    dateTo: string;
    products: ProductSales[];
    categories: CategorySales[];
}

export interface ProductSales {
    productId: number;
    productName: string;
    categoryName: string;
    quantity: number;
    orderCount: number;
    gross: number;
    sharePercent: number;
}

export interface CategorySales {
    categoryId: number;
    categoryName: string;
    quantity: number;
    gross: number;
    sharePercent: number;
}

export interface PaymentsReport {
    dateFrom: string;
    dateTo: string;
    paymentMethods: PaymentMethodSales[];
    cashSessions: CashSessionReportRow[];
}

export interface PaymentMethodSales {
    paymentMethodId: number;
    paymentMethodName: string;
    paidCount: number;
    paid: number;
    refundedCount: number;
    refunded: number;
    sharePercent: number;
}

/** Totales del arqueo en null mientras la caja esté abierta. */
export interface CashSessionReportRow {
    id: number;
    username: string;
    userFullName: string;
    status: 'OPEN' | 'CLOSED';
    statusLabel: string;
    openedAt: string;
    closedAt: string | null;
    closedBy: string | null;
    openingAmount: number;
    salesTotal: number;
    expectedTotal: number | null;
    declaredTotal: number | null;
    differenceTotal: number | null;
}

export interface OperationsReport {
    dateFrom: string;
    dateTo: string;
    users: UserSales[];
    statuses: StatusCount[];
    discounts: DiscountOrder[];
    cancellations: CancelledOrder[];
}

export interface UserSales {
    userId: number;
    username: string;
    userFullName: string;
    orderCount: number;
    gross: number;
    discount: number;
    net: number;
    cancelledCount: number;
}

export interface StatusCount {
    status: string;
    statusLabel: string;
    orderCount: number;
    total: number;
}

export interface DiscountOrder {
    orderId: number;
    codeLabel: string;
    businessDate: string;
    createdAt: string;
    cashier: string;
    discountType: string;
    discountTypeLabel: string;
    discountValue: number;
    subtotal: number;
    discountAmount: number;
    total: number;
    discountReason: string | null;
    appliedBy: string | null;
}

export interface CancelledOrder {
    orderId: number;
    codeLabel: string;
    businessDate: string;
    createdAt: string;
    cashier: string;
    total: number;
    cancelReason: string | null;
    cancelledBy: string | null;
    cancelledAt: string | null;
}

/** Archivo en base64 (mismo contrato que AttachmentRecord de la referencia). */
export interface ReportAttachment {
    name: string;
    file: string;
    typeFile: 'EXCEL';
}
