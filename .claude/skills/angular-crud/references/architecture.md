# Análisis del módulo de referencia `src/app/modules/schedule`

Fuente de verdad para todo CRUD nuevo. Las citas de código son literales del proyecto.

## 1. Estructura de archivos

```
modules/schedule/
├── schedule.component.ts / .html / .spec.ts      # página: lista + composición de piezas
├── schedule.module.ts                            # NgModule de solo exports
├── services/schedule.service.ts                  # HTTP + registro de componentes (IServiceCommon)
└── components/modal-form/
    └── modal-form.component.ts / .html / .spec.ts # alta/edición en p-dialog
```

Fuera del módulo:

| Pieza | Ubicación |
|---|---|
| Modelo `Schedule` | `core/models/schedule.ts` (`class Schedule extends Base`) |
| Columnas de tabla | `core/utils/table-column-definitions.ts` → `getSchedulesColumnsDefinition()` |
| Ruta | `app.routes.ts` → `path: 'schedules'`, `loadComponent`, `canActivate: [authGuard]` |
| Menú / permisos | `core/constants/header-links.ts` → `urlsWithPermissions` + `configurationLinks` |
| Detalle hijo | `modules/schedule-detail/` (mismo patrón, recibe `scheduleId` por input) |

## 2. Responsabilidades

| Componente | Responsabilidad | No hace |
|---|---|---|
| `ScheduleComponent` (página) | Carga la lista (`getAll`), guarda la fila seleccionada, compone toolbar/form/delete/table, registra la tabla en el servicio, muestra el detalle hijo cuando hay selección. | No abre modales directamente, no borra, no valida. |
| `ScheduleService` | Endpoints REST tipados; mantiene las 3 señales de registro que conectan piezas desacopladas. | No guarda la lista ni la selección (eso es de la página). |
| `ModalFormComponent` | Form reactivo, abrir en modo crear/editar, enviar, notificar éxito, pedir recarga de tabla. | No conoce al toolbar ni a la página. |
| `ToolbarComponent` (shared) | Botones Crear/Editar/Eliminar; valida que haya fila seleccionada (toast `warn` "Seleccione una Fila"). | No hace HTTP. |
| `ModalDeleteComponent` (shared) | Confirmación, `serviceGeneric.delete(id)`, recarga tabla, toast `recordDeleted`, emite `onDeleteSuccess`. Se registra y se des-registra (`ngOnDestroy`). | — |
| `GenericTableComponent<T>` (shared) | `p-table` con selección simple, paginación, orden, filtro global, formateo por `TableColumnType`, mensaje vacío, botón recargar; se auto-emite (`selfEmitter`) y expone `reload()`. | No pide datos: emite `requestData` y el padre carga. |
| `MessageRequiredFieldComponent` (shared) | Leyenda "Los campos con * son obligatorios". | — |

## 3. Flujo de comunicación (patrón "registro de componentes en el servicio")

`core/interfaces/service-common.interface.ts`:
```ts
export interface IServiceCommon {
    eventFormComponent: WritableSignal<IGenericModalForm>;   // { openCreate(); openEdit?(id) }
    eventTableComponent: WritableSignal<IGenericTable>;      // { reload() }
    eventModalDeleteComponent: WritableSignal<ModalDeleteComponent>;
    delete(id: number): Observable<string>;
}
```

Secuencias:

- **Init**: `ModalForm.ngOnInit → service.eventFormComponent.set(this)`;
  `ModalDelete.ngOnInit → service.eventModalDeleteComponent.set(this)`;
  `GenericTable.ngOnInit → selfEmitter.emit(this) → página.onTableSelfEmision → service.eventTableComponent.set(table)`;
  `página.ngOnInit → getAll()`.
- **Crear**: Toolbar `create()` → `service.eventFormComponent().openCreate()` → usuario guarda →
  `service.create()` → toast → `hideModal(); reset()` → `complete: tableComponent().reload()` →
  tabla deselecciona + `requestData` → página `getAll()`.
- **Editar**: Toolbar `edit()` (requiere `object?.id`) → `openEdit(id)` → `service.getById(id)` →
  `patchValue` → abre → guarda → `service.update(id, data)` → igual que crear.
- **Eliminar**: Toolbar `deleteRow()` → `eventModalDeleteComponent().openConfirm()` → "Si" →
  `service.delete(objectId())` → `reload()` + `onDeleteSuccess` + toast.
- **Seleccionar**: tabla `(onSelection)` → página `{entity}Selected.set(row)` → toolbar `[object]`,
  modal-delete `[objectId]`, detalle hijo `[scheduleId]`.

Por qué así: el toolbar y el modal-delete son **genéricos** y sirven a cualquier entidad solo con
recibir el servicio (`[serviceGeneric]`). Por eso **todo servicio de CRUD debe implementar
`IServiceCommon`** y **todo modal-form debe exponer `openCreate()` y `openEdit(id)`**.

