import { TABLE_DESCENDING_SORT_ORDER } from "../constants/constants";
import { COMMON } from "@core/constants/common";

export class PrimeTableProps {
  tableStyle: { [klass: string]: any } = { 'min-width': '90rem' };
  rowsPerPageOptions: number[] = [5, 10, 15];
  dataKey: string = 'id';
  sortOrder: 1 | -1 = TABLE_DESCENDING_SORT_ORDER;
  sortField: string = 'id';
  rows: number = COMMON.rows;
  rowTrackBy: (index: number, item: any) => any = (i, item) => item?.id;

  constructor(config?: Partial<PrimeTableProps>) {
    Object.assign(this, config);
  }
}
