# CLAUDE.md — cdr-frontend

Guía para Claude Code en este repositorio. Frontend del sistema de pedidos de la cafetería.
**Replica arquitectura e identidad visual de `../ticket-frontend`** (proyecto de referencia,
**solo lectura — nunca modificarlo**).

> **Estado:** Etapas 1 (proyecto base, temas, layout, login, interceptores, guard) y 2 (CRUDs de
> administración) completadas. **Referencia local de CRUD: `src/app/modules/category`** (patrón
> `schedule` de la referencia ya adaptado: forms tipados, Vitest, strictNullChecks).
> Carpetas de módulo en **singular** (`category`, `product`, `table-marker`...) y rutas en **plural**
> (`categories`, `products`, `table-markers`...), como indica la skill `angular-crud`.
> Nombre comercial **Ciudad de Refugio** (logo pendiente: hoy se muestra icono + texto).
> **Etapa 3:** `modules/pos` (contenedor + `product-grid`, `modal-product-config`, `cart-panel`,
> `checkout` con `p-stepper`; `CartService` y `PosService`) y `modules/cash-register` (apertura, totales,
> movimientos). `CashSessionService` en `core/services` (estado compartido POS / caja / header).
> Tras el login ADMIN y CAJERO van a `/pos`; COCINA a `/kitchen`.
> **Etapa 4:** `core/services/order-ws.service.ts` (STOMP/SockJS, conectado desde el header al iniciar sesión,
> resync + dedupe por versión), `core/services/order.service.ts` (REST), `modules/kitchen` (tablero con
> `kitchen-card`, sonido, demoras por parámetro) y `modules/orders` (En curso / Historial, detalle y cancelación).
> **Etapa 5:** `modules/cash-register` con pestañas Mi caja / Historial, `modal-close` (arqueo con diferencia en
> vivo, advertencia de pedidos sin entregar, nota obligatoria si el ADMIN cierra la caja de otro, 409 → recarga el
> esperado conservando lo contado) y `modal-session-detail`. `core/utils/dates.ts` (`toIsoDate`).
> `@stomp/stompjs` + `sockjs-client` instalados (polyfill `global` en `src/polyfills.ts`, igual que la referencia).
> Las etapas se ejecutan **solo con aprobación explícita** del usuario
> (plan: `../cdr-backend/docs/plans/001-arquitectura-inicial.md` §8).

## Documentación y skills

| Recurso | Cuándo |
|---|---|
| `docs/frontend-architecture.md` | Antes de crear cualquier archivo |
| `docs/design-system.md` | Al maquetar: paleta, tipografía, componentes, layouts POS/cocina |
| Skill `angular-crud` | CRUDs de administración (patrón `modules/schedule`) |
| Skill `frontend-component` | Pantallas no CRUD (POS, carrito, cocina, caja, reportes) y componentes compartidos |
| Skill `realtime-ws` | Cualquier cosa con WebSocket/STOMP |
| Skill `cdr-order-management` (raíz CDR-GPF) | Reglas de negocio: dinero, descuentos, estados, pagos, adornos |
| Skill `angular-developer` (Google) | Guía general de Angular 21 — **subordinada** a las anteriores |

### Precedencia entre skills (aprobada por el usuario)

`cdr-order-management` > `angular-crud` / `frontend-component` / `realtime-ws` > `angular-developer`.
Conflictos ya resueltos con `angular-developer`:

| `angular-developer` recomienda | En este proyecto |
|---|---|
| Signal Forms | **Reactive Forms tipados** (`FormBuilder.nonNullable.group`) |
| Vitest | **Vitest** ✔ (la referencia usaba Karma/Jasmine) |
| `resource()` / `httpResource` / `linkedSignal` | Solo en pantallas nuevas no CRUD cuando simplifiquen; CRUDs = `subscribe` + `signal.set` |
| Tailwind | **No.** PrimeFlex + SCSS de la referencia |
| `ng new` con la última versión | Angular **21** (misma mayor que la referencia) |
| Component harnesses / E2E | Opcional; no exigido en v1 |

## Stack

Angular 21 standalone (zone.js, `provideZoneChangeDetection`), PrimeNG 21 + `@primeng/themes` (preset
Lara), PrimeFlex 4, PrimeIcons 7, RxJS 7.8, Vitest. `@stomp/stompjs` + `sockjs-client` se instalan en la Etapa 4.
`.npmrc` fija `legacy-peer-deps=true`: npm 10.9 falla con "Cannot read properties of null (reading 'edgesOut')"
al resolver los peers de vitest/jsdom. Tests: solo `src/**/*.spec.ts` (angular.json), porque Vitest
tomaría `environment.test.ts` como archivo de pruebas.
**No** se copian de la referencia: ngx-translate, jwt-decode, highcharts (salvo que reportes lo
necesiten — decisión de Etapa 6), quill, ng-recaptcha-2, Karma/Jasmine, `curd.service.ts`, `http.service.ts`.

## Comandos

```powershell
npm install
npm start                       # http://localhost:4200 (environment.development.ts)
npm test                        # Vitest
npx ng test --include='src/app/modules/products/**/*.spec.ts' --watch=false
npm run build:dev | build:qa | build:prod
```

