import { Pipe, PipeTransform } from '@angular/core';

const FORMATTER = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Importe en bolivianos: 1234.5 → "Bs 1.234,50". Solo presentación. */
@Pipe({ name: 'currencyBs' })
export class CurrencyBsPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    const amount = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(amount) ? `Bs ${FORMATTER.format(amount)}` : '';
  }
}
