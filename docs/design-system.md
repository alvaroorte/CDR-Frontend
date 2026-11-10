# Sistema de diseño (cdr-frontend)

**Objetivo:** que la cafetería se vea como parte de la misma familia que `../ticket-frontend`.
Se **copian literalmente** `src/styles-light.scss`, `src/styles-dark.scss` y `src/styles/general.scss`
de la referencia (renombrando solo `.ticket-mode-dark` → `.cdr-mode-dark`) y se añaden estilos nuevos
**al final** de esos archivos, en una sección `// ===== CDR =====`.

## 1. Tokens

### Paleta "Lynch" (grises de la referencia)
| Token | Hex | Token | Hex |
|---|---|---|---|
| lynch-50 | `#f6f7f9` | lynch-500 | `#64748b` |
| lynch-100 | `#eceef2` | lynch-600 | `#526077` |
| lynch-200 | `#d5d9e2` | lynch-700 | `#434e61` |
| lynch-300 | `#b1bbc8` | lynch-800 | `#3a4252` |
| lynch-400 | `#8695aa` | lynch-900 | `#343a46` |
| | | lynch-950 | `#23272e` |
Clases `.lynch-*` (color) y `.bg-lynch-*` (fondo).

### Superficies de marca
| Variable SCSS | Claro | Oscuro |
|---|---|---|
| `$background-main-primary` | `var(--p-teal-800)` | `var(--p-teal-900)` |
| `$background-main-secondary` | `var(--p-teal-600)` | `var(--p-teal-800)` |
| `$background-main-tertiary` | `var(--p-teal-500)` | `var(--p-teal-600)` |
| `$background-main-blur` | `rgb(111 163 153 / 32%)` | `rgb(14 81 74 / 32%)` |
| `$border-yellow` | `#d1a000` | `#ffc505` |
| Fila seleccionada | `#b8cce4` | `#9aacc2` |
Acentos del loader: `#ebbc05` (amarillo) y `#243070` (azul marino).
Preset PrimeNG **Lara** (primary = emerald); las superficies propias son teal — igual que la referencia.

### Tipografía y forma
- `font-family: 'Open Sans', sans-serif`; `html { font-size: 13px }` (base de todos los `rem`).
- Sombras: `.sombra-black` (tarjetas, fieldsets), `.sombra-yellow`.
- Radios: diálogos 15px, fieldset 10px, toolbar 10px, cabecera de tabla 12px arriba, leyenda de fieldset en píldora (50px).
- Animaciones PrimeFlex: `fadeindown`, `fadeinup`, `fadeinleft`, `zoomin` + `animation-duration-400`.

## 2. Componentes (cómo se ven en la referencia y se mantienen)

| Elemento | Patrón |
|---|---|
| Página | `div.container.mx-3.mb-0.pb-4 > p-fieldset[styleClass=sombra-black]` con `<h1 class="text-white text-2xl">Título <span class="text-sm">Subtítulo</span></h1>` en el header |
| Contenedor | `div.sombra-black.border-round-xl.p-2.surface-0` |
| Botones | `pButton pRipple [rounded]="true" size="small"`, `class="shadow-3 hover-primary"`; secundarios `severity="secondary"`; clases `hover-{severity}` |
| Tablas | `app-generic-table` / `app-table-on-demand`: cabecera teal-600 texto blanco |
| Modales | `p-dialog styleClass="w-10 md:w-6 lg:w-4" [modal]="true" appendTo="body"`, cabecera teal-600 |
| Formularios | `p-floatlabel`, `label.text-lg.font-bold.text-800.required-field`, `small.p-error.block.mt-2` |
| Toasts | `<p-toast />` único en `AppComponent` vía `HelpersService.messageNotification` |
| Layout | Header sticky con glass (`backdrop-filter: blur(6px)`, `bg-white-alpha-*`), sin sidebar; footer fijo teal-600 |

## 3. Nuevos patrones visuales de la cafetería (coherentes con lo anterior)

### Colores semánticos de estado del pedido (`app-order-status-tag`, bordes de tarjeta)
Usar **tokens PrimeNG** (cambian con el tema), nunca hex sueltos:

