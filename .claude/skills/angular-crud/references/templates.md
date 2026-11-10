# Plantillas de implementación

Reemplaza los marcadores. Todo lo demás es literal del patrón de referencia.

| Marcador | Significado | Ejemplo (schedule) |
|---|---|---|
| `{Entity}` / `{Entities}` | PascalCase singular / plural | `Schedule` / `Schedules` |
| `{entity}` / `{entities}` | camelCase singular / plural | `schedule` / `schedules` |
| `{entity-kebab}` | kebab-case singular (carpeta, archivos) | `schedule` |
| `{route}` | URL del menú, kebab plural | `schedules` |
| `{endpoint}` | ruta REST del backend (proporcionada por el usuario) | `schedule` |
| `{label}` / `{labelPlural}` | texto en español singular / plural | `horario` / `horarios` |
| `{Title}` | título del fieldset | `Horario` |

Los campos de ejemplo (`name`, `code`) son ilustrativos: usa **solo** los campos reales de la entidad.

---

## 1. Modelo — `src/app/core/models/{entity-kebab}.ts`

Solo si no existe ya un modelo/interfaz para la entidad.

```ts
import { Base } from "./base";

export class {Entity} extends Base {
    id: number;
    name: string;
    // ...campos reales; FKs como `{relation}Id: number`; fechas/horas como string
}
```

## 2. Servicio — `src/app/modules/{entity-kebab}/services/{entity-kebab}.service.ts`

```ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { environment } from '@core/environments/environment.development';
import { Observable } from 'rxjs';
import { {Entity} } from '@core/models/{entity-kebab}';
import { IServiceCommon } from '@core/interfaces/service-common.interface';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { ModalDeleteComponent } from '@shared/components/modal-delete/modal-delete.component';
import { IGenericModalForm } from '@core/interfaces/generic-modal-form.interface';

@Injectable({
  providedIn: 'root'
})
export class {Entity}Service implements IServiceCommon {

  public eventFormComponent = signal<IGenericModalForm>(null);
  public eventTableComponent = signal<GenericTableComponent<{Entity}>>(null);
  public eventModalDeleteComponent = signal<ModalDeleteComponent>(null);

  private http = inject(HttpClient);

  private serverUrl: string = environment.server_url;

  public getAll(): Observable<{Entity}[]> {
    return this.http.get<{Entity}[]>(this.serverUrl + '{endpoint}');
  }

  public getById(id: number): Observable<{Entity}> {
    return this.http.get<{Entity}>(this.serverUrl + '{endpoint}/' + id);
  }

  public create({entity}: {Entity}): Observable<{Entity}> {
    return this.http.post<{Entity}>(this.serverUrl + '{endpoint}', {entity});
  }

  public update(id: number, {entity}: {Entity}): Observable<{Entity}> {
    return this.http.put<{Entity}>(this.serverUrl + '{endpoint}/' + id, {entity});
  }

  public delete(id: number): Observable<string> {
    return this.http.delete(this.serverUrl + '{endpoint}/' + id, { responseType: 'text' });
  }
}
```

Notas:
- Incluye solo los endpoints que el backend expone. `delete` es obligatorio por `IServiceCommon`;
  si no se elimina, igual se implementa solo si el endpoint existe; de lo contrario pregunta.
- Endpoints extra (catálogos, filtro por padre) como métodos tipados aquí mismo:
  `public getBy{Parent}(id: number): Observable<{Entity}[]>`.

## 3. Columnas — añadir en `src/app/core/utils/table-column-definitions.ts`

Importar el modelo arriba y añadir el método estático dentro de `TableColumnDefinitions`:

