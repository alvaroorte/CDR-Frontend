---
name: angular-crud
description: Estándar de cdr-frontend (sistema de pedidos de cafetería, Angular 21 + PrimeNG 21) para crear o ampliar módulos CRUD de mantenimiento (categorías, productos, adicionales, adornos numerados, medios de pago, parámetros, usuarios, roles...) con listado en tabla, crear, editar, eliminar y detalle maestro-detalle, replicando la arquitectura del módulo de referencia `ticket-frontend/src/app/modules/schedule`. Úsala siempre que se pida crear un CRUD, un mantenimiento, una pantalla de administración/configuración de una entidad, un modal de formulario de alta/edición, o agregar una entidad nueva con su servicio HTTP, tabla y formulario, aunque el usuario no diga la palabra "CRUD". No la uses para el POS, la cocina ni la caja (usa frontend-component).
---

# CRUD Angular — estándar de cdr-frontend (referencia: `modules/schedule`)

Esta Skill convierte una solicitud de CRUD en una implementación idéntica en arquitectura y estilo
al módulo `src/app/modules/schedule` (y su detalle `modules/schedule-detail`). **No es una
arquitectura genérica**: si algo no está aquí ni en el código del proyecto, no se inventa.

> **Origen y adaptaciones para cdr-frontend.** Esta skill se copió de `ticket-frontend` (proyecto de
> referencia, **solo lectura**). Mientras cdr-frontend no tenga su primer CRUD, el código fuente de
> referencia es `../ticket-frontend/src/app/modules/schedule`. Cuando exista el primer CRUD de CDR
> (`modules/categories`), pasa a ser la referencia local. Se aplican estas **4 adaptaciones aprobadas**,
> que mandan sobre cualquier texto de las referencias:
> 1. **Reactive Forms tipados**: `FormBuilder.nonNullable.group` / `FormGroup<{...}>`. No Signal Forms, no forms sin tipar.
> 2. **Vitest**: specs con `vi.fn()` en lugar de `jasmine.createSpy()`; mismo estilo (`TestBed.runInInjectionContext` + stubs literales).
> 3. **Sin `EventEmitter` en servicios**: para abrir modales propios desde otra pieza se usa el registro por `signal`
>    (igual que `eventFormComponent`), o un `output()` si es padre-hijo directo.
> 4. **CRUDs = patrón referencia** (`subscribe` + `signal.set`). `computed`/`linkedSignal`/`httpResource` solo en
>    pantallas no CRUD (POS, carrito, cocina) — ver skill `frontend-component`.
>
> Ante conflicto con la skill genérica `angular-developer`, **manda esta skill**.

Archivos de referencia (léelos cuando los necesites):

| Archivo | Cuándo leerlo |
|---|---|
| [references/architecture.md](references/architecture.md) | Siempre, antes de generar código: análisis del módulo de referencia, flujo de comunicación y convenciones. |
| [references/templates.md](references/templates.md) | Al escribir cada archivo: plantillas completas de modelo, servicio, columnas, página, modal-form, ruta, menú y specs. |
| [references/form-fields.md](references/form-fields.md) | Al construir el formulario: patrones de campo (texto, select, fecha, hora, número, toggle), validaciones, campos no editables y validadores condicionales. |
| [references/detail-and-variants.md](references/detail-and-variants.md) | Si el CRUD tiene detalle/hijos, tabla paginada en servidor, acciones extra en toolbar o vista de solo lectura. |

---

## 1. Cuándo usarla

- "Crea el CRUD / mantenimiento de X", "agrega la pantalla de administración de X".
- Agregar un formulario de alta/edición en modal para una entidad existente.
- Agregar un detalle hijo (maestro-detalle) a un CRUD existente.

No la uses para pantallas de flujo de negocio (tickets, reportes, timeline): tienen su propio diseño.

## 2. Arquitectura en una frase

Una **página standalone** (`{entity}.component`) compone cuatro piezas compartidas/locales —
`app-toolbar-common`, `app-modal-form` (local), `app-modal-delete` y `app-generic-table` — que se
comunican **a través del servicio de la entidad**, el cual implementa `IServiceCommon` y expone
tres `signal`s de "registro de componentes" (`eventFormComponent`, `eventTableComponent`,
`eventModalDeleteComponent`). El toolbar no conoce al formulario ni al modal: le pide al servicio
el componente registrado y llama `openCreate()`, `openEdit(id)` u `openConfirm()`.

```
Toolbar ──serviceGeneric──▶ {Entity}Service ◀──set(this)── ModalForm   (eventFormComponent)
   │                          ▲   ▲                     ModalDelete (eventModalDeleteComponent)
   │ [object]=selected()      │   └──selfEmitter──────── GenericTable (eventTableComponent)
   ▼                          │
Página: selected = signal<T|null>, items = signal<T[]>, getAll() ── (requestData) ◀── table.reload()
```

