/** Reportes de la Etapa 6 (name() de ReportTypeEnum del backend). */
export enum REPORT_TYPE {
    SALES = 'SALES',
    PRODUCTS = 'PRODUCTS',
    PAYMENTS = 'PAYMENTS',
    OPERATIONS = 'OPERATIONS',
}

export const REPORT_TYPE_LABELS: Record<REPORT_TYPE, string> = {
    [REPORT_TYPE.SALES]: 'Ventas',
    [REPORT_TYPE.PRODUCTS]: 'Productos y categorías',
    [REPORT_TYPE.PAYMENTS]: 'Medios de pago y cajas',
    [REPORT_TYPE.OPERATIONS]: 'Usuarios, descuentos y estados',
};

/** Agrupación del reporte de ventas (ReportGroupByEnum). */
export enum REPORT_GROUP_BY {
    DAY = 'DAY',
    WEEK = 'WEEK',
    MONTH = 'MONTH',
}

export const REPORT_GROUP_BY_LABELS: Record<REPORT_GROUP_BY, string> = {
    [REPORT_GROUP_BY.DAY]: 'Día',
    [REPORT_GROUP_BY.WEEK]: 'Semana',
    [REPORT_GROUP_BY.MONTH]: 'Mes',
};
