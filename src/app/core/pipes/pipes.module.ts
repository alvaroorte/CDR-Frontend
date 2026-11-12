import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterPipePipe } from './filter-pipe.pipe';
import { FormatDatePipe, FormatDateWithHourPipe } from './format-date.pipe';
import { FormatCurrentPageReportTemplatePipe } from './format-current-page-report-template.pipe';
import { BooleanColumnFormatPipe } from './boolean-column-format.pipe';
import { FormatFieldAmountPipe } from './format-field-amount.pipe';
import { CurrencyBsPipe } from './currency-bs.pipe';
import { OrderStatusLabelPipe } from './order-status-label.pipe';
import { PercentBsPipe } from './percent-bs.pipe';

@NgModule({
    imports: [
        CommonModule,
        FilterPipePipe,
        FormatDatePipe,
        FormatDateWithHourPipe,
        FormatCurrentPageReportTemplatePipe,
        BooleanColumnFormatPipe,
        FormatFieldAmountPipe,
        CurrencyBsPipe,
        OrderStatusLabelPipe,
        PercentBsPipe
    ],
    exports: [
        FormatDatePipe,
        FormatDateWithHourPipe,
        FormatCurrentPageReportTemplatePipe,
        BooleanColumnFormatPipe,
        FormatFieldAmountPipe,
        CurrencyBsPipe,
        OrderStatusLabelPipe,
        PercentBsPipe
    ]
})
export class PipesModule { }
