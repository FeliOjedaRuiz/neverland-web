# multi-activity-selection Specification

## Purpose

Definir el comportamiento UX para seleccionar hasta 3 actividades del catálogo de booking (`Config.workshops[]`) por evento, con toggle explícito añadir/quitar, límite con aviso, chips de selección, y soporte en ambos wizards (booking y presupuesto) así como en la edición admin.

## Requirements

| ID | Requirement | Keyword |
|----|------------|---------|
| REQ-01 | Toggle explícito añadir/quitar — el modal de detalle muestra "AÑADIR" o "QUITAR" según el estado actual | MUST |
| REQ-02 | Máximo 3 actividades; el 4º intento muestra mensaje auto-dismissible | MUST |
| REQ-03 | Precio dinámico: suma del precio individual de cada actividad seleccionada | MUST |
| REQ-04 | "Quitar todas" cuando >=2 seleccionadas; "Sin actividad" cuando 0 seleccionadas | MUST |
| REQ-05 | Chips visibles con las actividades seleccionadas | MUST |
| REQ-06 | Admin edit picker soporta el mismo multi-toggle con chips removibles, sin cerrar al seleccionar | MUST |
| REQ-07 | Inicialización `extras.talleres: []` en ambos wizards y creadores de eventos | MUST |
| REQ-08 | Colaterales reflejan N actividades: resúmenes, vista pública, mailer, Google Calendar, PricingPage | MUST |

### REQ-01: Toggle Explícito Añadir/Quitar

El sistema MUST soportar multi-selección basada en toggle de hasta 3 actividades del catálogo de booking. El modal de detalle de cada actividad SHALL mostrar un botón "AÑADIR" cuando la actividad no está seleccionada, y "QUITAR" cuando ya lo está. A diferencia de personajes, NO hay descubrimiento silencioso — el modal ya presenta un botón de acción explícito.

#### Scenario: Primera actividad seleccionada

- GIVEN `talleres: []`
- WHEN el usuario abre el modal de detalle de una actividad y pulsa "AÑADIR"
- THEN la actividad se añade al array, la card muestra indicador de selección y el modal se cierra

#### Scenario: Segunda actividad añadida

- GIVEN actividad A seleccionada (`talleres: ['A']`)
- WHEN el usuario abre el modal de actividad B y pulsa "AÑADIR"
- THEN ambas actividades A y B muestran indicador de selección, `talleres: ['A', 'B']`

#### Scenario: Toggle para quitar desde modal

- GIVEN actividad A seleccionada
- WHEN el usuario abre el modal de detalle de actividad A
- THEN el botón muestra "QUITAR". Al pulsarlo, actividad A se elimina del array y el modal se cierra

#### Scenario: Toggle para quitar desde card

- GIVEN actividad A seleccionada
- WHEN el usuario pulsa la card de actividad A (fuera del modal)
- THEN actividad A se elimina del array. Si el array queda vacío, la UI revierte al estado "Sin actividad"

### REQ-02: Máximo 3 Actividades

El sistema MUST impedir seleccionar una 4ª actividad. Al intentarlo, un toast SHALL mostrar "El máximo es 3 actividades" y auto-desaparecer tras 3 segundos. La 4ª actividad NO se añade al array.

#### Scenario: Bloqueo de 4ª actividad

- GIVEN `talleres: ['Slime', 'Tattoos', 'Cocina']`
- WHEN el usuario intenta añadir una actividad no seleccionada
- THEN la actividad NO se añade. Toast "El máximo es 3 actividades" aparece y se auto-descarta tras 3 segundos

### REQ-03: Precio Dinámico por Suma

El sistema MUST actualizar el precio total mostrado como la suma del precio individual de cada actividad seleccionada. Cada actividad se tarifica con `priceBase` si niños ≤ 15, o `pricePlus` si niños > 15. No existen packs ni descuentos.

#### Scenario: Transiciones de precio con selección

- GIVEN 0 actividades seleccionadas, precio no mostrado
- WHEN el usuario añade una actividad con `priceBase: 20€`
- THEN el precio muestra "20€"
- WHEN el usuario añade una segunda actividad con `priceBase: 30€`
- THEN el precio muestra "50€"
- WHEN el usuario añade una tercera actividad con `priceBase: 25€`
- THEN el precio muestra "75€"

#### Scenario: Precio con grupo grande

- GIVEN 17 niños configurados en el evento
- WHEN el usuario selecciona 2 actividades con `pricePlus: 35€` y `pricePlus: 40€`
- THEN el precio muestra "75€" (suma de los `pricePlus`)

### REQ-04: "Quitar Todas" / "Sin Actividad"

Cuando ≥2 actividades estén seleccionadas, el botón "Sin actividad" MUST cambiar su texto a "Quitar todas". Al pulsarlo, SHALL vaciar el array a `[]` y revertir el texto a "Sin actividad". El precio desaparece.

#### Scenario: Limpiar selección múltiple

- GIVEN `talleres: ['Slime', 'Tattoos']`, botón muestra "Quitar todas"
- WHEN el usuario pulsa "Quitar todas"
- THEN `talleres: []`, botón revierte a "Sin actividad", precio desaparece

#### Scenario: Con una sola actividad seleccionada

- GIVEN `talleres: ['Slime']` (solo 1 actividad)
- WHEN el usuario observa el área de selección
- THEN el botón muestra "Quitar actividad" (ni "Quitar todas" ni "Sin actividad"), y al pulsarlo limpia el array

### REQ-05: Chips de Actividades Seleccionadas