Detalle completo en [references/architecture.md](references/architecture.md).

## 3. Proceso obligatorio al recibir una solicitud de CRUD

1. **Requisitos y entidad.** Identifica nombre de la entidad (ES para textos, EN para código),
   ruta de menú, rol(es) con acceso y si es CRUD simple o maestro-detalle.
2. **Campos y tipos.** Lista cada campo: nombre, tipo TS, obligatorio/opcional, validaciones,
   si es editable en edición, si aparece en tabla y con qué `TableColumnType`.
3. **Operaciones.** Confirma cuáles aplican (listar, crear, editar, eliminar, detalle). Las que no
   apliquen se ocultan con `[showCreate]`, `[showEdit]`, `[showDelete]` del toolbar — no se borran
   piezas de la arquitectura.
4. **Buscar reutilizables antes de crear** (obligatorio, con Grep/Glob):
   - ¿Existe ya el modelo/interfaz en `src/app/core/models` o `src/app/core/interfaces`?
   - ¿Existe ya un servicio para la entidad o para las entidades relacionadas (selects)? Ej.:
     `modules/country/services/country.service.ts` se reutiliza en `holiday`.
   - ¿Existen ya las etiquetas en `core/constants/labels.ts`, mensajes en `messages.ts`, límites en
     `limits.ts`, regex en `regexs.ts`?
   - ¿Existe un componente compartido en `src/app/shared/components` para lo que necesitas?
5. **Pedir solo lo indispensable.** Si falta información que no se puede deducir, pregunta **solo**
   eso (ver §6). Nunca supongas endpoints, propiedades ni respuestas del backend.
6. **Estructura de archivos** (§4) y luego implementar en este orden:
   modelo → servicio → definición de columnas → `{entity}.module.ts` → modal-form → página →
   ruta → enlace de menú → specs.
7. **Verificar**: `npx ng build --configuration development` (desde `cdr-frontend/`) y los specs del
   módulo con Vitest (`npx ng test --include='src/app/modules/{entity-kebab}/**/*.spec.ts' --watch=false`).
   Corrige todo error de TypeScript/plantilla antes de terminar. Recorre el checklist (§8).
8. **Informar** brevemente las decisiones arquitectónicas relevantes (p. ej. por qué se reutilizó
   un servicio, por qué un campo se deshabilita en edición) y qué archivos compartidos se tocaron.

## 4. Estructura de archivos

```
src/app/
├── core/
│   ├── models/{entity-kebab}.ts                    # class {Entity} extends Base   (nuevo, si no existe)
│   └── utils/table-column-definitions.ts           # + static get{Entities}ColumnsDefinition()
│   └── constants/labels.ts | messages.ts           # + solo claves que no existan
├── modules/{entity-kebab}/
│   ├── {entity-kebab}.component.ts | .html | .spec.ts   # página (lista + composición)
│   ├── {entity-kebab}.module.ts                         # NgModule de solo exports
│   ├── services/{entity-kebab}.service.ts               # HTTP + IServiceCommon
│   └── components/modal-form/
│       └── modal-form.component.ts | .html | .spec.ts   # alta/edición en p-dialog
├── app.routes.ts                                   # + ruta lazy con authGuard
└── core/constants/header-links.ts                  # + entrada de menú y configurationLinks
```

Únicos archivos compartidos que se pueden modificar: `table-column-definitions.ts`, `labels.ts`,
`messages.ts` (solo añadir claves), `app.routes.ts` y `header-links.ts`. Nada más fuera del módulo.

## 5. Convenciones clave (resumen; detalle en architecture.md)

- **Standalone**: los componentes no declaran `standalone: true` (es el default en Angular 21);
  importan directamente lo que usan. El `{Entity}Module` es un `NgModule` **solo de `exports`**
  (`PipesModule`, `PrimeModules`, `ReactiveFormsModule`, `FormsModule`) que los componentes del
  módulo importan para no repetir la lista.
- **DI** con `inject()` en campos, nunca constructor con parámetros.
- **Estado de la página** con `signal`: `{entity}Selected = signal<{Entity} | null>(null)` y
  `{entities} = signal<{Entity}[]>([])`. Inputs/outputs con `input()`, `input.required()`, `output()`.
- **RxJS**: el servicio devuelve `Observable` de `HttpClient`; el componente hace
  `.subscribe({ next, complete })`. Sin `async` pipe, sin `toSignal`, sin `resource()` (no se usan
  en el patrón de referencia).
