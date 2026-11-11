import { Pipe, PipeTransform, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FORMAT_DATE, FORMAT_DATE_TIME } from '@core/constants/format-date-time';

@Pipe({ name: 'formatDate' })
export class FormatDatePipe implements PipeTransform {

  private datePipe = inject(DatePipe);
  transform(value: string | null, ...args: unknown[]): string {
    if (!value) return "";
    return this.datePipe.transform(value, FORMAT_DATE) as string;
  }
}

@Pipe({ name: 'formatDateWhitHour' })
export class FormatDateWithHourPipe implements PipeTransform {
  private datePipe = inject(DatePipe);
  transform(value: string | null, ...args: unknown[]): string {
    if (!value) return "";
    return this.datePipe.transform(value, FORMAT_DATE_TIME) as string;
  }
}
