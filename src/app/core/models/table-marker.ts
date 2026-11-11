import { Base } from "./base";

/** Adorno numerado que el cajero entrega al cliente para su mesa. */
export class TableMarker extends Base {
    id: number = 0;
    number: number = 0;
    description: string | null = null;
}

/** GET /table-marker/availability: ocupación derivada de los pedidos abiertos. */
export interface TableMarkerAvailability {
    id: number;
    number: number;
    description: string | null;
    inUse: boolean;
    orderId: number | null;
    orderCodeLabel: string | null;
}
