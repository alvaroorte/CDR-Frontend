/**
 * Modal propio que se abre desde la página (skill angular-crud, detail-and-variants §3):
 * el modal se registra en un signal del servicio y la página llama open(id).
 */
export interface IOpenableModal {
    open(id: number): void;
}
