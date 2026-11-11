import { DISCOUNT_TYPE } from "@core/enums/discount-type";
import { ORDER_STATUS } from "@core/enums/order-status";
import { SERVICE_TYPE } from "@core/enums/service-type";

// ----- Peticiones: solo ids, cantidades, descuento y pagos. NUNCA importes calculados. -----

export interface OrderItemRequest {
    productId: number;
    quantity: number;
    addonIds: number[];
    notes: string | null;
}

export interface DiscountRequest {
    type: DISCOUNT_TYPE;
    value: number;
    reason: string | null;
}

export interface OrderQuoteRequest {
    items: OrderItemRequest[];
    discount: DiscountRequest | null;
}

/** Importe APLICADO al pedido; el recibido y el vuelto no se envían. */
export interface PaymentRequest {
    paymentMethodId: number;
    amount: number;
    reference: string | null;
}

export interface OrderRequest extends OrderQuoteRequest {
    serviceType: SERVICE_TYPE;
    tableMarkerId: number | null;
    customerName: string | null;
    payments: PaymentRequest[];
}

// ----- Respuestas (calculadas por el backend) -----

export interface OrderItemAddon {
    addonId: number;
    addonName: string;
    unitPrice: number;
}

export interface OrderItem {
    id: number | null;
    productId: number;
    productName: string;
    categoryName: string;
    quantity: number;
    unitPrice: number;
    addonsUnitTotal: number;
    lineSubtotal: number;
    notes: string | null;
    addons: OrderItemAddon[];
}

/** POST /order/quote: lo que muestra el resumen de confirmación. */
export interface OrderQuote {
    items: OrderItem[];
    subtotal: number;
    discountType: DISCOUNT_TYPE | null;
    discountValue: number | null;
    discountAmount: number;
    discountPercent: number | null;
    discountReason: string | null;
    total: number;
}

export interface Payment {
    id: number;
    paymentMethodId: number;
    paymentMethodCode: string;
    paymentMethodName: string;
    amount: number;
    reference: string | null;
    status: string;
    statusLabel: string;
}

export interface Order {
    id: number;
    code: number;
    codeLabel: string;
    businessDate: string;
    serviceType: SERVICE_TYPE;
    serviceTypeLabel: string;
    tableMarkerId: number | null;
    tableMarkerNumber: number | null;
    customerName: string | null;
    status: ORDER_STATUS;
    statusLabel: string;
    subtotal: number;
    discountType: DISCOUNT_TYPE | null;
    discountValue: number | null;
    discountAmount: number;
    discountReason: string | null;
    discountAppliedBy: string | null;
    total: number;
    items: OrderItem[];
    payments: Payment[];
    createdBy: string;
    createdAt: string;
    version: number;
}

export interface OrderStatusHistory {
    fromStatus: ORDER_STATUS | null;
    fromStatusLabel: string | null;
    toStatus: ORDER_STATUS;
    toStatusLabel: string;
    changedBy: string;
    changedAt: string;
    note: string | null;
}

/** Detalle completo (GET /order/{id}). */
export interface OrderDetail extends Order {
    statusHistory: OrderStatusHistory[];
    cancelReason: string | null;
    cancelledBy: string | null;
    cancelledAt: string | null;
}

/** Pedido del tablero de cocina / seguimiento (GET /order/board y eventos WebSocket). */
export interface OrderBoard {
    id: number;
    code: number;
    codeLabel: string;
    serviceType: SERVICE_TYPE;
    serviceTypeLabel: string;
    tableMarkerNumber: number | null;
    customerName: string | null;
    status: ORDER_STATUS;
    statusLabel: string;
    total: number;
    version: number;
    createdAt: string;
    createdBy: string;
    statusChangedAt: string | null;
    items: { productName: string; quantity: number; notes: string | null; addons: string[] }[];
}

export type OrderEventType = 'ORDER_CREATED' | 'ORDER_STATUS_CHANGED' | 'ORDER_CANCELLED';

/** Mensaje de /topic/orders. */
export interface OrderEvent {
    eventId: string;
    type: OrderEventType;
    orderId: number;
    version: number;
    status: ORDER_STATUS;
    occurredAt: string;
    order: OrderBoard;
}

/** Mensaje de /topic/catalog. */
export interface CatalogEvent {
    eventId: string;
    type: 'PRODUCT_AVAILABILITY_CHANGED';
    productId: number;
    available: boolean;
    version: number | null;
    occurredAt: string;
}

/** Fila del historial (GET /order/pageable). */
export interface OrderListItem {
    id: number;
    codeLabel: string;
    businessDate: string;
    createdAt: string;
    serviceType: SERVICE_TYPE;
    serviceTypeLabel: string;
    tableMarkerNumber: number | null;
    customerName: string | null;
    status: ORDER_STATUS;
    statusLabel: string;
    subtotal: number;
    discountAmount: number;
    total: number;
    createdBy: string;
    version: number;
}

export interface OrderHistoryFilter {
    dateFrom: string | null;
    dateTo: string | null;
    status: ORDER_STATUS | null;
    serviceType: SERVICE_TYPE | null;
    code: number | null;
}

export interface KitchenSettings {
    delayWarningMinutes: number;
    delayCriticalMinutes: number;
}