- **Formularios**: Reactive Forms **tipados** (`this.formBuilder.nonNullable.group({...})`, tipo
  inferido; `id` como `FormControl<number | null>`) con `Validators`, `LIMITS`, `regex`,
  `noSpaceValidator`. Para enviar usa `getRawValue()` (incluye controles deshabilitados). Plantilla
  idéntica a la referencia: `p-floatlabel`, clase `required-field` en la etiqueta de obligatorios y
  un `<small class="p-error block mt-2">` por cada error.
- **Crear vs editar**: un solo formulario; `{entity}Id = 0` significa crear; `save()` decide con
  `TypeSubmitEnum.CREATE | UPDATE`.
- **Notificaciones**: éxito con `HelpersService.messageNotification("success", "Correcto",
  MESSAGES.recordCreated | recordUpdated, 3000)`. **Errores HTTP**: los muestra globalmente
  `HeaderInterceptor → HttpErrorHandlerService` (toast); no se añaden callbacks `error` salvo que
  haya que restaurar estado local.
- **Carga**: global con `LoaderInterceptor`; no se crean flags `loading` por componente.
  **Lista vacía**: la resuelve `GenericTableComponent` (`MESSAGES.emptyMessage`).
- **Textos**: siempre desde `LABELS` / `MESSAGES` / `TOOLTIPS`; añade claves nuevas allí en vez de
  hardcodear (los títulos de página/fieldset de la referencia sí están en el HTML).
- **Imports** con alias `@core/*` y `@shared/*`.
- **Tipado**: modelo tipado en servicio (`http.get<{Entity}[]>`), columnas
  `TableColumn<{Entity}>[]`, tabla `GenericTableComponent<{Entity}>`. No introducir `any` en
  código nuevo. Respeta el `strictNullChecks` que tenga `tsconfig.json` de cdr-frontend: si está
  activo, las señales de registro se declaran `signal<IGenericModalForm | null>(null)` y se usan
  con `?.` / guardas.
- **Importes de dinero** (precios, adicionales): `number` en el modelo, `p-inputnumber` con
  `mode="currency" currency="BOB" locale="es-BO"` o `minFractionDigits=2`, y columna
  `TableColumnType.AMOUNT`. El redondeo definitivo lo hace el backend.
- **Imágenes** (categoría, producto): base64 en el modelo (`imageBase64: string`), carga con el
  componente compartido `app-input-file` y columna `TableColumnType.IMAGE`.

## 6. Reglas importantes

- **No inventar**: endpoints, nombres de propiedades, formatos de respuesta, roles o reglas de
  validación que no hayan sido proporcionados o que no estén en el código. Si faltan, pregunta.
  Mínimo indispensable a pedir si no se conoce:
  1. Ruta base del endpoint (p. ej. `schedule`) y si sigue el contrato REST estándar
     (`GET /x`, `GET /x/{id}`, `POST /x`, `PUT /x/{id}`, `DELETE /x/{id}` → texto).
  2. Campos de la entidad con tipo, obligatoriedad y validaciones.
  3. Endpoints de catálogos para selects (si hay relaciones) — primero busca si ya existen.
  4. Ruta del menú y roles (`ROLES_CODE_SYSTEM`) con acceso.
- **No duplicar**: nunca crear otra tabla, toolbar, modal de eliminación, servicio de
  notificaciones o validador si ya existe. Reutiliza `GenericTableComponent`, `ToolbarComponent`,
  `ModalDeleteComponent`, `MessageRequiredFieldComponent`, `HelpersService`, `noSpaceValidator`.
- **No cambiar la arquitectura** (p. ej. Signal Forms, `resource()` en CRUDs, NgRx o un servicio CRUD
  genérico) sin justificación explícita del usuario. En cdr-frontend **no existe**
  `curd.service.ts` (código muerto de la referencia que no se copió); no lo crees.
- **No modificar archivos ajenos** al CRUD (fuera de la lista del §4). Las erratas de la referencia
  (`"Calcelar"`, `tittleForm`, `nout-found`) **no se copiaron** a cdr-frontend; no las reintroduzcas.
- **Borrado lógico**: las entidades del catálogo con historial (producto, categoría, adicional,
  adorno, medio de pago) se **desactivan** en el backend (`DELETE` hace `active=false`). Mantén el
  botón Eliminar del toolbar, pero el `MESSAGES` de confirmación debe decir "desactivar" cuando aplique.
- **No generar código innecesario**: sin métodos de servicio que no se usen (excepto los 5 del
  contrato estándar si el backend los expone), sin archivos `.scss` vacíos (la referencia usa
  `styles: []` o nada), sin comentarios redundantes.
