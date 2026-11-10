# Patrones de campos de formulario

> **Traducción a formularios tipados (cdr-frontend).** Los fragmentos TS de este archivo vienen de
> la referencia, que usa formularios sin tipar. Al aplicarlos en cdr-frontend:
> - `campo: [, [validadores]]` → en `nonNullable.group`: `campo: ['', [...]]` (texto),
>   `campo: [0, [...]]` (número), `campo: [false]` (booleano), o
>   `campo: this.formBuilder.control<number | null>(null, [...])` para selects / valores opcionales.
> - `this.formX.value` → `this.formX.getRawValue()` al enviar (incluye controles deshabilitados), y
>   `this.formX.controls.campo.value` para leer un campo (en lugar de `get('campo').value`).
> - Las plantillas HTML **no cambian**.

Todos los fragmentos van dentro de `<ng-template pTemplate="content">` del `p-dialog` del
modal-form. Cada patrón se tomó de un formulario existente (indicado entre paréntesis).
Reglas comunes:

- Contenedor `div.form-group.field` con `mt-5` (primer campo) / `mt-3`–`mt-4` (siguientes).
- `p-floatlabel` envolviendo control + `<label ... class="text-lg font-bold text-800">`; añade
  `required-field` (pinta el `*`) **solo** si el control tiene `Validators.required`.
- Texto de la etiqueta desde `LABELS` (añade la clave si falta, sin duplicar una existente).
- Un `<small class="p-error block mt-2">` por cada validador; `required` condicionado a `touched`.
- `appendTo="body"` en todo overlay (select, datepicker) para que no se recorte dentro del diálogo.

## 1. Texto (schedule)

```ts
name: [, [Validators.required, Validators.minLength(LIMITS.minLengthFive), Validators.pattern(regex.fieldName), noSpaceValidator]],
```
```html
<div class="form-group field mt-5">
  <p-floatlabel>
    <input type="text" pInputText id="name" formControlName="name" class="w-full" />
    <label htmlFor="name" class="text-lg font-bold text-800 required-field"> {{ labels.name }} </label>
  </p-floatlabel>
  @if (formX.controls['name'].touched && formX.get('name')?.hasError('required')) {
    <small class="p-error block mt-2" > {{ messages.requiredField }} </small>
  }
  @if (formX.get('name')?.hasError('pattern')) {
    <small class="p-error block mt-2">{{ messages.deniedCharactersName }}</small>
  }
  @if (formX.get('name')?.hasError('minlength')) {
    <small class="p-error block mt-2">{{ messages.requiredMinLength }}</small>
  }
  @if (formX.get('name')?.hasError('noSpace')) {
    <small class="p-error block mt-2">{{ messages.noOnlySpace }}</small>
  }
</div>
```

Variantes de validación disponibles (no crear nuevas si alguna sirve):

| Caso | Validadores | Mensaje |
|---|---|---|
| Nombre/descripción corta | `pattern(regex.fieldName)` | `messages.deniedCharactersName` |
| Código | `pattern(regex.fieldCode)`, `minLength(LIMITS.minLengthThree)` | `deniedCharactersCode`, `requiredMinLengthCode` |
| Longitud máxima | `maxLength(LIMITS.maxLength)` | `messages.maxNumberField(LIMITS.maxLength)` |
| Descripción larga | `maxLength(LIMITS.maxLengthDescription)` | `requiredMaxLengthDescription` |
| Solo espacios | `noSpaceValidator` | `noOnlySpace` |

Si se necesita un límite o regex nuevo, se añade a `LIMITS` / `regex` (con su mensaje en
`MESSAGES`), nunca como literal en el componente.

## 2. Texto largo (ticket-incident)

```html
<div class="form-group field mt-3">
  <p-floatlabel>
    <textarea id="description" pTextarea formControlName="description" rows="3" class="w-full"></textarea>
    <label for="description" class="text-lg font-bold text-800 required-field"> {{ labels.description }} </label>
  </p-floatlabel>
  <!-- mensajes como en §1 -->
</div>
```

## 3. Número (sla, parameters)

```ts
firstResponseTime: [, [Validators.required, Validators.min(1)]],
```
```html
<div class="form-group field mt-5">
  <p-floatlabel>
    <p-inputNumber id="firstResponseTime" [useGrouping]="false" [min]="1"
      formControlName="firstResponseTime" styleClass="w-full" />
    <label htmlFor="firstResponseTime" class="text-lg font-bold text-800 required-field">{{ labels.firstResponseTime }}</label>
  </p-floatlabel>
  @if (formX.controls['firstResponseTime'].touched && formX.get('firstResponseTime')?.hasError('required')) {
    <small class="p-error block mt-2" > {{ messages.requiredField }} </small>
  }
</div>
```

## 4. Select de catálogo simple `string[]` (schedule-detail, holiday)

Catálogo cargado desde un endpoint del propio servicio en `ngOnInit`:
```ts
public daysOfWeek: string[] = [];
ngOnInit() {
  this.scheduleDetailService.eventFormComponent.set(this);
  this.getDaysOfWeek();
}
private getDaysOfWeek() {
  this.scheduleDetailService.getDaysOfWeek().subscribe({ next: (res) => { this.daysOfWeek = res; } });
}
```
```html
<div class="form-group field mt-5 col-12">
  <p-floatlabel>
    <p-select inputId="dayOfWeek" formControlName="dayOfWeek" [options]="daysOfWeek"
      [filter]="true" class="w-full" appendTo="body" />
    <label for="dayOfWeek" class="text-lg font-bold text-800 required-field"> {{ labels.day }} </label>
  </p-floatlabel>
</div>
```

