import { Pipe, PipeTransform } from '@angular/core';
import { formatCurrentPageReportTemplate } from '../utils/common-functions';

@Pipe({
    name: 'formatCurrentPageReportTemplate',
    pure: true
})
export class FormatCurrentPageReportTemplatePipe implements PipeTransform {
  transform(first: number | null | undefined,
    totalRecords: number | null | undefined,
    rows: number | null | undefined,
    locale: string = 'es-BO'
  ): string {
    return formatCurrentPageReportTemplate(first, totalRecords, rows, locale);
  }
}
