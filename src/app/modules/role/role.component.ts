import { Component, inject, OnInit, signal } from '@angular/core';
import { RoleService } from './services/role.service';
import { Role } from '@core/models/role';
import { RoleModule } from './role.module';
import { ToolbarComponent } from '@shared/components/toolbar/toolbar.component';
import { ModalDeleteComponent } from '@shared/components/modal-delete/modal-delete.component';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { TableColumn } from '@core/interfaces/table.interface';
import { TableColumnDefinitions } from '@core/utils/table-column-definitions';
import { ModalFormComponent } from './components/modal-form/modal-form.component';
import { ModalPermissionsComponent } from './components/modal-permissions/modal-permissions.component';
import { HelpersService } from '@core/services/helpers.service';
import { MESSAGES } from '@core/constants/messages';
import { Severity } from '@core/enums/severity';

@Component({
    selector: 'app-role',
    imports: [RoleModule, ToolbarComponent, ModalDeleteComponent, GenericTableComponent, ModalFormComponent, ModalPermissionsComponent],
    templateUrl: './role.component.html'
})
export class RoleComponent implements OnInit {

  public roleService = inject(RoleService);
  private helpersService = inject(HelpersService);

  public titleTable = "Lista de roles";
  public roleSelected = signal<Role | null>(null);
  public roles = signal<Role[]>([]);
  public tableColumnRoleDefinitions: TableColumn<Role>[] = TableColumnDefinitions.getRolesColumnsDefinition();

  ngOnInit(): void {
    this.getRoles();
  }

  public setRole(role: Role | null): void {
    this.roleSelected.set(role);
  }

  public getRoles(): void {
    this.roleService.getAll().subscribe({
      next: (res) => {
        this.roles.set(res);
      }
    });
  }

  public onTableSelfEmision(table: GenericTableComponent<Role>): void {
    this.roleService.eventTableComponent.set(table);
  }

  public openPermissions(): void {
    const role = this.roleSelected();
    if (!role) {
      this.helpersService.messageNotification(Severity.warn, "Por favor", MESSAGES.selectARow);
      return;
    }
    this.roleService.eventModalPermissionsComponent()?.open(role.id);
  }
}
