import { TableColumnType } from "@core/enums/table-column-type.enum";
import { Align } from "../enums/align";
import { BooleanColumnFormatConfig } from "./boolean-column-format-config.interface";

export interface TableColumn<T> {
  field: Extract<keyof T, string>;
  header: string;
  align?: Align,
  isDecimal?: boolean,
  columnType?: TableColumnType;
  hideSortIcon?: boolean;
  notfilterByThisfield?: boolean;
  showTooltip?: boolean;
  booleanColumnFormatConfig?: BooleanColumnFormatConfig;
  initiallyHidden?: boolean;
}

export interface TableDataPage {
  firstPage: number;
  rows: number;
  optionsPage: number[];
}