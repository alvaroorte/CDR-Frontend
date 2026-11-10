# Detalle, maestro-detalle y variantes

## 1. Visualización de detalles — maestro-detalle (patrón de la referencia)

En `schedule`, seleccionar una fila muestra debajo el CRUD hijo `schedule-detail`, que es **otro
CRUD completo con la misma arquitectura** (su propio servicio `IServiceCommon`, modal-form,
modal-delete y tabla) filtrado por el id del padre.

Página padre (`schedule.component.html`, después del `</p-fieldset>`):
```html
@if (scheduleSelected()?.id) {
  <div class="col-12 fadeindown animation-duration-400 p-0 mt-3">
    <app-schedule-detail [scheduleId]="scheduleSelected().id" />
  </div>
}
```
Y el padre importa `ScheduleDetailComponent` desde `'../schedule-detail/schedule-detail.component'`.

Componente hijo (`modules/{child-kebab}/{child-kebab}.component.ts`):
```ts
export class {Child}Component {
  public {parent}Id = input.required<number>();
  public {child}Service = inject({Child}Service);

  public titleTable = 'Listado de {labelPluralHijo}';
  public {child}Selected = signal<{Child} | null>(null);
  public {children} = signal<{Child}[]>([]);
  public tableColumn{Child}Definitions: TableColumn<{Child}>[] = TableColumnDefinitions.get{Children}ColumnsDefinition();
  public tableProps: PrimeTableProps = new PrimeTableProps({ rows: COMMON.minimumRows });

  constructor() {
    effect(() => {
      if (this.{parent}Id()) {
        this.set{Child}(null);
        this.getBy{Parent}();
      }
    });
  }

  public set{Child}({child}: {Child}): void { this.{child}Selected.set({child}); }

  public getBy{Parent}(): void {
    this.{child}Service.getBy{Parent}(this.{parent}Id()).subscribe({
      next: (res) => { this.{children}.set(res); }
    });
  }

  public onTableSelfEmision(table: GenericTableComponent<{Child}>): void {
    this.{child}Service.eventTableComponent.set(table);
  }
}
```
Diferencias del hijo respecto a la página principal:
- No es ruta: no se añade a `app.routes.ts` ni al menú.
- Contenedor `container mx-0`, título con `<h2 class="text-white">`.
- Carga por `effect()` sobre el input (no `ngOnInit`) y `(requestData)="getBy{Parent}()"`.
- `[tableProps]="tableProps"` con `COMMON.minimumRows`.
- Su modal-form tiene selector propio `app-modal-form-{child-kebab}`, clase
  `ModalForm{Child}Component`, recibe `[{parent}Id]` y lo parchea en `openCreate()`
  (ver form-fields.md §11).
- Servicio con endpoint de filtrado `getBy{Parent}(id)` (lo debe proporcionar el usuario).

## 2. Visualización de detalles de un mismo registro

La referencia **no** tiene una vista de solo lectura: el detalle de un registro se ve en la tabla
(columnas) y en el formulario de edición. Antes de crear una vista de detalle:
1. Pregunta si basta con añadir columnas (`initiallyHidden`, `showTooltip` en `TableColumn`) o con
   el formulario de edición.
2. Si realmente se necesita, revisa los modales `shared/components/modal-info-*` como precedente y
   crea un `components/modal-detail/` local con el mismo esqueleto `p-dialog` del modal-form
   (`[(visible)]`, `appendTo="body"`, `styleClass="w-10 md:w-6 lg:w-4"`, footer con botón
   `labels.close`), cargando con `service.getById(id)` y reutilizando los pipes de `PipesModule`
   (`formatDate`, `formatDateWhitHour`, `formatFieldAmount`, `booleanColumnFormat`) para mostrar valores.
3. Para abrirlo, añade un botón al toolbar por proyección (§3) que valide la selección igual que
   `edit()` (toast `warn` "Por favor" / `MESSAGES.selectARow`).

