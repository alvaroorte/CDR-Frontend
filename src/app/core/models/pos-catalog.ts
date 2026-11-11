/** GET /pos/catalog: todo lo que el POS necesita en una llamada (incluye imágenes). */
export interface PosCatalog {
    categories: PosCategory[];
    paymentMethods: PosPaymentMethod[];
    discountRules: DiscountRules;
}

export interface PosCategory {
    id: number;
    name: string;
    /** base64 sin prefijo o null. */
    imageBase64: string | null;
    products: PosProduct[];
}

export interface PosProduct {
    id: number;
    categoryId: number;
    name: string;
    description: string | null;
    imageBase64: string | null;
    price: number;
    /** false = agotado: se muestra deshabilitado. */
    available: boolean;
    addons: PosAddon[];
}

export interface PosAddon {
    id: number;
    name: string;
    price: number;
}

export interface PosPaymentMethod {
    id: number;
    code: string;
    name: string;
    requiresReference: boolean;
    /** El POS muestra "Recibido" y el vuelto (solo visual, no se envía). */
    givesChange: boolean;
}

/** Parámetros vigentes; el backend valida igual. */
export interface DiscountRules {
    cashierMaxPercent: number;
    reasonRequiredAbovePercent: number;
}
