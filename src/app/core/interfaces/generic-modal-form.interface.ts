export interface IGenericModalForm {
    openCreate(): void;
    openEdit?(id: number): void;
}