## Arquitectura (resumen — detalle en docs/frontend-architecture.md)

- `src/main.ts` → `app.config.ts` → `app.routes.ts`. Todas las rutas `loadComponent` + `canActivate: [authGuard]` (salvo `/login`).
- `core/` (constants, enums, guards, interceptors, interfaces, layout, models, pipes, services, utils, validators),
  `modules/<feature>/`, `shared/components/`, `shared/prime-components/prime-components.module.ts` (`PrimeModules`).
- Permisos de ruta y menú en `core/constants/header-links.ts` (`urlsWithPermissions`, `configurationLinks`).
- Auth: `LoginService` (signals `user`, `userId`, `rolesUser`; `haveSomeRole(roles)`), `HeaderInterceptor`
  (Bearer + refresh compartido + reintento), `LoaderInterceptor`, `HttpErrorHandlerService` (toasts).
- Estado: signals. Sin NgRx. **Sin `EventEmitter` en servicios** (registro por `signal`).
- `environment.development.ts` es el que importan los servicios; `angular.json` lo reemplaza por entorno.

## Reglas que no se negocian

1. **Identidad visual idéntica a la referencia** (paleta teal + Lynch, `sombra-black`, fieldset con blur,
   header glass, botones redondeados). Solo cambian logo y textos de marca.
2. **El frontend nunca es fuente de verdad de importes, roles ni estados.** Muestra vista previa;
   el resumen final viene de `POST /order/quote`.
3. Ocultar en UI lo que el rol no puede hacer (`loginService.haveSomeRole`), **pero** asumir que el backend valida igual.
4. Textos de UI en español desde `LABELS` / `MESSAGES` / `TOOLTIPS` / `PLACEHOLDERS`; código en inglés.
5. DI con `inject()`; componentes standalone sin `standalone: true`; control flow `@if/@for/@switch`.
6. Tipado fuerte, sin `any` nuevo.
7. Teléfonos bloqueados (`mobile-app-required`); **tablets permitidas** (POS y cocina deben verse bien en tablet).
8. No añadir dependencias sin justificar y aprobar.
9. `ng build` y los specs del módulo deben pasar antes de dar algo por terminado.

## Desviaciones respecto a la referencia

| Referencia | cdr-frontend |
|---|---|
| Forms sin tipar | Reactive Forms tipados |
| Karma/Jasmine | Vitest |
| `EventEmitter` en servicios | Registro por `signal` / `output()` |
| `strictNullChecks: false` | **Activo** (`strict: true`, aprobado) |
| Bloqueo de teléfonos con enlace a app móvil (tablets ya permitidas en `device.ts`) | Mismo bloqueo, mensaje "use tablet o computadora" (no hay app móvil) |
| WebSocket sin token | JWT en `connectHeaders` + resincronización |
| Clase `.ticket-mode-dark` | `.cdr-mode-dark` (solo renombre) |
| Erratas (`nout-found`, `Calcelar`, `tittleForm`, `*.inteface..ts`) | Corregidas |
| `HttpErrorHandlerService`: 403 → logout | 403 → aviso "sin permisos" **sin** cerrar sesión (aquí el 403 es denegación por rol); sin caso 402; tolera status 0 |
| Login por email + reCAPTCHA + badges de tiendas | Login por username, sin captcha ni badges |
| `LoginService` con `EventEmitter` y empresa | Signals (`isLoggedIn`, `fullName`, `rolesUser`) + `GET /users/me` |
| `es.ts` tipado con ngx-translate (`fileSizeTypes` string, `firstDayOfWeek` "0") | Tipo `Translation` de PrimeNG con valores corregidos |
| Logos ENDESYC | Icono + nombre en texto (logo de marca pendiente) |
| `app-input-file` sube archivos a `/media` | `app-image-input` (ControlValueAccessor): imagen base64 con vista previa, valida tipo y 1 MB |
| `app-modal-delete` elimina | Desactiva (borrado lógico); textos `confirmMessage` / `successMessage` configurables |
| Modales extra abiertos con `EventEmitter` del servicio | Registro por signal con `IOpenableModal` (`eventModalPasswordComponent`, `eventModalPermissionsComponent`) |
| Specs de `generic-table` / `modal-delete` en Jasmine | Reescritos en Vitest con strictNullChecks |
| `app-stepper` propio | Cobro del POS con `p-stepper` de PrimeNG (`[linear]`), como el modal de sucursales de la referencia | No se copió `app-stepper`; el de PrimeNG cubre el caso |
| — | `currencyBs` (pipe, "Bs 1.234,50") y `core/utils/money.ts` (`round2` HALF_UP solo de vista previa) | Importes del POS |
| `MessageWsService` creado en el constructor, sin token | `OrderWsService`: fábrica de cliente inyectable (`STOMP_CLIENT_FACTORY`) para los tests; conexión iniciada por el header | Testeable sin red |
| Sin `allowedCommonJsDependencies` | `sockjs-client` declarado en `angular.json` | Silencia el aviso de CommonJS del build |
| Estilos solo de la referencia | Sección `// ===== CDR: POS y caja =====` en `styles/general.scss` con tokens de PrimeNG (claro/oscuro) | Tarjetas, adornos y controles táctiles ≥ 48px |
