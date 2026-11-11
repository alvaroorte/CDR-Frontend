import { Base } from "./base";
import { SelectOption } from "./select-option";

export class Product extends Base {
    id: number = 0;
    categoryId: number = 0;
    categoryName: string = '';
    name: string = '';
    description: string | null = null;
    /** base64 sin prefijo; solo viene en GET /product/{id}. */
    imageBase64: string | null = null;
    price: number = 0;
    available: boolean = true;
    version: number = 0;
    addons: SelectOption[] = [];
}

/** Cuerpo de POST/PUT /product. */
export interface ProductRequest {
    categoryId: number;
    name: string;
    description: string | null;
    imageBase64: string | null;
    price: number;
    available: boolean;
    active: boolean;
    addonIds: number[];
}
