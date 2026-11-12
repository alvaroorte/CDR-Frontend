# Arquitectura del frontend (cdr-frontend)

Derivada del código real de `../ticket-frontend` (su `CLAUDE.md` está desactualizado en el
interceptor —hoy hace refresh token— y en alias de módulos inexistentes).

## 1. Estructura

```
src/
├─ main.ts                          bootstrapApplication(AppComponent, appConfig) + provideZoneChangeDetection()
├─ index.html                       <link id="theme-main" rel="stylesheet" href="styles-light.css">
├─ styles-light.scss / styles-dark.scss / styles/general.scss   (copiados de la referencia)
├─ assets/ i18n/es.ts (locale PrimeNG), images/ (logo claro/oscuro, fondo, no_image), sounds/ (nuevo pedido)
└─ app/
   ├─ app.component.ts|html         layout: mobile-app-required | loader + p-toast + header + router-outlet + footer
   ├─ app.config.ts                 provideRouter(withComponentInputBinding), providePrimeNG(Lara, darkModeSelector '.cdr-mode-dark'),
   │                                provideHttpClient(withInterceptorsFromDi), HTTP_INTERCEPTORS, MessageService, DatePipe
   ├─ app.routes.ts                 rutas planas, todas loadComponent + authGuard
   ├─ core/
   │  ├─ constants/   labels, messages, tooltips, placeholder, limits, regexs, common, local-storage, http-headers,
   │  │               header-links (urlsWithPermissions + configurationLinks)
   │  ├─ enums/       roles (ROLES_CODE_SYSTEM: ADMIN, CAJERO, COCINA), order-status, service-type, discount-type,
   │  │               payment-status, cash-movement-type, table-column-type, severity, type-submit, align
   │  ├─ environments/ environment(.development|.dev|.qa|.test).ts  { production, image_logo{light,dark}, server_url }
   │  ├─ guards/      auth.guard.ts
   │  ├─ interceptors/ header.interceptor.ts (+spec), loader.interceptor.ts
   │  ├─ interfaces/  service-common, generic-modal-form, generic-table, table, pageable, http-error-handling,
   │  │               order-event, order-board, quote, ...
   │  ├─ layout/      header/ (menú por rol, tema, usuario, indicador de caja/conexión), footer/
   │  ├─ models/      base.ts + un archivo kebab-case por entidad (category.ts, product.ts, order.ts, ...)
   │  ├─ pipes/       pipes.module.ts, format-date, currency-bs (nuevo), boolean-column-format, ...
   │  ├─ services/    login, local-storage, helpers, http-error-handler, loader, order-ws (nuevo)
   │  ├─ utils/       table-column-definitions, prime-table-props, filter, device, ...
   │  └─ validators/  noSpaceValidator, ...
   ├─ modules/
   │  ├─ login/
   │  ├─ user/ role/                 CRUD (angular-crud); permisos se asignan desde role/ (modal-permissions)
   │  ├─ category/ product/ addon/ table-marker/ payment-method/ parameter/   CRUD (angular-crud)
   │  │     carpeta en singular, ruta en plural (skill angular-crud). Referencia local: category/
   │  ├─ pos/            pantalla de registro de pedidos (frontend-component)
   │  ├─ orders/         seguimiento + historial + detalle
   │  ├─ kitchen/        tablero de cocina en tiempo real
   │  ├─ cash-register/  apertura, movimientos, cierre/arqueo, historial
   │  └─ reports/
   └─ shared/
      ├─ components/  generic-table, table-on-demand, toolbar, modal-delete, message-required-field, loader,
      │               image-input (base64), stepper, mobile-app-required, not-found, order-status-tag (nuevo),
      │               elapsed-time (nuevo), connection-status (nuevo)
      └─ prime-components/prime-components.module.ts   (PrimeModules: barril de módulos PrimeNG)
```

Alias `tsconfig.json`: `@core/*`, `@shared/*`, `@modules/*` (uno genérico en lugar de un alias por módulo).

