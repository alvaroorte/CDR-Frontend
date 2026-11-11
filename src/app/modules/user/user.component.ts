import { Component, inject, OnInit, signal } from '@angular/core';
import { UserService } from './services/user.service';
import { UserApp } from '@core/models/user-app';
import { UserModule } from './user.module';
import { ToolbarComponent } from '@shared/components/toolbar/toolbar.component';
import { ModalDeleteComponent } from '@shared/components/modal-delete/modal-delete.component';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { TableColumn } from '@core/interfaces/table.interface';
import { TableColumnDefinitions } from '@core/utils/table-column-definitions';
import { ModalFormComponent } from './components/modal-form/modal-form.component';
import { ModalPasswordComponent } from './components/modal-password/modal-password.component';
import { HelpersService } from '@core/services/helpers.service';
import { MESSAGES } from '@core/constants/messages';
import { Severity } from '@core/enums/severity';

/** Listado en cliente (GenericTable): el número de empleados de una cafetería es pequeño. */
@Component({
    selector: 'app-user',
    imports: [UserModule, ToolbarComponent, ModalDeleteComponent, GenericTableComponent, ModalFormComponent, ModalPasswordComponent],
    templateUrl: './user.component.html'
})
export class UserComponent implements OnInit {

  public userService = inject(UserService);
  private helpersService = inject(HelpersService);

  public titleTable = "Lista de usuarios";
  public userSelected = signal<UserApp | null>(null);
  public users = signal<UserApp[]>([]);
  public tableColumnUserDefinitions: TableColumn<UserApp>[] = TableColumnDefinitions.getUsersColumnsDefinition();

  ngOnInit(): void {
    this.getUsers();
  }

  public setUser(user: UserApp | null): void {
    this.userSelected.set(user);
  }

  public getUsers(): void {
    this.userService.getAll().subscribe({
      next: (res) => {
        this.users.set(res);
      }
    });
  }

  public onTableSelfEmision(table: GenericTableComponent<UserApp>): void {
    this.userService.eventTableComponent.set(table);
  }

  public openResetPassword(): void {
    const user = this.userSelected();
    if (!user) {
      this.helpersService.messageNotification(Severity.warn, "Por favor", MESSAGES.selectARow);
      return;
    }
    this.userService.eventModalPasswordComponent()?.open(user.id);
  }
}