| Estado | `p-tag` severity | Borde de tarjeta |
|---|---|---|
| PENDIENTE | `warn` | `var(--p-yellow-500)` |
| EN_PREPARACION | `info` | `var(--p-sky-500)` |
| LISTO | `success` | `var(--p-green-500)` |
| ENTREGADO | `secondary` | `var(--p-gray-400)` |
| CANCELADO | `danger` | `var(--p-red-500)` |

Tiempo transcurrido (`app-elapsed-time`): normal < umbral 1; `text-orange-500` ≥ umbral 1; `text-red-500` +
animación sutil ≥ umbral 2 (*umbrales en minutos pendientes; propuesta 10 y 20*).

### POS (`/pos`) — tablet horizontal y escritorio
```
┌──────────────────────── header (igual que referencia) ───────────────────────┐
│ ┌─ col-12 lg:col-8 ───────────────────────┐ ┌─ col-12 lg:col-4 (sticky) ──┐ │
│ │ fieldset "Nuevo pedido"                  │ │ Carrito                      │ │
│ │ [chips de categorías: card con icono]    │ │ línea: nombre · qty ± · Bs   │ │
│ │ grid de product-cards (col-6 md:col-4    │ │ notas / adicionales          │ │
│ │  xl:col-3): imagen, nombre, desc, Bs,    │ │ ───────────────              │ │
│ │  p-tag "Agotado" (deshabilitada)         │ │ Subtotal      Bs 45.00       │ │
│ │                                          │ │ Descuento [%|Bs][  10 ]  -4.50│ │
│ │                                          │ │ TOTAL         Bs 40.50       │ │
│ │                                          │ │ [ Continuar ] (grande)       │ │
│ └──────────────────────────────────────────┘ └──────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```
- Tarjetas `p-card` + `sombra-black` + `border-round-xl`, imagen 4:3 con `no_image.avif` de respaldo,
  hover `zoom-1`; tamaño táctil mínimo **48px** en todo control.
- Modal de producto (`p-dialog`): cantidad `p-inputnumber [showButtons]`, adicionales `p-checkbox`
  con precio, observaciones `textarea`, botón "Agregar Bs X".
- "Continuar" abre `app-stepper` (copiado): Modalidad → Pago → Resumen → Confirmar.
  - Modalidad: dos tarjetas grandes "En el local" / "Para llevar"; en local, cuadrícula de
    **números de adorno** como botones circulares grandes (libres en teal, en uso deshabilitados con el código del pedido).
  - Pago: filas medio de pago + importe; en efectivo campo "Recibido" y **"Vuelto: Bs X"** solo visual.
  - Resumen: datos devueltos por `/order/quote`.
- Importes siempre alineados a la derecha, `font-bold` en total, formato `Bs 1.234,50` (`currencyBs`).

### Cocina (`/kitchen`) — monitor o tablet
- Sin footer, contenedor a ancho completo; tres columnas (`col-12 md:col-4`) con encabezado de color
  de estado y contador. LISTO más compacta.
- Tarjeta de pedido: **número de adorno en grande** (`text-6xl font-bold`) o "PARA LLEVAR #015" +
  nombre; hora y `app-elapsed-time`; ítems con cantidad grande, adicionales y notas (notas en
  `$border-yellow` para resaltar); borde izquierdo de 6px con el color del estado.
- Un botón **grande** por tarjeta con la siguiente transición (`size="large"`, ancho completo,
  `min-height: 56px`): "Preparar" → "Listo".
- Indicador `app-connection-status` en el header (verde conectado / rojo reconectando).
- Sonido al llegar `ORDER_CREATED` (patrón `playNotificationSound` de la referencia).

## 4. Responsive

- Breakpoints PrimeFlex (`sm 576`, `md 768`, `lg 992`, `xl 1200`).
- Teléfono (detección `core/utils/device.ts` de la referencia) → `app-mobile-app-required`
  (texto adaptado: "Use una tablet o computadora"). **Tablets permitidas.**
- POS en tablet vertical: carrito pasa a `p-drawer` inferior con botón flotante que muestra el total.
