import { Component, inject, OnInit, output, input, OnDestroy, signal } from '@angular/core';
import { HelpersService } from '@core/services/helpers.service';
import { RouterModule } from '@angular/router';
import { PrimeModules } from '../../prime-components/prime-components.module';
import { MESSAGES } from '@core/constants/messages';
import { LABELS } from '@core/constants/labels';
import { IServiceCommon } from '@core/interfaces/service-common.interface';
import { Severity } from '@core/enums/severity';

/**
 * Copiado de la referencia. En este sistema "eliminar" es un borrado lógico (desactivar), por eso
 * el texto de confirmación y el toast se pueden personalizar con confirmMessage / successMessage.
 */
@Component({
    selector: 'app-modal-delete',
    imports: [RouterModule, PrimeModules],
    templateUrl: './modal-delete.component.html'
})
export class ModalDeleteComponent implements OnInit, OnDestroy {
  readonly serviceGeneric = input.required<IServiceCommon>();
  readonly objectId = input.required<number | null | undefined>();
  readonly confirmMessage = input<string>(MESSAGES.areYouSureDeactivateItemSelected);
  readonly successMessage = input<string>(MESSAGES.recordDeactivated);
  readonly onDeleteSuccess = output();

  private helpersService = inject(HelpersService);

  public readonly labels = LABELS;
  public readonly messages = MESSAGES;
  public openModal = signal<boolean>(false);

  ngOnInit(): void {
    this.serviceGeneric().eventModalDeleteComponent.set(this);
  }

  ngOnDestroy(): void {
    this.serviceGeneric().eventModalDeleteComponent.set(null);
  }

  public openConfirm(): void {
    this.openModalDelete(true);
  }

  public confirmDelete(): void {
    const id = this.objectId();
    this.openModalDelete(false);
    if (!id) {
      return;
    }
    this.serviceGeneric().delete(id).subscribe({
      next: () => {
        this.serviceGeneric().eventTableComponent()?.reload();
        this.onDeleteSuccess.emit();
        this.helpersService.messageNotification(Severity.success, LABELS.ok, this.successMessage());
      }
    });
  }

  public openModalDelete(state: boolean): void {
    this.openModal.set(state);
  }
}