```ts
static get{Entities}ColumnsDefinition(): TableColumn<{Entity}>[] {
  return [
      { field: 'name', header: LABELS.name },
      // { field: 'active', header: LABELS.status, columnType: TableColumnType.STATUS, align: Align.center },
      // { field: 'amount', header: LABELS.xxx, columnType: TableColumnType.AMOUNT, align: Align.right },
      { field: 'createdBy', header: LABELS.createdBy },
      { field: 'updatedBy', header: LABELS.updatedBy },
      { field: 'createdAt', header: LABELS.creationDate, columnType: TableColumnType.DATETIME, align: Align.right, hideSortIcon: true, notfilterByThisfield: true },
      { field: 'updatedAt', header: LABELS.updateDate, columnType: TableColumnType.DATETIME, align: Align.right, hideSortIcon: true, notfilterByThisfield: true }
    ];
}
```

`TableColumnType` disponibles en `GenericTable`: `TEXT` (default), `NUMBER`, `BOOLEAN`
(+`booleanColumnFormatConfig: { trueLabel, falseLabel }`), `STATUS` (Activo/Inactivo), `DATE`,
`DATETIME`, `AMOUNT`, `COLOR`, `IMAGE` (base64). `field` está tipado como `keyof {Entity}`: un
campo inexistente es error de compilación.

## 4. Módulo de exports — `src/app/modules/{entity-kebab}/{entity-kebab}.module.ts`

```ts
import { NgModule } from '@angular/core';
import { PipesModule } from '@core/pipes/pipes.module';
import { PrimeModules } from '@shared/prime-components/prime-components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
    exports: [
        PipesModule,
        PrimeModules,
        ReactiveFormsModule,
        FormsModule,
    ]
})
export class {Entity}Module { }
```

## 5. Página (Listado) — `{entity-kebab}.component.ts`

```ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { {Entity}Service } from './services/{entity-kebab}.service';
import { {Entity} } from '@core/models/{entity-kebab}';
import { {Entity}Module } from './{entity-kebab}.module';
import { ToolbarComponent } from '@shared/components/toolbar/toolbar.component';
import { ModalDeleteComponent } from '@shared/components/modal-delete/modal-delete.component';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';
import { TableColumn } from '@core/interfaces/table.interface';
import { TableColumnDefinitions } from '@core/utils/table-column-definitions';
import { ModalFormComponent } from './components/modal-form/modal-form.component';

@Component({
    selector: 'app-{entity-kebab}',
    imports: [{Entity}Module, ToolbarComponent, ModalDeleteComponent, GenericTableComponent, ModalFormComponent],
    templateUrl: './{entity-kebab}.component.html'
})
export class {Entity}Component implements OnInit {

  public {entity}Service = inject({Entity}Service);

  public titleTable = "Lista de {labelPlural}";
  public {entity}Selected = signal<{Entity} | null>(null);
  public {entities} = signal<{Entity}[]>([]);
  public tableColumn{Entity}Definitions: TableColumn<{Entity}>[] = TableColumnDefinitions.get{Entities}ColumnsDefinition();

  ngOnInit(): void {
    this.get{Entities}();
  }

  public set{Entity}({entity}: {Entity}): void {
    this.{entity}Selected.set({entity});
  }

  public get{Entities}(): void {
    this.{entity}Service.getAll().subscribe({
      next: (res) => {
        this.{entities}.set(res);
      }
    });
  }

  public onTableSelfEmision(table: GenericTableComponent<{Entity}>): void {
    this.{entity}Service.eventTableComponent.set(table);
  }
}
```

`{entity}Service` es `public` porque la plantilla lo pasa a `[serviceGeneric]`.

## 6. Página — `{entity-kebab}.component.html`

