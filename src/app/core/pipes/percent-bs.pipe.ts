import { Pipe, PipeTransform } from '@angular/core';

const FORMATTER = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Porcentaje con el mismo formato que los importes: 50.34 → "50,34 %". Solo presentación. */
@Pipe({ name: 'percentBs' })
export class PercentBsPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    const amount = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(amount) ? `${FORMATTER.format(amount)} %` : '';
  }
}
