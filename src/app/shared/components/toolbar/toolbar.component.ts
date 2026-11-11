import { Component, inject, input } from '@angular/core';
import { HelpersService } from '@core/services/helpers.service';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PrimeModules } from '@shared/prime-components/prime-components.module';
import { IServiceCommon } from '@core/interfaces/service-common.interface';
import { MESSAGES } from '@core/constants/messages';

/** Copiado de la referencia; tipado para strictNullChecks (object con id opcional en vez de any). */
@Component({
    selector: 'app-toolbar-common',
    imports: [RouterModule, FormsModule, PrimeModules],
    templateUrl: './toolbar.component.html'
})
export class ToolbarComponent {

  readonly serviceGeneric = input<IServiceCommon | null>(null);
  readonly object = input<{ id?: number } | null>(null);
  readonly showCreate = input<boolean>(true);
  readonly showEdit = input<boolean>(true);
  readonly showDelete = input<boolean>(true);
  readonly tooltipCreate = input<string>('Crear');
  readonly tooltipEdit = input<string>('Editar');
  readonly tooltipDelete = input<string>('Eliminar');
  readonly iconCreate = input<string>('pi-plus');
  readonly iconEdit = input<string>('pi-pencil');
  readonly iconDelete = input<string>('pi-trash');

  private helpersService = inject(HelpersService);

  create(): void {
    this.serviceGeneric()?.eventFormComponent()?.openCreate();
  }

  edit(): void {
    const id = this.object()?.id;
    if (id) {
      this.serviceGeneric()?.eventFormComponent()?.openEdit?.(id);
    } else {
      this.helpersService.messageNotification("warn", "Por favor", MESSAGES.selectARow, 3000);
    }
  }

  deleteRow(): void {
    if (this.object()?.id) {
      this.serviceGeneric()?.eventModalDeleteComponent()?.openConfirm();
    } else {
      this.helpersService.messageNotification("warn", "Por favor", MESSAGES.selectARow, 3000);
    }
  }
}