El sistema MUST mostrar chips visibles con los nombres de las actividades seleccionadas debajo del grid de cards. Los chips permiten identificar rápidamente la selección actual.

#### Scenario: Chips reflejan selección

- GIVEN `talleres: ['Slime', 'Tattoos']`
- WHEN el usuario observa el área de selección
- THEN aparecen 2 chips con los nombres "Slime" y "Tattoos"

#### Scenario: Chip desaparece al quitar

- GIVEN `talleres: ['Slime', 'Tattoos']` con 2 chips visibles
- WHEN el usuario quita "Slime" (via modal, card o chip)
- THEN el chip "Slime" desaparece, solo queda "Tattoos"

### REQ-06: Admin Edit Multi-Select

El editor de reservas del administrador MUST soportar el mismo comportamiento de multi-toggle. Las actividades seleccionadas SHALL aparecer como chips removibles encima del picker colapsado. El picker SHALL NOT cerrarse al seleccionar una actividad. El componente `ExtrasEdit` MUST leer `talleres` (con shim legacy `taller`→`talleres` para reservas pre-migración).

#### Scenario: Admin añade y quita via chips

- GIVEN admin editando una reserva con `talleres: ['Slime']`
- WHEN admin abre el picker y selecciona 'Tattoos'
- THEN ambas aparecen como chips, picker permanece abierto, precio se actualiza
- WHEN admin pulsa "x" en chip 'Slime'
- THEN 'Slime' se elimina, chip desaparece, precio se recalcula

#### Scenario: Admin con reserva legacy pre-migración

- GIVEN reserva legacy con `taller: 'Cocina'` y sin campo `talleres`
- WHEN admin abre la edición
- THEN el shim convierte a `talleres: ['Cocina']` y muestra el chip correspondiente

### REQ-07: Inicialización del Campo talleres

El sistema MUST inicializar `detalles.extras.talleres` como array vacío `[]` en todos los puntos de creación de eventos: `BookingPage`, `BudgetPage`, `DayDetailView` y `BlockDateModal`.

#### Scenario: Nuevo booking inicializa talleres vacío

- GIVEN usuario inicia un nuevo flujo de reserva en BookingPage
- WHEN se crea el objeto de detalles del evento
- THEN `detalles.extras.talleres` es `[]` (no `undefined`, no `'ninguno'`)

#### Scenario: Nuevo bloqueo de fecha

- GIVEN admin crea un bloqueo desde BlockDateModal
- WHEN se construye el objeto de evento
- THEN `detalles.extras.talleres` es `[]`

### REQ-08: Colaterales Reflejan N Actividades

Todos los colaterales MUST listar las N actividades seleccionadas con su total. Aplica a: `Step8Summary`, `StepBudgetSummary`, `ReservationDetailModal`, vista pública `/mi-reserva/:id`, `PricingPage` (copy multi-actividad), mailer (`mailer.config.js`) y Google Calendar (`google.service.js`).

#### Scenario: Resumen de booking muestra múltiples actividades

- GIVEN reserva con `talleres: ['Slime', 'Tattoos']` y precio total 50€
- WHEN el resumen de Step8Summary se renderiza
- THEN muestra ambas actividades listadas y el precio total "50€"

#### Scenario: Email de confirmación lista actividades

- GIVEN reserva confirmada con `talleres: ['Slime', 'Cocina']`
- WHEN se envía el email de confirmación
- THEN el cuerpo del email lista ambas actividades y muestra el precio total aplicado

#### Scenario: Google Calendar incluye actividades

- GIVEN reserva confirmada con `talleres: ['Tattoos']`
- WHEN se crea/actualiza el evento en Google Calendar
- THEN la descripción incluye la actividad "Tattoos"

#### Scenario: Sin actividades seleccionadas

- GIVEN reserva con `talleres: []`
- WHEN cualquier colateral se renderiza o envía
- THEN muestra "Sin actividad" y no aplica recargo por actividad

## Edge Cases

| Case | Behavior |
|------|----------|
| Clicks rápidos consecutivos | Sin entradas duplicadas, sin selecciones fantasma |
| iOS Safari touch | Solo `onClick` handlers (sin lógica dependiente de hover) |
| Todas deseleccionadas vía toggles individuales | Precio muestra 0€, botón revierte a "Sin actividad" |
| Array vacío renderizado en resumen | Muestra "Sin actividad", sin recargo |
| Actividad del catálogo desactivada después de seleccionarla | El formulario mantiene la selección local; la validación del servidor rechaza al guardar si es selección nueva |
| Componente compartido por BookingPage y BudgetPage | Mismo `Step5Workshops.jsx` renderizado en ambos wizards sin bifurcación |

## Acceptance Criteria

- [ ] Seleccionar 1, 2 o 3 actividades vía toggle — con botón explícito AÑADIR/QUITAR en modal
- [ ] 4º intento muestra toast auto-dismissible "El máximo es 3 actividades"
- [ ] "Quitar todas" aparece cuando ≥2 seleccionadas
- [ ] Precio dinámico = suma de precios individuales (sin packs ni descuentos)
- [ ] Chips visibles con nombres de actividades seleccionadas
- [ ] Admin edit picker: multi-select con chips removibles, permanece abierto
- [ ] `extras.talleres: []` inicializado en BookingPage, BudgetPage, DayDetailView, BlockDateModal
- [ ] Colaterales (resúmenes, email, Calendar, PricingPage, vista pública) listan N actividades
- [ ] Funciona correctamente en Safari iOS
