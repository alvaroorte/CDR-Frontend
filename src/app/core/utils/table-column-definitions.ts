import { LABELS } from "@core/constants/labels";
import { TableColumn } from "@core/interfaces/table.interface";
import { TableColumnType } from "@core/enums/table-column-type.enum";
import { Align } from "@core/enums/align";
import { Category } from "@core/models/category";
import { Product } from "@core/models/product";
import { Addon } from "@core/models/addon";
import { TableMarker } from "@core/models/table-marker";
import { PaymentMethod } from "@core/models/payment-method";
import { Parameter } from "@core/models/parameter";
import { Role } from "@core/models/role";
import { UserApp } from "@core/models/user-app";

/** Definiciones de columnas centralizadas (patrón de la referencia). */
export class TableColumnDefinitions {

  private static auditColumns<T extends { createdBy: string; updatedBy: string; createdAt: string; updatedAt: string }>(): TableColumn<T>[] {
    return [
      { field: 'createdBy', header: LABELS.createdBy, initiallyHidden: true },
      { field: 'updatedBy', header: LABELS.updatedBy },
      { field: 'createdAt', header: LABELS.creationDate, columnType: TableColumnType.DATETIME, align: Align.right, hideSortIcon: true, notfilterByThisfield: true, initiallyHidden: true },
      { field: 'updatedAt', header: LABELS.updateDate, columnType: TableColumnType.DATETIME, align: Align.right, hideSortIcon: true, notfilterByThisfield: true }
    ] as TableColumn<T>[];
  }

  static getCategoriesColumnsDefinition(): TableColumn<Category>[] {
    return [
      { field: 'ranking', header: LABELS.ranking, columnType: TableColumnType.NUMBER, align: Align.right },
      { field: 'name', header: LABELS.name },
      { field: 'description', header: LABELS.description, showTooltip: true },
      { field: 'active', header: LABELS.status, columnType: TableColumnType.STATUS, align: Align.center },
      ...TableColumnDefinitions.auditColumns<Category>()
    ];
  }

  static getProductsColumnsDefinition(): TableColumn<Product>[] {
    return [
      { field: 'name', header: LABELS.name },
      { field: 'categoryName', header: LABELS.category },
      { field: 'price', header: LABELS.price, columnType: TableColumnType.AMOUNT, align: Align.right },
      { field: 'available', header: LABELS.available, columnType: TableColumnType.BOOLEAN, align: Align.center,
        booleanColumnFormatConfig: { trueLabel: 'Disponible', falseLabel: 'Agotado' } },
      { field: 'active', header: LABELS.status, columnType: TableColumnType.STATUS, align: Align.center },
      ...TableColumnDefinitions.auditColumns<Product>()
    ];
  }

  static getAddonsColumnsDefinition(): TableColumn<Addon>[] {
    return [
      { field: 'name', header: LABELS.name },
      { field: 'price', header: LABELS.price, columnType: TableColumnType.AMOUNT, align: Align.right },
      { field: 'active', header: LABELS.status, columnType: TableColumnType.STATUS, align: Align.center },
      ...TableColumnDefinitions.auditColumns<Addon>()
    ];
  }

  static getTableMarkersColumnsDefinition(): TableColumn<TableMarker>[] {
    return [
      { field: 'number', header: LABELS.number, columnType: TableColumnType.NUMBER, align: Align.right },
      { field: 'description', header: LABELS.description },
      { field: 'active', header: LABELS.status, columnType: TableColumnType.STATUS, align: Align.center },
      ...TableColumnDefinitions.auditColumns<TableMarker>()
    ];
  }

  static getPaymentMethodsColumnsDefinition(): TableColumn<PaymentMethod>[] {
    return [
      { field: 'code', header: LABELS.code },
      { field: 'name', header: LABELS.name },
      { field: 'requiresReference', header: LABELS.requiresReference, columnType: TableColumnType.BOOLEAN, align: Align.center },
      { field: 'givesChange', header: LABELS.givesChange, columnType: TableColumnType.BOOLEAN, align: Align.center },
      { field: 'active', header: LABELS.status, columnType: TableColumnType.STATUS, align: Align.center },
      ...TableColumnDefinitions.auditColumns<PaymentMethod>()
    ];
  }

  static getParametersColumnsDefinition(): TableColumn<Parameter>[] {
    return [
      { field: 'folder', header: LABELS.folder },
      { field: 'name', header: LABELS.name },
      { field: 'value', header: LABELS.value, align: Align.right },
      { field: 'description', header: LABELS.description, showTooltip: true },
      ...TableColumnDefinitions.auditColumns<Parameter>()
    ];
  }

  static getRolesColumnsDefinition(): TableColumn<Role>[] {
    return [
      { field: 'code', header: LABELS.code },
      { field: 'name', header: LABELS.name },
      { field: 'description', header: LABELS.description },
      { field: 'system', header: LABELS.systemRole, columnType: TableColumnType.BOOLEAN, align: Align.center },
      { field: 'active', header: LABELS.status, columnType: TableColumnType.STATUS, align: Align.center },
      ...TableColumnDefinitions.auditColumns<Role>()
    ];
  }

  static getUsersColumnsDefinition(): TableColumn<UserApp>[] {
    return [
      { field: 'username', header: LABELS.username },
      { field: 'fullName', header: LABELS.fullName },
      { field: 'email', header: LABELS.email },
      { field: 'rolesLabel', header: LABELS.roles },
      { field: 'active', header: LABELS.status, columnType: TableColumnType.STATUS, align: Align.center },
      ...TableColumnDefinitions.auditColumns<UserApp>()
    ];
  }
}
