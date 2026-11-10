---
name: frontend-component
description: Estándar de cdr-frontend (Angular 21 + PrimeNG 21) para construir pantallas y componentes que NO son CRUD de mantenimiento — POS/registro de pedidos, carrito y descuentos, tablero de cocina, seguimiento de pedidos, caja (apertura, movimientos, arqueo), reportes, y componentes compartidos nuevos (tarjetas, tags de estado, tiempo transcurrido). Úsala siempre que se cree o modifique una de esas pantallas, un componente en shared/, o un servicio de estado con signals, manteniendo la identidad visual de ticket-frontend.
---

# Componentes y pantallas no CRUD — cdr-frontend

Para CRUDs usa `angular-crud`. Para reglas de negocio (importes, descuentos, estados) lee
**siempre** `cdr-order-management`. Para WebSocket, `realtime-ws`. Diseño: `docs/design-system.md`.

## 1. Proceso

1. Leer la regla de negocio aplicable en `cdr-order-management` (no reinterpretarla).
2. Buscar reutilizables (Grep/Glob) en `shared/components`, `core/services`, `core/pipes`,
   `core/constants`. Reutilizar `app-stepper`, `app-input-file`, `app-generic-table`,
   `app-table-on-demand`, `app-message-required-field`, `HelpersService`, `LoaderInterceptor`.
3. Confirmar contrato del endpoint en `../cdr-backend/docs/plans/001-arquitectura-inicial.md` §6
   (o en el código del backend). **No inventar endpoints ni campos.**
4. Implementar: modelo/interfaz → servicio HTTP → servicio de estado (si hay) → componentes hijos
   presentacionales → componente contenedor (página) → ruta + `header-links` → specs Vitest.
5. `npx ng build --configuration development` + specs del módulo en verde.

## 2. Estructura de una feature no CRUD

```
modules/pos/
├── pos.component.ts|html|spec.ts              # contenedor: orquesta, inyecta servicios
├── pos.module.ts                              # NgModule solo exports (PrimeModules, PipesModule, ReactiveFormsModule, FormsModule)
├── services/
│   ├── pos.service.ts                         # HTTP: catálogo, quote, create
│   └── cart.service.ts                        # estado del carrito con signals (providedIn: 'root' o en el contenedor)
└── components/
    ├── category-grid/  product-grid/  product-card/
    ├── modal-product-config/                  # cantidad, adicionales, observaciones
    ├── cart-panel/  discount-form/
    └── checkout-stepper/ (service-type-step, payment-step, order-summary)
```

- **Contenedor vs presentacional:** los hijos reciben datos por `input()` / `input.required()` y emiten con
  `output()`; no inyectan servicios HTTP. El contenedor (o el servicio de estado) hace las llamadas.
- Selector `app-{kebab}`; un componente por carpeta; `templateUrl`; sin `.scss` por componente salvo
  necesidad real (estilos en los SCSS globales, sección `// ===== CDR =====`).

## 3. Estado con signals (patrón aprobado para pantallas nuevas)

```ts
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _lines = signal<ICartLine[]>([]);
  private readonly _discount = signal<ICartDiscount | null>(null);

  public readonly lines = this._lines.asReadonly();
  public readonly discount = this._discount.asReadonly();

  // VISTA PREVIA — el importe definitivo lo devuelve POST /order/quote
  public readonly subtotal = computed(() =>
    round2(this._lines().reduce((acc, l) => acc + (l.unitPrice + l.addonsUnitTotal) * l.quantity, 0)));
  public readonly discountAmount = computed(() => previewDiscount(this.subtotal(), this._discount()));
  public readonly total = computed(() => Math.max(0, round2(this.subtotal() - this.discountAmount())));

  public addLine(line: ICartLine): void { this._lines.update(ls => [...ls, line]); }
  public updateQuantity(key: string, quantity: number): void { ... }
  public removeLine(key: string): void { ... }
  public setDiscount(d: ICartDiscount | null): void { this._discount.set(d); }
  public clear(): void { this._lines.set([]); this._discount.set(null); }
}
```

- Escritura solo por métodos del servicio; exponer `asReadonly()`.
- `computed` para derivados; `linkedSignal` para estado editable que se reinicia con su fuente
  (p. ej. paso del stepper al cambiar la modalidad); `httpResource` para lecturas reactivas simples
  (p. ej. disponibilidad de adornos) — **solo** si simplifica frente a `subscribe`.
- `effect()` solo para efectos externos (sonido, foco), nunca para copiar un signal a otro.
- El redondeo en frontend (`round2`) es solo de presentación. **Nunca enviar importes calculados al backend**
  (el request de creación lleva ids, cantidades, notas, descuento `type/value/reason`, modalidad y pagos).

## 4. Permisos en UI

```ts
public readonly canApplyDiscount = computed(() =>
  this.loginService.haveSomeRole([ROLES_CODE_SYSTEM.ADMIN, ROLES_CODE_SYSTEM.CAJERO]));
```
Ocultar/deshabilitar lo no permitido, mostrar el límite del CAJERO (parámetro del backend) como ayuda,
y aun así **manejar el 400/403 del backend** (toast global ya lo hace).

## 5. Concurrencia y errores

- Las acciones de estado envían `expectedVersion`. En **409**, el `HttpErrorHandlerService` muestra el
  mensaje; el componente recarga ese pedido (`error:` en el `subscribe` **solo** para restaurar estado).
- Botones de acción con `[loading]`/`[disabled]` mientras la petición está en curso para evitar dobles clics
  (excepción permitida a "sin flags de loading": aquí protege contra duplicados, no es un spinner).
- Confirmación (`ConfirmationService` con `confimationCommon`) antes de: confirmar pedido, cancelar, cerrar caja.

## 6. Diseño

Seguir `docs/design-system.md` §3: tarjetas `sombra-black border-round-xl`, botones redondeados,
controles táctiles ≥ 48px, importes a la derecha con `currencyBs`, colores de estado por tokens PrimeNG,
cocina sin footer y con botones grandes. **No** introducir Tailwind ni otra librería de UI.

## 7. Tests (Vitest)

- Servicios de estado: probar cálculos y transiciones puras (`CartService`: subtotal con adicionales,
  descuento % y fijo, total nunca negativo, quitar línea).
- Contenedores: `TestBed.runInInjectionContext(() => new PosComponent())` con stubs `vi.fn()`.
- Presentacionales: `input`/`output` con `TestBed.createComponent` solo si hay lógica de plantilla relevante.

## 8. Checklist

- [ ] Regla de negocio verificada en `cdr-order-management`; endpoint existente.
- [ ] Contenedor + presentacionales con `input()`/`output()`; servicios de estado con signals readonly.
- [ ] Ningún importe enviado al backend; resumen final desde `/order/quote`.
- [ ] Permisos en UI con `haveSomeRole`; backend sigue validando.
- [ ] `expectedVersion` en cambios de estado; 409 recarga el dato.
- [ ] Identidad visual de la referencia; tablet usable; teléfono bloqueado.
- [ ] Textos en `LABELS`/`MESSAGES`; sin `any`; `ng build` + specs en verde.
