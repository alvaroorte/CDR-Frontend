import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterPipePipe } from './filter-pipe.pipe';
import { FormatDatePipe, FormatDateWithHourPipe } from './format-date.pipe';
import { FormatSafeLinkPipe } from './format-safe-link.pipe';
import { FormatCurrentPageReportTemplatePipe } from './format-current-page-report-template.pipe';
import { BooleanColumnFormatPipe } from './boolean-column-format.pipe';
import { FormatFieldAmountPipe } from './format-field-amount.pipe';
import { SanitizeHtmlPipe } from './sanitize-html.pipe';
import { CurrencyBsPipe } from './currency-bs.pipe';

@NgModule({
    imports: [
        CommonModule,
        FilterPipePipe,
        FormatDatePipe,
        FormatDateWithHourPipe,
        FormatSafeLinkPipe,
        FormatCurrentPageReportTemplatePipe,
        BooleanColumnFormatPipe,
        FormatFieldAmountPipe,
        SanitizeHtmlPipe,
        CurrencyBsPipe
    ],
    exports: [
        FormatDatePipe,
        FormatDateWithHourPipe,
        FormatSafeLinkPipe,
        FormatCurrentPageReportTemplatePipe,
        BooleanColumnFormatPipe,
        FormatFieldAmountPipe,
        SanitizeHtmlPipe,
        CurrencyBsPipe
    ]
})
export class PipesModule { }
