import { DISCOUNT_TYPE } from "@core/enums/discount-type";

/**
 * Redondeo a 2 decimales HALF_UP para la VISTA PREVIA (el backend recalcula todo con BigDecimal).
 * Se redondea sobre la representación decimal (toFixed de 10 dígitos) para evitar errores de
 * coma flotante como 1.005 → 1.00.
 */
export function round2(value: number): number {
    const sign = value < 0 ? -1 : 1;
    const abs = Math.abs(value);
    const shifted = Number(`${abs.toFixed(10)}e2`);
    return sign * Math.round(shifted) / 100;
}

/** Descuento de vista previa: mismo criterio que OrderPricingService. */
export function previewDiscountAmount(subtotal: number, type: DISCOUNT_TYPE | null, value: number | null): number {
    if (type === null || value === null || value <= 0 || subtotal <= 0) {
        return 0;
    }
    const amount = type === DISCOUNT_TYPE.PERCENTAGE ? round2(subtotal * value / 100) : round2(value);
    return Math.min(amount, subtotal);
}
