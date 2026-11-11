import { Base } from "./base";

export class PaymentMethod extends Base {
    id: number = 0;
    code: string = '';
    name: string = '';
    requiresReference: boolean = false;
    givesChange: boolean = false;
}