## 4. Convenciones de nombres

| Elemento | Convención | Ejemplo |
|---|---|---|
| Carpeta módulo | kebab-case singular | `schedule`, `cost-center`, `territorial-division` |
| Ruta URL | kebab-case plural | `schedules`, `holidays`, `incident-titles` |
| Página | `{Entity}Component`, selector `app-{entity-kebab}` | `ScheduleComponent`, `app-schedule` |
| Módulo de exports | `{Entity}Module` en `{entity-kebab}.module.ts` | `ScheduleModule` |
| Servicio | `{Entity}Service` en `services/{entity-kebab}.service.ts` | `ScheduleService` |
| Modal form | `ModalFormComponent`, selector `app-modal-form`, en `components/modal-form/` | — |
| Señal selección | `{entity}Selected` | `scheduleSelected` |
| Señal lista | `{entities}` | `schedules` |
| Columnas | `tableColumn{Entity}Definitions` ← `TableColumnDefinitions.get{Entities}ColumnsDefinition()` | `tableColumnScheduleDefinitions` |
| Título tabla | `titleTable = "Lista de {plural}"` | `"Lista de horarios"` |
| Métodos página | `get{Entities}()`, `set{Entity}(row)`, `onTableSelfEmision(table)` | `getSchedules`, `setSchedule` |
| Form | `form{Entity}`; id interno `{entity}Id`; `openModal`; `titleForm` | `formSchedule`, `scheduleId` |
| Métodos form | `openCreate`, `openEdit(id)`, `hideModal`, `save` (o `save{Entity}`), `reset` (privado), `submit(TypeSubmitEnum)` (privado) | — |
| Endpoint | singular kebab, concatenado a `environment.server_url` | `'schedule'`, `'work-schedule-detail'` |

Si la entidad necesita un selector distinto para el modal (p. ej. hay dos modales en la misma
página o es un detalle), sigue `schedule-detail`: `app-modal-form-{entity-kebab}` y clase
`ModalForm{Entity}Component`. La referencia usa `tittleForm` (errata); los hermanos
(`schedule-detail`, `holiday`) usan `titleForm` — usa `titleForm` en código nuevo.

## 5. Componentes standalone y el `{Entity}Module`

- Los `@Component` no declaran `standalone` (default en Angular 21) y listan sus dependencias en
  `imports`.
- `schedule.module.ts` es un **barril de dependencias de plantilla**, sin `declarations` ni
  `imports`:
  ```ts
  @NgModule({ exports: [PipesModule, PrimeModules, ReactiveFormsModule, FormsModule] })
  export class ScheduleModule { }
  ```
  Página y modal-form lo importan. Los componentes shared se importan individualmente.
- `PrimeModules` (`@shared/prime-components/prime-components.module`) re-exporta todo PrimeNG usado;
  no importar módulos de PrimeNG sueltos.

## 6. Modelos e interfaces

- `core/models/base.ts`: `class Base { active = true; createdBy=''; updatedBy=''; createdAt=''; updatedAt=''; }`
  (también existe `core/interfaces/base.interface.ts` y `schedule-detail.interface.ts` extiende la clase).
- Referencia: `export class Schedule extends Base { id: number; name: string; }` en `core/models`.
- Las entidades hijas/derivadas a veces son `interface ... extends Base` en `core/interfaces`
  (`ScheduleDetail`). Ambas formas existen; para entidades nuevas de CRUD usa la de la referencia
  (clase en `core/models/{entity-kebab}.ts`), salvo que ya exista una interfaz para la entidad.
- Fechas/horas viajan como `string`. FKs como `{relation}Id: number`.

## 7. Servicio HTTP

```ts
@Injectable({ providedIn: 'root' })
export class ScheduleService implements IServiceCommon {
  public eventFormComponent = signal<IGenericModalForm>(null);
  public eventTableComponent = signal<GenericTableComponent<Schedule>>(null);
  public eventModalDeleteComponent = signal<ModalDeleteComponent>(null);
  private http = inject(HttpClient);
  private serverUrl: string = environment.server_url;   // import '@core/environments/environment.development'
  public getAll()                        { return this.http.get<Schedule[]>(this.serverUrl + 'schedule') }
  public getById(id: number)             { return this.http.get<Schedule>(this.serverUrl + 'schedule/' + id) }
  public create(schedule: Schedule)      { return this.http.post<Schedule>(this.serverUrl + 'schedule', schedule) }
  public update(id: number, s: Schedule) { return this.http.put<Schedule>(this.serverUrl + 'schedule/' + id, s) }
  public delete(id: number): Observable<string> {
    return this.http.delete(this.serverUrl + 'schedule/' + id, { responseType: 'text' })
  }
}
```
Endpoints adicionales (catálogos, filtros por padre) se añaden como métodos tipados del mismo
servicio: `getBySchedule(id): Observable<ScheduleDetail[]>`, `getDaysOfWeek()` → `string[]`.
El `environment` se importa siempre desde `environment.development` (angular.json lo reemplaza).

