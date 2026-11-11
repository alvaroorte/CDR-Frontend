import { Base } from "./base";

export class Category extends Base {
    id: number = 0;
    name: string = '';
    description: string | null = null;
    /** base64 sin prefijo; solo viene en GET /category/{id}. */
    imageBase64: string | null = null;
    ranking: number = 0;
}
