import { Base } from "./base";

export type ParameterValueType = 'PERCENTAGE' | 'NUMBER' | 'TEXT' | 'BOOLEAN';

export class Parameter extends Base {
    id: number = 0;
    folder: string = '';
    code: string = '';
    name: string = '';
    value: string = '';
    valueType: ParameterValueType = 'TEXT';
    description: string | null = null;
    editable: boolean = true;
}