## 8. Formularios y validaciones

- **cdr-frontend (adaptación aprobada):** Reactive Forms **tipados** con
  `this.formBuilder.nonNullable.group({...})` (no Signal Forms). Control `id` siempre presente como
  `this.formBuilder.control<number | null>(null)` (oculto en el footer:
  `<input type="hidden" pInputText id="id" formControlName="id"/>`). La referencia usaba
  `FormBuilder.group` sin tipar; la plantilla HTML no cambia.
- Validadores usados: `Validators.required`, `minLength(LIMITS.minLengthFive | minLengthThree)`,
  `maxLength(LIMITS.maxLength | maxLengthDescription)`, `min`, `max`, `pattern(regex.fieldName | regex.fieldCode)`,
  `noSpaceValidator` (`@core/validators/noSpaceValidator`, error `noSpace`).
- Mensajes: `MESSAGES.requiredField`, `deniedCharactersName`, `deniedCharactersCode`,
  `requiredMinLength`, `requiredMinLengthCode`, `requiredMaxLengthDescription`, `noOnlySpace`,
  `maxNumberField(n)`, `minNumberField(n)`.
- `required` se muestra solo si `touched`; el resto de errores en cuanto existen.
- Guardar deshabilitado con `[disabled]="form.invalid"` y además `save()` comprueba `valid`.
- Transformaciones antes de enviar se hacen en `submit()` sobre `{...this.form.getRawValue(), campo: transform(...)}`
  (ej. horas con `DatePipe` + `FORMAT_TIME` en schedule-detail; `DatePipe` está provisto en `app.config.ts`).

## 9. Estado, carga y errores

- Estado de la página en `signal`s; estado del modal (`openModal`, `titleForm`, catálogos) en
  propiedades simples (la referencia y sus hermanos lo hacen así; `ModalDeleteComponent` usa
  `signal<boolean>`). Ambos patrones existen; para modal-form sigue la referencia.
- `effect()` solo para reaccionar a inputs (detalle hijo recarga cuando cambia `scheduleId()`).
- **Loader global** (`LoaderInterceptor` → `LoaderService`) en toda petición HTTP: no se añaden
  spinners ni flags `loading`.
- **Errores HTTP globales**: `HeaderInterceptor` → `HttpErrorHandlerService.handleAndThrow()`
  formatea y muestra toast (y hace logout en 401/403). Los `subscribe` de la referencia **no** tienen
  `error`. Se añade `error:` solo para restaurar estado local (ej. `supervisor-categories` recarga
  su lista en error). Nunca mostrar un segundo toast del mismo error.
- **Éxito**: `helpersService.messageNotification("success", "Correcto", MESSAGES.recordX, 3000)`
  (modal-delete usa `Severity.success`; ambos son válidos, el enum `Severity` existe en `@core/enums/severity`).
- **Lista vacía**: `GenericTable` muestra `MESSAGES.emptyMessage`.

## 10. Plantilla de página (layout y clases)

`p-fieldset styleClass="sombra-black"` con header `<h1 class="text-white text-2xl">Título <span class="text-sm"> Subtítulo</span></h1>`
dentro de `div.flex.align-items-center.text-primary.fadeinleft.animation-duration-400`; contenido en
`div.grid > div.col-12.fadeindown.animation-duration-400 > div.sombra-black.border-round-xl.p-2.surface-0`.
Clases utilitarias: PrimeFlex (`grid`, `col-12`, `flex`, `mt-*`, `w-full`), sin SCSS por componente.
Control flow nuevo (`@if`, `@for`, `@switch`); no `*ngIf`.

## 11. Testing (estilo de los specs de referencia)

- Sin `fixture` para lógica: `component = TestBed.runInInjectionContext(() => new XComponent())`.
- Servicios sustituidos por stubs literales con `vi.fn().mockReturnValue(of(...))` (**Vitest** en
  cdr-frontend; la referencia usaba `jasmine.createSpy(...).and.returnValue(...)`).
- Mocks con `baseFields = { active: true, createdBy: '', updatedBy: '', createdAt: '', updatedAt: '' }`.
- Descripciones de `it` en español, describiendo comportamiento.
- Casos cubiertos: carga inicial, lista vacía, selección, registro de tabla; en el form: registro,
  openCreate, openEdit, inválido no envía, create vs update, toast + cierre + reset + reload.

## 12. Librerías

Angular 21.2 (standalone, signals, `input()`/`output()`, control flow), RxJS 7.8, PrimeNG 21
(`p-dialog`, `p-table`, `p-toolbar`, `p-fieldset`, `p-floatlabel`, `p-select`, `p-datepicker`,
`p-inputNumber`, `p-toggleswitch`, `pButton`, `pTooltip`), PrimeFlex 4, PrimeIcons 7, Vitest
(la referencia usa Jasmine/Karma).