```html
<div class="container mx-3 mb-0 pb-4">
  <p-fieldset styleClass="sombra-black">
    <ng-template pTemplate="header">
      <div class="flex align-items-center text-primary fadeinleft animation-duration-400">
        <h1 class="text-white text-2xl">{Title} <span class="text-sm"> Gestión de {labelPlural}</span> </h1>
      </div>
    </ng-template>
    <div class="grid">
      <div class="col-12 fadeindown animation-duration-400">
        <div class="sombra-black border-round-xl p-2 surface-0">
          <app-toolbar-common
            tooltipCreate="Crear {label}"
            [serviceGeneric]="{entity}Service"
            [object]="{entity}Selected()"/>
          <app-modal-form />
          <app-modal-delete [serviceGeneric]="{entity}Service"
            [objectId]="{entity}Selected()?.id" />
          <app-generic-table [titleTable]="titleTable"
            [items]="{entities}()"
            [tableColumnDefinitions]="tableColumn{Entity}Definitions"
            (onSelection)="set{Entity}($event)"
            (requestData)="get{Entities}()"
            (selfEmitter)="onTableSelfEmision($event)"
           />
        </div>
      </div>
    </div>
  </p-fieldset>
</div>
```

Operaciones no requeridas: `[showCreate]="false"`, `[showEdit]="false"`, `[showDelete]="false"` en
el toolbar (y entonces se omite `app-modal-form` y/o `app-modal-delete`).

## 7. Modal-form (Crear / Editar) — `components/modal-form/modal-form.component.ts`

```ts
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { HelpersService } from '@core/services/helpers.service';
import { noSpaceValidator } from '@core/validators/noSpaceValidator';
import { {Entity}Service } from '../../services/{entity-kebab}.service';
import { {Entity} } from '@core/models/{entity-kebab}';
import { MESSAGES } from '@core/constants/messages';
import { LIMITS } from '@core/constants/limits';
import { regex } from '@core/constants/regexs';
import { LABELS } from '@core/constants/labels';
import { TypeSubmitEnum } from '@core/enums/type-submit';
import { MessageRequiredFieldComponent } from '@shared/components/message-required-field/message-required-field.component';
import { {Entity}Module } from '../../{entity-kebab}.module';

@Component({
    selector: 'app-modal-form',
    templateUrl: './modal-form.component.html',
    imports: [MessageRequiredFieldComponent, {Entity}Module]
})
export class ModalFormComponent implements OnInit {

  private formBuilder = inject(FormBuilder);
  private helpersService = inject(HelpersService);
  private {entity}Service = inject({Entity}Service);

  public readonly labels = LABELS;
  public readonly messages = MESSAGES;
  private {entity}Id: number = 0;
  public openModal: boolean = false;
  public titleForm: string = "";
  private tableComponent = this.{entity}Service.eventTableComponent;

  // Formulario TIPADO (adaptación cdr-frontend): el tipo se infiere de nonNullable.group
  public form{Entity} = this.formBuilder.nonNullable.group({
    id: this.formBuilder.control<number | null>(null),
    name: ['', [Validators.required, Validators.minLength(LIMITS.minLengthFive), Validators.pattern(regex.fieldName), noSpaceValidator]],
    // ...un control por campo real
  });

  ngOnInit(): void {
    this.{entity}Service.eventFormComponent.set(this);
    // cargar aquí los catálogos de selects, si los hay
  }

  public hideModal(): void {
    this.openModal = false;
  }

  public openCreate(): void {
    this.reset();
    this.titleForm = this.labels.newRegistration("{label}");
    this.openModal = true;
  }

  public openEdit(id: number): void {
    this.reset();
    this.titleForm = this.labels.editRegistration("{label}");
    this.{entity}Service.getById(id).subscribe({
      next: (res) => {
        this.{entity}Id = res.id;
        this.form{Entity}.patchValue(res);
        this.openModal = true;
      }
    });
  }

  public save(): void {
    if (this.form{Entity}.valid) {
      this.{entity}Id > 0
        ? this.submit(TypeSubmitEnum.UPDATE)
        : this.submit(TypeSubmitEnum.CREATE);
    }
  }

  private reset(): void {
    this.form{Entity}.reset();
    this.{entity}Id = 0;
  }

  private submit(typeSubmitEnum: TypeSubmitEnum): void {
    const data: {Entity} = {
      ...this.form{Entity}.getRawValue(),
      // transformaciones de campos (fechas, horas, trims) aquí
    };
    const service = typeSubmitEnum === TypeSubmitEnum.CREATE
      ? this.{entity}Service.create(data)
      : this.{entity}Service.update(this.{entity}Id, data);
    service.subscribe({
      next: () => {
        const message = typeSubmitEnum === TypeSubmitEnum.CREATE
          ? MESSAGES.recordCreated
          : MESSAGES.recordUpdated;
        this.helpersService.messageNotification("success", "Correcto", message, 3000);
        this.hideModal();
        this.reset();
      },
      complete: () => {
        this.tableComponent().reload();
      }
    });
  }
}
```

