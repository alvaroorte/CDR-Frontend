import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'formatFieldAmount' })
export class FormatFieldAmountPipe implements PipeTransform {
  transform(value: number, maxFractionDigits: number = 2, minFractionDigits: number = 2): string | number {
    if (typeof value !== 'number') {
      try {
        value = parseFloat(value);
      } catch (error) {
        return value;
      }
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: minFractionDigits,
      maximumFractionDigits: maxFractionDigits
    }).format(value);
  }
}
