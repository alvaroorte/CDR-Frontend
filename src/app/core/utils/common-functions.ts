import { PAGE_OFFSET } from "@core/constants/constants";
import { MESSAGES } from "@core/constants/messages";

/** Copiado de la referencia (solo la función usada). */
export function formatCurrentPageReportTemplate(first: number | null | undefined, totalRecords: number | null | undefined, rows: number | null | undefined, locale = 'es-BO'): string {
  if (!totalRecords) return MESSAGES.emptyMessage;
  const firstRecord = (first ?? 0) + PAGE_OFFSET;
  const lastRecord = Math.min((first ?? 0) + (rows ?? 0), totalRecords);
  return `Mostrando ${new Intl.NumberFormat(locale).format(firstRecord)} a ${new Intl.NumberFormat(locale).format(lastRecord)} de ${new Intl.NumberFormat(locale).format(totalRecords)} registros`;
}