Diferencias deliberadas respecto al archivo de referencia (todas presentes en hermanos del proyecto):
`titleForm` en vez de `tittleForm`; títulos con `LABELS.newRegistration/editRegistration`
(schedule-detail); `implements OnInit` y tipos de retorno explícitos (tipado estricto);
`MessageRequiredFieldComponent` por alias `@shared` en vez de ruta relativa.

## 8. Modal-form — `components/modal-form/modal-form.component.html`

```html
<form [formGroup]="form{Entity}">

  <div class="grid">
    <div class="col-12">
      <p-dialog [focusOnShow]="false" [(visible)]="openModal" styleClass="w-10 md:w-6 lg:w-4" [header]="titleForm" [modal]="true" class="p-fluid" appendTo="body">
        <ng-template pTemplate="content">

          <app-message-required-field />

          <!-- Un bloque por campo: ver form-fields.md -->
          <div class="form-group field mt-5">
            <p-floatlabel>
              <input type="text" pInputText id="name" formControlName="name" class="w-full" />
              <label htmlFor="name" class="text-lg font-bold text-800 required-field"> {{ labels.name }} </label>
            </p-floatlabel>
            @if (form{Entity}.controls['name'].touched && form{Entity}.get('name')?.hasError('required')) {
              <small class="p-error block mt-2" > {{ messages.requiredField }} </small>
            }
            @if (form{Entity}.get('name')?.hasError('pattern')) {
              <small class="p-error block mt-2">{{ messages.deniedCharactersName }}</small>
            }
            @if (form{Entity}.get('name')?.hasError('minlength')) {
              <small class="p-error block mt-2">{{ messages.requiredMinLength }}</small>
            }
            @if (form{Entity}.get('name')?.hasError('noSpace')) {
              <small class="p-error block mt-2">{{ messages.noOnlySpace }}</small>
            }
          </div>

        </ng-template>
        <ng-template pTemplate="footer">
          <div class="p-2 pb-3">
            <input type="hidden" pInputText id="id" formControlName="id"/>
            <button
              type="button"
              pButton pRipple
              [label]="labels.cancel"
              icon="pi pi-times"
              severity="secondary"
              [rounded]="true"
              size="small"
              class="mr-2 shadow-3"
              (click)="hideModal()"
            ></button>
            <button
              type="button"
              pButton pRipple
              [label]="labels.save"
              icon="pi pi-check"
              [rounded]="true"
              size="small"
              class="mr-2 shadow-3 hover-primary"
              (click)="save()"
              [disabled]="form{Entity}.invalid"
            ></button>
          </div>
        </ng-template>
      </p-dialog>
    </div>
  </div>
</form>
```

Formularios con varios campos en fila: envolver en `<div class="p-fluid p-formgrid grid">` y usar
`col-12` / `col-6` en cada `form-group field` (ver schedule-detail); ancho del diálogo
`lg:w-5` o mayor.

## 9. Eliminación

No requiere código propio: la página incluye `<app-modal-delete>` (§6) y el servicio implementa
`delete()`. Si tras eliminar hay que hacer algo más (p. ej. limpiar la selección para ocultar un
detalle), usar el output:

```html
<app-modal-delete [serviceGeneric]="{entity}Service" [objectId]="{entity}Selected()?.id"
  (onDeleteSuccess)="set{Entity}(null)" />
```