## 2. Rutas y roles

```ts
{ path: 'pos', loadComponent: () => import('./modules/pos/pos.component').then(c => c.PosComponent), canActivate: [authGuard] },
```
`authGuard` (copiado): sin token → `logout()`; busca `route.url.join('/')` en `urlsWithPermissions` y
compara `access` con `loginService.rolesUser()`; si no coincide → `/404`.

| Ruta | Roles | Menú |
|---|---|---|
| `pos` | ADMIN, CAJERO | barra superior |
| `orders` | ADMIN, CAJERO | barra superior |
| `kitchen` | ADMIN, COCINA | barra superior |
| `cash-register` | ADMIN, CAJERO | barra superior |
| `reports` | ADMIN | barra superior |
| `categories`, `products`, `addons`, `table-markers`, `payment-methods`, `parameters`, `users`, `roles` | ADMIN; `products` también CAJERO, solo para marcar agotado/disponible (aprobado) | "Configuraciones" |

Tras login, redirección por rol: COCINA → `/kitchen`; CAJERO → `/pos`; ADMIN → `/pos`.

## 3. Comunicación con el backend

- Servicio por feature, `providedIn: 'root'`, `inject(HttpClient)`, URL `environment.server_url + 'recurso'`.
- Contrato REST estándar; `delete` con `responseType: 'text'`. Sin envoltorio de respuesta.
- Paginado: `IPageable<T>{content,last,pageNumber,pageSize,totalElements,totalPages}` +
  `Pageable.getPageableAsHttpParams(event)` (`page,size,sortBy,sortOrder,some`) — copiados.
- Servicios CRUD implementan `IServiceCommon` (registro de form/tabla/modal-delete por `signal`).
- Errores: `HeaderInterceptor` → `HttpErrorHandlerService.handleAndThrow` (toasts; 401 → refresh; si
  falla → logout). **409** se muestra como warning con el mensaje del backend y la pantalla recarga el dato.

## 4. Estado

- Signals en componentes y servicios (`signal`, `computed`, `input`, `output`, `viewChild`, `effect` solo para inputs).
- **Estado de dominio compartido** en servicios con signals:
  - `CartService` (pos): líneas, descuento, modalidad, pagos → `computed` de subtotal/total **de vista previa**.
  - `OrderWsService` (core): conexión, `Map` de pedidos del tablero, versión por pedido.
  - `CashSessionStateService` (core): sesión abierta del usuario (el header muestra "Caja abierta/cerrada").
- `httpResource`/`linkedSignal` permitidos en `pos`, `kitchen`, `cash-register` si simplifican (aprobado).

## 5. Formularios

Reactive Forms **tipados** (`nonNullable.group`), plantilla de la referencia (`p-floatlabel`,
`required-field`, `small.p-error` por validador), validadores `LIMITS`, `regex`, `noSpaceValidator`.
Importes con `p-inputnumber` (`mode="decimal" [minFractionDigits]="2" [maxFractionDigits]="2"`).

## 6. Entornos

| Config | Archivo | `server_url` |
|---|---|---|
| `development` (`npm start`) | `environment.development.ts` | `http://localhost:8086/cdr/` |
| `dev` / `qa` / `test` / `production` | `environment.<x>.ts` | *URLs pendientes de definir* |

Docker + nginx: mismo esquema que la referencia (`node:22-alpine` build → `nginx:alpine`, `try_files ... /index.html`).

## 7. Tests (Vitest)

Estilo de la referencia: lógica sin fixture (`TestBed.runInInjectionContext(() => new XComponent())`),
stubs literales con `vi.fn()`, mocks con `baseFields`, descripciones en español.
Obligatorios: specs de página y modal-form de cada CRUD, `CartService` (cálculos de vista previa),
`OrderWsService` (dedupe por versión, resync al reconectar), `header.interceptor`, `auth.guard`.