- Antes de terminar, el build debe pasar.

## 7. Ejemplos por operación (resumen — código completo en templates.md)

**A. Listado** — página:
```ts
public getSchedules(): void {
  this.scheduleService.getAll().subscribe({ next: (res) => this.schedules.set(res) });
}
```
```html
<app-generic-table [titleTable]="titleTable" [items]="schedules()"
  [tableColumnDefinitions]="tableColumnScheduleDefinitions"
  (onSelection)="setSchedule($event)" (requestData)="getSchedules()"
  (selfEmitter)="onTableSelfEmision($event)" />
```
Paginación, ordenamiento y filtro global son del lado cliente y vienen incluidos en
`GenericTableComponent` (configurables con `[tableProps]="new PrimeTableProps({...})"` y las
propiedades de `TableColumn`: `hideSortIcon`, `notfilterByThisfield`, `columnType`, `align`).
Las acciones por registro se hacen seleccionando la fila + botones del toolbar.

**B. Creación** — `openCreate()` resetea, titula y abre; `save()` valida y llama `submit(CREATE)`.

**C. Edición** — `openEdit(id)` llama `getById(id)` y hace `patchValue(res)` antes de abrir;
`save()` usa `submit(UPDATE)` con `{entity}Id`. Campos no editables: ver form-fields.md §6.

**D. Eliminación** — solo plantilla; la lógica la provee `ModalDeleteComponent`:
```html
<app-modal-delete [serviceGeneric]="scheduleService" [objectId]="scheduleSelected()?.id" />
```
Confirma, llama `service.delete(id)`, recarga la tabla y notifica. Para efectos extra usa
`(onDeleteSuccess)`.

**E. Detalle** — maestro-detalle: `@if (selected()?.id) { <app-{entity}-detail [{entity}Id]="selected().id" /> }`
con `input.required<number>()` + `effect()` que recarga. Ver detail-and-variants.md.

## 8. Checklist de verificación

**Estructura y tipado**
- [ ] Modelo en `core/models` (o reutilizado) extiende `Base`; sin `any` nuevo.
- [ ] Servicio `providedIn: 'root'`, implementa `IServiceCommon`, tiene las 3 señales de registro tipadas con la entidad, usa `environment.server_url` y `delete()` con `responseType: 'text'`.
- [ ] Columnas en `TableColumnDefinitions.get{Entities}ColumnsDefinition()` con `TableColumn<{Entity}>[]`; campos de auditoría con `DATETIME`, `Align.right`, `hideSortIcon`, `notfilterByThisfield`.
- [ ] `{Entity}Module` solo con `exports` y usado por página y modal-form.
- [ ] Componentes standalone, `inject()`, alias `@core`/`@shared`.

**Listado**
- [ ] `ngOnInit` llama `get{Entities}()`; `(requestData)` vuelve a llamarlo (botón recargar y tras guardar/eliminar).
- [ ] `(selfEmitter)` registra la tabla en `eventTableComponent`.
- [ ] `(onSelection)` actualiza `{entity}Selected` y el toolbar recibe `[object]="{entity}Selected()"`.

**Crear / Editar**
- [ ] `ngOnInit` del modal-form hace `service.eventFormComponent.set(this)`; implementa `openCreate()` y `openEdit(id)`.
- [ ] `reset()` en cada apertura; `id` oculto en el form; `{entity}Id` controla create/update.
- [ ] Cada validador tiene su mensaje en plantilla; obligatorios con `required-field`; botón guardar `[disabled]="form.invalid"`.
- [ ] Éxito: toast `recordCreated`/`recordUpdated`, `hideModal()`, `reset()`, y en `complete` `tableComponent().reload()`.
- [ ] Selects dependientes cargan sus catálogos en `ngOnInit` reutilizando servicios existentes.

**Eliminar**
- [ ] `<app-modal-delete [serviceGeneric] [objectId]="selected()?.id">` presente; no hay lógica de borrado duplicada.

**Integración**
- [ ] Ruta lazy `loadComponent` + `canActivate: [authGuard]` en `app.routes.ts`.
- [ ] Entrada en `urlsWithPermissions` y (si es configuración) en `configurationLinks`.
- [ ] Labels/mensajes nuevos añadidos sin duplicar claves existentes.
- [ ] Specs de página y modal-form siguiendo el estilo de referencia, en Vitest (stubs con `vi.fn()`, `TestBed.runInInjectionContext`).
- [ ] Formulario tipado (`nonNullable.group`); sin `any`; envío con `getRawValue()`.
- [ ] `ng build` sin errores; specs del módulo en verde.
- [ ] No se modificaron archivos fuera de la lista permitida.