(`reload()` de la tabla ya deselecciona y emite `onSelection(null)`, así que normalmente no hace falta.)

## 10. Ruta — `src/app/app.routes.ts`

```ts
{
  path: '{route}',
  loadComponent: () => import('./modules/{entity-kebab}/{entity-kebab}.component').then(c => c.{Entity}Component),
  canActivate: [authGuard]
},
```

## 11. Menú y permisos — `src/app/core/constants/header-links.ts`

`authGuard` deniega rutas que no estén en `urlsWithPermissions`, así que esta entrada es obligatoria:

```ts
{ routerLink: '{route}', label: '{Title plural}', access: [ROLES_CODE_SYSTEM.ADMIN], icon: 'pi pi-xxx', show: false},
```
Y, si es una pantalla de configuración, añadir `'{route}'` a `configurationLinks`. Roles e icono
los define el usuario; si no los dio, pregunta (no asumas `ADMIN`).

## 12. Specs

### `{entity-kebab}.component.spec.ts`

```ts
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { {Entity}Component } from './{entity-kebab}.component';
import { {Entity}Service } from './services/{entity-kebab}.service';
import { {Entity} } from '@core/models/{entity-kebab}';
import { GenericTableComponent } from '@shared/components/generic-table/generic-table.component';

describe('{Entity}Component', () => {

  const baseFields = { active: true, createdBy: '', updatedBy: '', createdAt: '', updatedAt: '' };
  const {entities}Mock: {Entity}[] = [
    { id: 1, name: 'Registro 1', ...baseFields }
  ];

  let component: {Entity}Component;
  let {entity}ServiceStub: { getAll: Mock; eventTableComponent: { set: Mock } };

  beforeEach(() => {
    {entity}ServiceStub = {
      getAll: vi.fn().mockReturnValue(of({entities}Mock)),
      eventTableComponent: { set: vi.fn() }
    };
    TestBed.configureTestingModule({
      providers: [{ provide: {Entity}Service, useValue: {entity}ServiceStub }]
    });
    component = TestBed.runInInjectionContext(() => new {Entity}Component());
  });

  it('ngOnInit carga los registros', () => {
    component.ngOnInit();
    expect({entity}ServiceStub.getAll).toHaveBeenCalled();
    expect(component.{entities}()).toEqual({entities}Mock);
  });

  it('get{Entities} con respuesta vacía deja el signal en []', () => {
    {entity}ServiceStub.getAll.mockReturnValue(of([]));
    component.get{Entities}();
    expect(component.{entities}()).toEqual([]);
  });

  it('set{Entity} actualiza la selección', () => {
    component.set{Entity}({entities}Mock[0]);
    expect(component.{entity}Selected()).toEqual({entities}Mock[0]);
  });

  it('onTableSelfEmision registra la tabla en el servicio', () => {
    const table = {} as GenericTableComponent<{Entity}>;
    component.onTableSelfEmision(table);
    expect({entity}ServiceStub.eventTableComponent.set).toHaveBeenCalledWith(table);
  });
});
```

### `components/modal-form/modal-form.component.spec.ts`

Seguir 1:1 `ticket-frontend/src/app/modules/schedule/components/modal-form/modal-form.component.spec.ts`,
traducido a Vitest (`vi.fn()`, `.mockReturnValue(...)`): stubs de
`{Entity}Service` (`eventFormComponent.set`, `eventTableComponent` como spy que devuelve
`{ reload: spy }`, `getById`, `create`, `update`) y `HelpersService.messageNotification`; un helper
`patchValidForm()` con valores válidos de **todos** los campos obligatorios; y los casos:
registro en `ngOnInit`, `openCreate`, `openEdit` exitoso, inválido no envía, create tras openCreate,
update con id tras openEdit, toast+cierre+reset+reload al crear, toast al actualizar.
Si el form carga catálogos en `ngOnInit`, stubear también esos servicios.
