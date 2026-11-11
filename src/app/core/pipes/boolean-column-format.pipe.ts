import { Pipe, PipeTransform } from "@angular/core";
import { BooleanColumnFormatConfig } from "@core/interfaces/boolean-column-format-config.interface";

@Pipe({ name: 'booleanColumnFormat', })
export class BooleanColumnFormatPipe implements PipeTransform {
  transform(value: boolean | null | undefined, config: BooleanColumnFormatConfig = { trueLabel: 'SI', falseLabel: 'NO' }): string {
    return value ? config.trueLabel : config.falseLabel;
  }
}