## 5. Select de entidad relacionada (FK) (holiday)

**Reutiliza el servicio existente** de la entidad relacionada (búscalo en `modules/*/services`);
no dupliques el endpoint en el servicio nuevo.
```ts
private countryService = inject(CountryService);   // 'src/app/modules/country/services/country.service'
public countries: Country[] = [];
private getCountries() {
  this.countryService.getAll().subscribe({ next: (res) => { this.countries = res; } });
}
```
```ts
countryId: [, Validators.required],
```
```html
<div class="form-group field mt-4">
  <p-floatlabel>
    <p-select inputId="countryId" formControlName="countryId" [options]="countries"
      optionLabel="name" optionValue="id" [filter]="true" filterBy="name"
      class="w-full" appendTo="body" />
    <label for="countryId" class="text-lg font-bold text-800 required-field"> {{ labels.country }} </label>
  </p-floatlabel>
</div>
```
Si el servicio relacionado ofrece un método de selección liviano (p. ej. `enterpriseService.select()`
en supervisor-categories), úsalo en vez de `getAll()`.

## 6. Campos no editables en edición

La referencia no tiene campos de solo lectura; el patrón existente en el proyecto para bloquear
controles es `disable()` / `enable()` del `FormControl` (tickets-historical/panel-filters).
Aplícalo así **solo cuando el usuario lo pida**:

```ts
public openCreate(): void {
  this.reset();
  this.formX.get('code').enable();
  ...
}
public openEdit(id: number): void {
  this.reset();
  this.formX.get('code').disable();
  ...
}
private submit(typeSubmitEnum: TypeSubmitEnum): void {
  const data: X = { ...this.formX.getRawValue() };   // getRawValue incluye los controles deshabilitados
  ...
}
```
Un control deshabilitado no participa en `valid` ni en `value`; por eso `getRawValue()` cuando el
backend necesite el valor. Si el backend no debe recibirlo, usa `value` normal.

## 7. Fecha (holiday)

```html
<div class="form-group field mt-5">
  <p-floatlabel>
    <p-datepicker [fluid]="true" [showIcon]="true" dateFormat="dd/mm/yy" appendTo="body"
      formControlName="dateHoliday" />
    <label htmlFor="date" class="text-lg font-bold text-800 required-field"> {{ labels.date }} </label>
  </p-floatlabel>
</div>
```
Convertir a string para el backend en `submit()` con `DatePipe` (inyectable: provisto en
`app.config.ts`) y el formato de `COMMON.dateForBack` (`'yyyy-MM-dd'`).

## 8. Hora (schedule-detail)

```html
<div class="form-group field mt-3 col-6">
  <p-floatlabel>
    <p-datepicker id="startHour" inputStyleClass="w-full" class="w-full mt-1" [showIcon]="true"
      [timeOnly]="true" icon="pi pi-clock" appendTo="body" [readonlyInput]="false"
      formControlName="startHour" />
    <label htmlFor="startHour" class="text-lg font-bold text-800 required-field"> {{ labels.checkInTime }}</label>
  </p-floatlabel>
</div>
```
```ts
private datePipe = inject(DatePipe);
private getHourValue(formControlName: string): string {
  return typeof this.formX.get(formControlName).value == 'string'
    ? this.formX.get(formControlName).value                       // valor cargado en edición
    : this.datePipe.transform(this.formX.get(formControlName).value, FORMAT_TIME);
}
// submit: { ...this.formX.value, startHour: this.getHourValue('startHour') }
```

## 9. Estado activo (cost-center)

```ts
active: [true],
```
```html
<div class="form-group field mt-4 ml-3 flex">
  <label htmlFor="active" class="text-lg font-bold text-800 mr-3"> {{ labels.status }} </label>
  <p-toggleswitch formControlName="active" />
</div>
```
Nota: `reset()` deja `active` en `null`; si el valor por defecto debe ser `true` al crear, en
`openCreate()` usar `this.formX.patchValue({ active: true })` tras `reset()`.
En la tabla: `{ field: 'active', header: LABELS.status, columnType: TableColumnType.STATUS, align: Align.center }`.

## 10. Validadores condicionales (holiday)

Cuando la obligatoriedad depende de otro campo, reaccionar al `(onChange)` del control origen y
ajustar validadores; luego `updateValueAndValidity()` en los controles modificados:

```ts
public changedTypeHoliday(): void {
  switch (this.formHoliday.value.holidayType) {
    case this.holidayTypesEnum.NACIONAL:
      this.formHoliday.controls['territorialDivisionId'].clearValidators();
      this.formHoliday.controls['countryId'].setValidators(Validators.required);
      this.formHoliday.patchValue({ territorialDivisionId: null });
      break;
    ...
  }
}
```
```html
<p-select ... formControlName="holidayType" (onChange)="changedTypeHoliday()" />
<!-- campos dependientes envueltos en @if (formHoliday.value.holidayType === holidayTypesEnum.X) -->
```

## 11. Campo de contexto (FK al padre en un detalle) (schedule-detail)

El id del padre llega por `input.required<number>()` y se inyecta al crear:
```ts
public scheduleId = input.required<number>();
public openCreate(): void {
  this.reset();
  this.titleForm = this.labels.newRegistration("horario de trabajo");
  this.formScheduleDetail.patchValue({ scheduleId: this.scheduleId() });
  this.openModal = true;
}
```
El control `scheduleId` existe en el form (con `Validators.required`) pero no se renderiza.