## 3. Acciones extra en el toolbar (schedule-detail, user)

`app-toolbar-common` proyecta contenido (`<ng-content />`) después de Crear/Editar/Eliminar:
```html
<app-toolbar-common tooltipCreate="Crear horario de trabajo"
  [serviceGeneric]="scheduleDetailService" [object]="scheduleDetailSelected()">
  @if (scheduleId()) {
    <p-button icon="pi pi-chart-line" pTooltip="Ver gráfico de horarios" size="small"
      [rounded]="true" severity="help"
      styleClass="shadow-3 hover-help fadeinup animation-ease-in-out animation-duration-300"
      (click)="openModalGanttSchedule()" />
  }
</app-toolbar-common>
```
Para abrir un modal propio desde la página, la referencia usaba un `EventEmitter` con `@Output()`
**dentro del servicio**. En cdr-frontend (adaptación aprobada) se usa el **mismo registro por
`signal`** que ya usan `eventFormComponent`/`eventModalDeleteComponent`:
```ts
// interfaz mínima del modal (core/interfaces)
export interface IOpenableModal { open(): void; }
// servicio
public eventModalGanttComponent = signal<IOpenableModal | null>(null);
// modal: se registra al iniciar y se des-registra al destruirse
ngOnInit()    { this.scheduleDetailService.eventModalGanttComponent.set(this); }
ngOnDestroy() { this.scheduleDetailService.eventModalGanttComponent.set(null); }
// página
public openModalGanttSchedule(): void { this.scheduleDetailService.eventModalGanttComponent()?.open(); }
```
Si el modal es hijo directo de la página en la plantilla, basta con `viewChild()` o un `input()`/`output()`.
No uses `EventEmitter` en servicios.

Contenido a la derecha del título de la tabla: proyectar en `app-generic-table` con el atributo
`rightToolbarTemplate`.

## 4. Paginación, orden y filtro en servidor (user, permission, tickets-historical)

`GenericTableComponent` trabaja en **cliente** (recibe toda la lista). Úsalo por defecto.
Solo si el usuario indica que el backend pagina (endpoint `.../pageable` que devuelve
`IPageable<T>`), usa `TableOnDemnadComponent` (`shared/components/table-on-demand`) siguiendo
`modules/user` — léelo completo antes de implementarlo:
```html
<app-table-on-demand [columns]="columns" [dataList]="users()" [totalElements]="totalElements()"
  (eventloadItems)="loadUsers($event)" (eventRowSelected)="setUser($event)"
  (selfEmitter)="onTableSelfEmision($event)">
  <ng-container leftToolbarTemplate> ...botones... </ng-container>
</app-table-on-demand>
```
```ts
public totalElements = signal<number>(0);
public loadUsers(params: HttpParams) {
  this.userService.getPageable(params).subscribe({
    next: (res) => { this.users.set(res.content); this.totalElements.set(res.totalElements); }
  });
}
// servicio
public getPageable(params: HttpParams) {
  return this.http.get<IPageable<User>>(`${this.urlUser}/pageable`, { params });
}
```
Los parámetros (`page`, `size`, `sortOrder`, `sortBy`, `some`) los arma
`Pageable.getPageableAsHttpParams()` (`core/models/pageable.ts`). Verifica en `modules/user` los
nombres exactos de propiedades de `IPageable` antes de usarlos.

## 5. Configuración de tabla

```ts
public tableProps: PrimeTableProps = new PrimeTableProps({ rows: COMMON.minimumRows, sortField: 'name' });
```
Propiedades: `rows`, `rowsPerPageOptions`, `dataKey` (`'id'`), `sortField` (`'id'`), `sortOrder`
(desc por defecto), `rowTrackBy`. Por columna (`TableColumn<T>`): `hideSortIcon`,
`notfilterByThisfield` (excluir del filtro global), `columnType`, `align`, `isDecimal`,
`showTooltip`, `booleanColumnFormatConfig`, `initiallyHidden`.
