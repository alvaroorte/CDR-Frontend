import { Confirmation } from "primeng/api"
import { LABELS } from "./labels"

export const COMMON = {
  rows: 10,
  minimumRows: 5,
  rowsPerPageOptions: [5, 10, 15],
  inputDebounceDelay: 500,
  dateDisplayFormat: 'dd/MM/yyyy',
  dateTimeDisplayFormat: 'dd/MM/yyyy HH:mm',
  dateForBack: 'yyyy-MM-dd',
  decimalsAllowed: '.2-2',
  percentageDivider: 100,
} as const

export const confimationCommon: Confirmation = {
  message: '¿Está seguro de realizar esta acción?',
  header: 'Confirmación',
  icon: 'pi pi-exclamation-triangle text-5xl text-yellow-500',
  acceptIcon: "pi pi-check mr-2",
  rejectIcon: "pi pi-times mr-2",
  acceptLabel: LABELS.yes,
  rejectLabel: LABELS.no,
  rejectButtonStyleClass: "p-button-sm p-button-rounded p-button-secondary shadow-3",
  acceptButtonStyleClass: "p-button-sm p-button-rounded shadow-3 mr-2"
}
