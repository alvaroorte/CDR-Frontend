import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Table } from 'primeng/table';
import { RoleService } from '../../services/role.service';
import { Permission, Role } from '@core/models/role';
import { HelpersService } from '@core/services/helpers.service';
import { IOpenableModal } from '@core/interfaces/openable-modal.interface';
import { MESSAGES } from '@core/constants/messages';
import { LABELS } from '@core/constants/labels';
import { PLACEHOLDERS } from '@core/constants/placeholder';
import { Severity } from '@core/enums/severity';
import { RoleModule } from '../../role.module';

/**
 * Asignación de permisos a un rol: tabla con selección múltiple sobre los permisos generados por
 * PermissionSeeder (uno por endpoint). Guardar reemplaza el conjunto completo.
 */
@Component({
    selector: 'app-modal-permissions',
    templateUrl: './modal-permissions.component.html',
    imports: [RoleModule]
})
export class ModalPermissionsComponent implements IOpenableModal, OnInit, OnDestroy {

  private roleService = inject(RoleService);
  private helpersService = inject(HelpersService);

  public readonly labels = LABELS;
  public readonly placeholders = PLACEHOLDERS;
  public openModal: boolean = false;
  public role = signal<Role | null>(null);
  public permissions = signal<Permission[]>([]);
  public selectedPermissions: Permission[] = [];

  ngOnInit(): void {
    this.roleService.eventModalPermissionsComponent.set(this);
  }

  ngOnDestroy(): void {
    this.roleService.eventModalPermissionsComponent.set(null);
  }

  public open(roleId: number): void {
    forkJoin({
      role: this.roleService.getById(roleId),
      permissions: this.roleService.getAllPermissions(),
      assigned: this.roleService.getPermissionIds(roleId),
    }).subscribe({
      next: ({ role, permissions, assigned }) => {
        this.role.set(role);
        this.permissions.set(permissions);
        const assignedIds = new Set(assigned);
        this.selectedPermissions = permissions.filter(p => assignedIds.has(p.id));
        this.openModal = true;
      }
    });
  }

  public filterGlobal(table: Table, event: Event): void {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  public hideModal(): void {
    this.openModal = false;
  }

  public save(): void {
    const role = this.role();
    if (!role) {
      return;
    }
    this.roleService.replacePermissions(role.id, this.selectedPermissions.map(p => p.id)).subscribe({
      next: () => {
        this.helpersService.messageNotification(Severity.success, "Correcto", MESSAGES.permissionsUpdated);
        this.hideModal();
      }
    });
  }
}
