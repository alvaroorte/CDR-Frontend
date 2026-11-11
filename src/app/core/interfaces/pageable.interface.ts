/** PagePojo del backend (patrón de la referencia). */
export interface IPageable<T> {
    content: T[];
    last: boolean;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalElements: number;
}
