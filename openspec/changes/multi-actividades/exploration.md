# Exploration: multi-actividades

## Contexto

Feature nueva: durante la reserva de eventos, el usuario podrá seleccionar **hasta 3 actividades** del catálogo de booking (`Config.workshops[]`, paso 4 del wizard, `Step5Workshops.jsx`), espejando la feature ya mergeada "hasta 3 personajes" (commit `60008b4`). Decisiones de producto ya cerradas:

1. **Alcance**: catálogo `Config.workshops[]` del booking. NO los talleres públicos (`Taller`, sin vínculo con `Event`).
2. **Precio**: suma del precio de cada actividad, cada una con su `priceBase`/`pricePlus` según nº de niños. Sin pack, sin descuentos, sin campos de precio nuevos en `Config`.
3. **Persistencia**: array de nombres (`detalles.extras.talleres`) + script de migración desde `detalles.extras.taller` (String). Sin dual-write, sin ids.
4. **Extras (defectos preexistentes a corregir)**: unificar el umbral de grupo grande (backend `> 15` vs frontend `>= 15`); dedupe de `personajes` (y del nuevo `talleres`); validar que la actividad exista en el catálogo (hoy fallback silencioso 25/30 €).

## Estado actual verificado

Anclajes del mapa técnico confirmados leyendo el código (rama `feat/multi-actividades`). Casi todos exactos; desviaciones menores listadas abajo.

| Ancla del mapa | Verificación real |
|---|---|
| `api/models/event.model.js:57-68` — `taller` String `default:'ninguno'`, `personajes:[String]` con `validate <= 3`, snapshots | ✅ (±1: `taller` en 58, `personajes` 60-67, `precioPersonajeApplied` 68, `precioTallerApplied` 59) |
| `api/controllers/events.controllers.js:48` — check `personajes.length > 3` → 400 | ✅ exacto |
| Create (`253`) y PATCH (`616`) llaman `validateEventData` | ✅ exacto |
| `events.controllers.js:162-179` — pricing actividad única, `isLargeGroup > 15`, fallback 25/30, snapshot `precioTallerApplied` | ✅ (bloque 162-178) |
| `events.controllers.js:181-192` — pricing personajes (snapshot TOTAL; unitario 40 o pack3 100) | ✅ (±1: bloque 181-191) |
| `events.controllers.js:523-535` y `581-593` — invalidación de snapshots en dos pases, arrays comparados por JSON ordenado | ✅ exacto |
| `events.controllers.js:626-631` — recomputo final de `precioTotal` | ✅ (626-632) |
| `events.controllers.js:133-142` — dedupe de catálogo de extras (`seen` Set → 400) | ✅ (±1: 132-142; throw de duplicado en 134-135) |
| `api/models/config.model.js:28-39` — `workshops[]` `{id,name,priceBase,pricePlus,desc,imageUrl,suspended,active}` | ✅ exacto |
| `config.model.js:49-56` — `preciosExtras` (tallerBase 25, tallerPlus 30, personaje 40, precioPack3Personajes 100, extension30/60) | ✅ exacto |
| `api/scripts/migrate-personaje-to-array.js` + `backup-before-migrate.js` — precedente de migración idempotente con `.lean()` | ✅ (skip si el campo ya existe; `$set`/`$unset` vía `updateOne`; recalcula/limpia snapshot; backup genérico reutilizable) |
| `api/config/mailer.config.js:98-102` y `206-209` — `tallerText` singular con prefijo "Taller de X" | ✅ exacto |
| `api/services/google.service.js:118` y `168` — desglose `Actividad (nombre) = precioTallerApplied` y línea `- **Taller**:` | ✅ exacto |
| `api/scripts/analyze-stale-snapshots.js:44-57`, `fix-stale-snapshots.js:93-105,198-215`, `backup-affected.js:26-42` | ✅ exactos |
| `web/src/components/booking/Step5Workshops.jsx` — `selectWorkshop` (34-40) sobrescribe `extras.taller`; card "Sin actividad" (50-69); `isSelected` (75); precio con `>= 15` (76-79, 172-174, 195); modal CTA "SELECCIONAR ESTE TALLER" (207-219) | ✅ exacto |
| `web/src/components/booking/Step6Characters.jsx` — `selectCharacter` (56-78) con límite 3 y toast; "Sin Visita"/"Quitar todos" (80-85, 128); modal AÑADIR/QUITAR (299-314) | ✅ exacto |
| `web/src/pages/BookingPage.jsx` / `BudgetPage.jsx` — init `extras.taller: null` (~95); payload `extras: {...formData.extras}` (356 / 426) | ✅ exacto |
| `web/src/utils/bookingUtils.js` — `calculateBookingTotal` (25), taller single (51-71), personajes multi (73-80), `validateBookingStep` (116) | ✅ (±1) |
| `Step8Summary.jsx:100-116` (fila "Actividad: X", umbral `>= 15`) y `117-158` (chips personajes) | ✅ exacto |
| `StepBudgetSummary.jsx:77-95` (workshop) y `96-134` (personajes) | ✅ exacto |
| `ReservationDetailView.jsx` — lectura "Actividad" (940-971) y "Personajes" (973-1031); `ExtrasEdit` (2372-2807) con bloque taller single (2426-2527), bloque personajes multi (2536-2707), chips (2588-2613), toast límite (2648-2652), contador (2572-2576); Save (2778-2793) preserva snapshots históricos | ✅ exacto |
| `ReservationDetailModal.jsx:214-223` y `227-236` | ✅ exacto |
| `DayDetailView.jsx:109,138` y `BlockDateModal.jsx:61` crean `extras: { taller:'ninguno', personajes: [] }` | ✅ exacto |
| `PricingPage.jsx:350-374` — sección "Actividades" ("Un taller para toda la fiesta") | ✅ exacto |
| `ConfigurationPanel.jsx:971-1260` (catálogo workshops) y `412-415` (labels `preciosExtras`) | ✅ exacto |
| Tests API: `budget-flow.test.js:215-351` (multi-personaje) y `356-467` (invalidación snapshot PATCH) | ✅ (el bloque PATCH llega hasta 545: incluye la regresión de snapshot stale de taller en 469-545, espejo directo de esta feature) |
| Tests web: `bookingUtils.test.js:57-116` (taller single) y `134-200` (personajes 0/1/2/3); no hay tests de `Step5Workshops` ni `Step6Characters` | ✅ exacto |

### Desviaciones detectadas

1. Desfases de ±1 línea en algunos rangos del mapa (irrelevante para implementación).
2. El mapa citaba `budget-flow.test.js:356-467` como bloque de invalidación; en realidad el describe continúa hasta la línea 545 e incluye tests de regresión "snapshot stale de taller tras PATCH" (`474-545`) que son el espejo exacto del comportamiento a preservar para `talleres`.
3. `event.model.js:57-68` → los campos están en 58-68 (el mapa empezaba en 57).

### Hallazgos nuevos (superficie que el mapa no contemplaba)

1. **Tests existentes que romperán**: `web/src/components/booking/Step8Summary.test.jsx` usa fixtures `extras: { taller: 'ninguno' }` (línea 40) y `taller: 'Cocina'` (línea 72). Hay que migrarlos al array.
2. **Exit-guard de BudgetPage**: `web/src/pages/BudgetPage.jsx:200,215` — el `isDirty` del `beforeunload` depende de `formData.extras.taller !== null`; debe pasar a forma array.
3. **Subtotal del desglose de precios**: `ReservationDetailView.jsx:1078-1085` suma `precioTallerApplied` como importe total → obliga a conservar la semántica de "total" del snapshot (o actualizar esta suma si se cambia de modelo).
4. **Bug latente de lookup por nombre**: `ReservationDetailView.jsx:1229` busca `w.nombre ===` pero el campo del modelo es `name` (el fallback de recálculo nunca matchea). Además la sensibilidad a mayúsculas es inconsistente: el backend compara `toLowerCase()` (`events.controllers.js:166`) mientras `Step8Summary.jsx:104`, `StepBudgetSummary.jsx:83` y `ExtrasEdit` (`2414`) comparan `===` case-sensitive. Conviene un helper `findWorkshopByName` único.
5. **Fallbacks hardcodeados de `preciosExtras` sin `precioPack3Personajes`**: `events.controllers.js:66`, `config.controllers.js:32`, `fix-stale-snapshots.js:40`. Preexistente; relevante porque el nuevo pricing leerá esa rama.
6. **Scripts de snapshots ya a medio fósil**: `analyze-stale-snapshots.js:65` y `fix-stale-snapshots.js:110` aún leen el campo legacy `personaje` (singular) que multi-personajes eliminó. Al adaptarlos a `talleres` hay que decidir si se modernizan o se marcan como legacy.
7. **Ruta pública**: `/mi-reserva/:id` renderiza `ReservationDetailView` (el mismo componente del admin) → los cambios de lectura son también de cara al cliente final.
8. **`DayDetailView.jsx:138`** crea `extras: { taller:'ninguno', personaje:'ninguno', pinata:false }` — segundo sitio creador, con el campo legacy `personaje` todavía presente.
9. **Filtro de catálogo**: `Step5Workshops.jsx:73` filtra `!ws.suspended` pero ignora `active` (soft-delete). Con selección múltiple conviene alinearlo con `filterActiveCatalog`.
10. **Bug latente en invalidación de PATCH**: el guard `if (newDetalles.extras?.taller && ...)` (523, 581) no invalida el snapshot cuando el nuevo valor es falsy (`null`/`''`); solo funciona porque el frontend usa el centinela `'ninguno'` (truthy). La implementación array debe usar el patrón de personajes (presencia del campo, no truthiness).

## Superficie de impacto

| Archivo | Qué cambia | Por qué |
|---|---|---|
| `api/models/event.model.js` | `taller: String` → `talleres: [String]` (`default: []`, `validate <= 3`); `precioTallerApplied` se conserva con semántica de TOTAL | Modelo persistente de la selección múltiple |
| `api/controllers/events.controllers.js` | `validateEventData`: check `talleres.length > 3` + dedupe en `talleres` y `personajes`; pricing de `talleres[]` (suma + umbral único); validación de existencia en catálogo; invalidación de snapshot por arrays ordenados en los DOS pases (523-535, 581-593) | Núcleo de negocio, límites, dedupe y snapshots |
| `api/scripts/migrate-taller-to-array.js` (nuevo) | `taller: 'X'` → `talleres: ['X']`; `'ninguno'`/ausente → `[]`; `$unset taller`; preservar `precioTallerApplied` si existe, backfill si falta | Persistencia de datos legacy (idempotente, `.lean()`, precedente `migrate-personaje-to-array.js`) |
| `api/scripts/backup-before-migrate.js` | Reutilizable tal cual (backup genérico de `events` + `config`) | Garantía de reversión antes de migrar |
| `api/config/mailer.config.js` (98-102, 206-209) | `tallerText` → lista unida de actividades (prefijo "Taller de X" por nombre) | Los correos deben listar N actividades |
| `api/services/google.service.js` (118, 168) | Desglose `Actividad (nombres) = total` y descripción con lista | Sincronización con Google Calendar |
| `api/scripts/analyze-stale-snapshots.js`, `fix-stale-snapshots.js`, `backup-affected.js` | Leer `talleres` en lugar de `taller` (y decidir el destino del legacy `personaje`) | Mantienen utilidad post-migración para auditoría de snapshots |
| `web/src/utils/bookingUtils.js` | Bloque taller single → suma sobre `talleres[]`; helper `isLargeGroup`/`getWorkshopPrice` (fuente única frontend); umbral `> 15` | Cálculo de total en ambos wizards |
| `web/src/components/booking/Step5Workshops.jsx` | Single-select → multi-select con límite 3 (toast), toggle AÑADIR/QUITAR en modal, card "Sin actividad"/"Quitar todas", chips/indicador de selección, umbral `> 15` | UX de la feature (espejo de `Step6Characters.jsx`) |
| `web/src/pages/BookingPage.jsx` | Init `extras.talleres: []` (95); payload ya hace spread → automático | Estado del wizard de reserva |
| `web/src/pages/BudgetPage.jsx` | Init `extras.talleres: []` (95); exit-guard `isDirty` (200, 215) a forma array; payload automático | Estado del wizard de presupuesto |
| `web/src/components/booking/Step8Summary.jsx` (99-116) | Fila singular → filas/chips de N actividades con suma; umbral `> 15` | Resumen del wizard de reserva |
| `web/src/components/booking/StepBudgetSummary.jsx` (77-95) | Ídem para el wizard de presupuesto | Resumen del presupuesto |
| `web/src/components/admin/ReservationDetailView.jsx` | Lectura "Actividad" (940-971), desglose (1226-1250), subtotal (1078-1085), `ExtrasEdit` taller (2426-2527) → multi con chips y límite 3 (espejo del bloque personajes 2536-2707); shim legacy `taller`→`talleres` en `ExtrasEdit` (como ya hace con `personaje`) | Vista/edición admin Y pública (`/mi-reserva/:id`) |
| `web/src/components/admin/ReservationDetailModal.jsx` (214-223) | Card "Actividad" singular → lista | Vista compacta admin |
| `web/src/components/admin/DayDetailView.jsx` (108-110, 138) y `BlockDateModal.jsx` (60-62) | `extras: { talleres: [] }` en los sitios creadores (y limpiar el `personaje` legacy de la línea 138) | Bloqueos y creación desde calendario |
| `web/src/pages/PricingPage.jsx` (350-374) | Copy "Un taller para toda la fiesta" → copy multi ("Hasta 3 actividades…"); pills de umbral sin cambios | Comunicación pública de precios |
| `web/src/utils/bookingUtils.test.js` | Fixtures `taller` → `talleres`; test de umbral `>= 15` → `> 15` (cambio deliberado); nuevos tests de suma 0/1/2/3 | Reglas de negocio fijadas en tests |
| `web/src/components/booking/Step8Summary.test.jsx` | Fixtures `taller` → `talleres` (líneas 40, 72) | Tests existentes |
| `api/tests/budget-flow.test.js` | Nuevos bloques espejo: pricing multi-actividad (0/1/2/3, umbral 15/16, 400 en 4, 400 duplicados, 400 nombre desconocido), invalidación de snapshot en PATCH (cambio / mismo conjunto desordenado / vacío / payload stale) | Regresión del patrón multi-personajes |
| `api/tests/events.test.js` (217-244) | Sin cambios esperados (ya fija `15 → tallerBase`); ampliar si se quiere cubrir dedupe | Regla de umbral ya fijada |

## Puntos de diseño clave

### 1. Modelo de datos y snapshot de precio

Propuesta (espejo exacto del patrón `personajes`):

```js
// api/models/event.model.js — detalles.extras
talleres: {
  type: [String],
  default: [],
  validate: { validator: v => v.length <= 3, message: 'Máximo 3 actividades permitidas' }
},
precioTallerApplied: { type: Number }, // TOTAL de la selección de talleres (igual que precioPersonajeApplied es total)
```

El snapshot `precioTallerApplied` **se reutiliza como importe total** de la selección: con 1 actividad su valor coincide con el actual (continuidad histórica perfecta) y con N es la suma. Consistente con `precioPersonajeApplied` (total, no unitario) y con el subtotal de `ReservationDetailView.jsx:1078-1085`. No se renombra ni se añaden campos de precio.

Alternativas descartadas en "Opciones evaluadas".

### 2. Migración de datos (sin corromper reservas existentes)

`api/scripts/migrate-taller-to-array.js` (idempotente, precedente `migrate-personaje-to-array.js`):

1. Backup previo (`backup-before-migrate.js` → `api/scripts/backups/`) para reversión.
2. `Event.find({}).lean()` — imprescindible para que los defaults de Mongoose no falseen el "campo ausente".
3. Skip si `extras.talleres !== undefined` (ya migrado) → idempotente.
4. `extras` ausente → skip.
5. `taller: 'X'` (y `'X' !== 'ninguno'`) → `$set 'detalles.extras.talleres': ['X']`.
   - `precioTallerApplied` **existente se preserva intacto** (es el precio histórico cobrado; con un solo elemento suma y total coinciden).
   - `precioTallerApplied` **ausente → backfill** con la fórmula actual (catálogo o fallback 25/30 según `niños.cantidad`), cerrando el hueco por el que un recálculo futuro podría bloquearse con el nuevo 400 estricto.
6. `taller: 'ninguno'` | `null` | `undefined` → `$set 'detalles.extras.talleres': []` y `$unset 'detalles.extras.precioTallerApplied'` (nunca se cobró: el pricing solo suma cuando hay actividad).
7. `$unset 'detalles.extras.taller'` siempre. Sin dual-write: el código nuevo solo lee `talleres`.
8. Caso imposible de duplicados (el origen es un String), pero el script valida unicidad por seguridad.

Garantías: no toca `precioTotal` (los totales históricos son verdad histórica), no reordena ni reescribe nombres, y puede ejecutarse dos veces sin efecto.

Ventana de despliegue (código nuevo en producción sin migración aún): los documentos legacy leerían como "sin actividad". Mitigación recomendada: helper de lectura `getTalleres(extras)` con fallback transitorio `talleres ?? (taller && taller !== 'ninguno' ? [taller] : [])` en los puntos de lectura (mismo criterio que el shim de `ExtrasEdit` con `personaje`). No es dual-write (solo lectura). Opción conservadora alternativa: corte estricto igual que multi-personajes (sin shim) ejecutando la migración en el mismo despliegue.

### 3. Orden de las actividades

**No significativo para precio ni snapshot**: la suma es conmutativa y `precioTallerApplied` es un total. El array se guarda en **orden de selección** (igual que `personajes`, para chips y listas legibles) y la comparación de invalidación de snapshot usa arrays **ordenados + `JSON.stringify`** (patrón ya probado en `events.controllers.js:529-531` y fijado por el test "NO debería invalidar snapshot si… diferente orden"). Orden canónico de catálogo: innecesario.

### 4. Umbral de grupo grande (regla de negocio)

Evidencia de que la regla real es **plus si `niños > 15`** (a 15 exactos, base):

- `api/tests/events.test.js:229-244` — test nominal: "Debería aplicar tallerBase (no plus) si hay exactamente 15 niños".
- `api/tests/budget-flow.test.js:121-152` — 15 niños → 25 € (base de 'Magia'); 20 niños → 30 € (plus).
- `PricingPage.jsx:368-369` — pills públicas: "Hasta 15 niños: X€" / "16 o más niños: Y€".
- `ConfigurationPanel.jsx:412-413` — labels: "Actividad Económica (≤15)" / "Actividad Premium (>15)".
- Todo el panel admin usa `> 15` (`ReservationDetailView.jsx:1234,2418,2490,2515`).
- `api/scripts/analyze-stale-snapshots.js:58` — etiquetas 'plus (>15)' / 'base (≤15)'.
- El propio copy del booking: "suplemento por grupo de más de 15 niños" (`Step5Workshops.jsx:199`).

El outlier es el flujo de booking (`Step5Workshops.jsx:77,172,195`, `Step8Summary.jsx:109`, `StepBudgetSummary.jsx:86`, `bookingUtils.js:58` + su test `bookingUtils.test.js:57-64` que fija `>= 15`). **Recomendación: unificar en `> 15`** con fuente única por aplicación (ver Opciones B) y actualizar el test web de forma deliberada (es un cambio de precio visible a los 15 niños, decisión de negocio — ver Decisiones abiertas).

### 5. Validación de existencia en catálogo y renombres

Hoy, un nombre no resuelto cobra fallback 25/30 en silencio (`events.controllers.js:173-174`). Comportamiento propuesto:

- **Selección nueva o modificada** (create, o PATCH donde el conjunto ordenado de `talleres` cambió): cada nombre DEBE existir en `Config.workshops` y estar `active` → si no, `400 'Actividad no válida o inactiva: X'` (espejo del catálogo de extras, `events.controllers.js:141`).
- **Recálculo sin cambio de selección** (p. ej. PATCH que toca `fecha`): como la migración hace backfill de snapshots, en la práctica siempre habrá snapshot y no se buscará en catálogo. Si aun así faltara, fallback actual + `console.warn` (no bloquear ediciones de reservas legacy por nombres huérfanos).

Renombre de una actividad en `Config.workshops`: las reservas guardan el **nombre** (decisión de producto: sin ids). Consecuencias aceptadas: (a) la vista muestra el nombre histórico guardado (verdad de la reserva), (b) el precio histórico está protegido por el snapshot (no se recalcula al renombrar), (c) solo falla si un admin intenta *cambiar* la selección y reenvía un nombre ya inexistente — que es exactamente el 400 deseado. Guardar nombre + snapshot de precio a la vez (el snapshot total ya es "precio + nombre implícito") cubre el caso sin campos nuevos.

### 6. Dedupe

Espejo del catálogo de extras (`seen` Set → 400): en `validateEventData`, `talleres` y `personajes` con duplicados → `400` ("Actividad duplicada: X" / "Personaje duplicado: X"). El validador de Mongoose (`length <= 3`) no detecta `['A','A','A']` y el check explícito actual tampoco (solo cuenta longitud). Se mantiene el check explícito en el controlador además del validador de schema porque los update validators de Mongoose no cubren operadores `$push`/`$addToSet` (hecho verificado en Context7 `/automattic/mongoose/7.8.8`): hoy el PATCH usa `set()` + `save()` (los validadores corren), pero el check de controlador protege cualquier ruta futura.

### 7. Riesgo en los dos wizards y sitios creadores

`Step5Workshops` es compartido por `BookingPage` y `BudgetPage` (un solo cambio de componente cubre ambos), pero cada wizard tiene estado propio: init `extras.talleres: []` en los dos, exit-guard de `BudgetPage` (200/215), y fixtures de `Step8Summary.test.jsx`. `DayDetailView` (dos sitios: 108-110 y 138) y `BlockDateModal` crean `extras` con el centinela `'ninguno'` → migrar a `talleres: []`. El payload de ambos wizards hace spread de `formData.extras` (356/426) → no requiere cambios de armado. `validateBookingStep` y el `validateStep` inline de `BudgetPage` (299) no validan el paso de actividades (opcional) → sin cambios.

## Opciones evaluadas

### A. Snapshot de precio de N actividades

| Opción | Pros | Contras | Complejidad |
|---|---|---|---|
| **A1. Reutilizar `precioTallerApplied` como TOTAL** (recomendada) | Continuidad histórica perfecta (1 actividad = mismo valor); cero migración de datos de precio; espejo de `precioPersonajeApplied`; colaterales (subtotal 1078-1085, scripts, mails) siguen funcionando con ajuste mínimo | Nombre singular para semántica plural (se documenta con comentario) | Baja |
| A2. Renombrar a `precioTalleresApplied` | Nombre más claro | `$rename` en migración + tocar todos los colaterales/tests/scripts; rompe backups y consultas existentes; cero ganancia funcional | Media |
| A3. Array de snapshots por actividad (`[{nombre, precio}]`) | Auditoría por actividad; resiste parcialmente renombres | Rompe el patrón `personajes`; invalidación y migración más complejas; subtotal y scripts a reescribir; desproporcionado para el alcance | Alta |

### B. Umbral de grupo grande

| Opción | Pros | Contras | Complejidad |
|---|---|---|---|
| **B1. Unificar en `> 15` con helper único por app** (recomendada) | Coincide con tests API, copy público, labels admin y scripts; el admin ya lo usa | Cambia el precio mostrado a los 15 niños en el flujo de booking (hoy muestra plus); requiere actualizar el test web que fija `>= 15` | Baja |
| B2. Unificar en `>= 15` | El test web actual no cambia | Contradice el copy público ("Hasta 15 niños"), los tests de facturación real y el admin → habría que reescribir tests API y copy; cobra plus a 15 niños contra la política publicada | Media |
| B3. Umbral configurable en `Config` | Flexible | Producto prohibió campos nuevos de precio; más superficie de QA; nadie lo pidió | Media |

Fuente única: no existe paquete compartido entre `api/` y `web/` (monorepo sin workspace compartido). Crear uno solo para dos constantes implica configuración de resolución en Vite y Jest. Recomendación práctica: helper exportado por aplicación (`api/utils/pricing.js` con `isLargeGroup`/`getWorkshopPrice`, y los mismos exports en `web/src/utils/bookingUtils.js`) + tests que fijan `15 → base` en ambos lados. Alternativa (descartable): módulo compartido en `shared/`.

### C. Actividad inexistente en el catálogo

| Opción | Pros | Contras | Complejidad |
|---|---|---|---|
| **C1. 400 estricto en selección nueva + backfill de snapshots en migración** (recomendada) | Corrige el defecto donde importa (input nuevo); el backfill cierra el hueco legacy; consistente con el catálogo de extras | Migración algo más rica (lookup de precios) | Media |
| C2. Fallback silencioso (status quo) | Nada que romper | El defecto sigue vivo: se cobra un precio que el cliente no eligió | — |
| C3. Híbrido sin backfill (400 solo si cambió la selección, fallback en recálculo) | No toca datos legacy | Reservas legacy con snapshot ausente y nombre huérfano siguen cobrando 25/30 sin aviso | Media |

### D. Estrategia de migración

| Opción | Pros | Contras | Complejidad |
|---|---|---|---|
| **D1. Script idempotente + backup + `.lean()`** (recomendada) | Precedente probado (`migrate-personaje-to-array.js`); control total; reversible con backup | Paso manual en el despliegue | Baja |
| D2. Migración perezosa al leer/escribir | Sin script | Rozaría el dual-write prohibido; lógica distribuida; difícil de auditar | Alta |
| D3. Sin migración, compat-read permanente | Cero script | Deuda permanente y doble fuente de verdad en lectura | Media |

### E. Compat-read en la ventana de despliegue

| Opción | Pros | Contras | Complejidad |
|---|---|---|---|
| **E1. Helper `getTalleres(extras)` con fallback a `taller`** (recomendada) | Ventana de despliegue sin regresión visible; se puede retirar después; precedente del shim de `ExtrasEdit` con `personaje` | Pequeña doble lectura temporal | Baja |
| E2. Corte estricto (igual que multi-personajes) | Cero código transitorio | Si la migración se retrasa, admin y clientes ven "Sin actividad" en reservas legacy | Baja |

## Enfoque recomendado

**Modelo**: `detalles.extras.talleres: [String]` (máx. 3, validador de schema + check explícito en `validateEventData`), `$unset` de `taller`, `precioTallerApplied` reutilizado como TOTAL de la selección (A1). Sin campos nuevos en `Config`; sin pack de actividades.

**Precio**: suma de `getWorkshopPrice(actividad, niños)` por elemento, con `isLargeGroup = niños > 15` (B1) definido una sola vez por aplicación. Snapshot total preservado salvo que el conjunto ordenado de actividades cambie (entonces se invalida y se recalcula, en los dos pases del PATCH, con comparación por JSON ordenado — patrón personajes, corrigiendo el bug del truthiness).

**Validación**: `length <= 3`, dedupe → 400 (talleres y personajes), existencia+`active` en catálogo → 400 para selección nueva/modificada (C1).

**Migración**: `api/scripts/migrate-taller-to-array.js` idempotente con backup previo, `.lean()`, preservación de snapshots existentes y backfill de ausentes (D1). Helper de compat-read transitorio en puntos de lectura (E1).

**UI**: `Step5Workshops` multi-select espejo de `Step6Characters` (toggle, toast "El máximo es 3 actividades", card "Sin actividad"/"Quitar todas", modal AÑADIR/QUITAR, chips). Resúmenes con N filas/chips y suma. Admin: `ExtrasEdit` multi con chips removibles (espejo del bloque personajes) + shim legacy. `PricingPage` copy multi. Correos y Google Calendar listan las actividades unidas con el total.

**Correcciones de defectos incluidas**: umbral unificado en `> 15` (B1); dedupe de `personajes` y `talleres`; 400 ante actividad inexistente en selección nueva (C1).

### Alternativa principal descartada (resumen de tradeoffs)

A3 + B2 + C3 (snapshots por actividad, umbral `>= 15`, fallback híbrido) maximizaría la auditoría por actividad y respetaría el test web actual, pero contradice la política de precios publicada, complica migración/invalidación y se aleja del patrón multi-personajes que la feature debe espejar. Coste alto para beneficio marginal.

## Riesgos y mitigaciones

| Riesgo | Severidad | Mitigación |
|---|---|---|
| La migración corrompe reservas existentes (casos `taller: 'ninguno'`, snapshots ya seteados, campos ausentes) | Alta | Backup completo previo; `.lean()`; skip si ya migrado; snapshot existente jamás se reescribe; `precioTotal` intocado; dry-run con conteo de stats; prueba de idempotencia (ejecutar dos veces) |
| Ventana deploy ↔ migración muestra "Sin actividad" en reservas legacy | Media | Helper `getTalleres` con fallback de lectura (E1); ejecutar migración en el mismo despliegue |
| El cambio de umbral modifica precios visibles a exactamente 15 niños | Media | Decisión de negocio explícita (abierta abajo); tests API existentes ya fijan `15 → base`; actualizar test web de forma deliberada y documentada |
| Renombre/baja de una actividad en `Config.workshops` deja nombres huérfanos en reservas | Media | Aceptado por producto (nombres, no ids); snapshots preservan el precio histórico; 400 solo ante selección nueva inválida; vistas muestran el nombre histórico |
| El 400 estricto bloquea la edición de una reserva legacy con nombre huérfano y snapshot ausente | Baja | Backfill de snapshots en la migración; fallback + `console.warn` solo en recálculo sin cambio de selección |
| Romper uno de los dos wizards (`BookingPage`/`BudgetPage`) o los creadores de `DayDetailView`/`BlockDateModal` | Alta | Componentes compartidos (un cambio cubre ambos wizards); checklist de sitios creadores; fixtures de tests actualizadas; smoke manual de ambos flujos |
| Regresión del snapshot stale en PATCH (bug `f509160`) reapareciendo para `talleres` | Media | Espejar los tests `budget-flow.test.js:469-545` (payload con snapshot stale) para arrays |
| Dedupe rompe clientes que ya envían duplicados por API | Baja | El frontend nunca genera duplicados (toggle con `includes`); el 400 es informativo y solo afecta llamadas manuales |
| Superficie amplia (~20 archivos) supera el presupuesto de revisión de 400 líneas | Media | `sdd-tasks` debe pronosticar PRs encadenados (slices: backend modelo+pricing+migración / frontend wizards / admin+colaterales / tests) |
| Scripts `analyze`/`fix-stale-snapshots` quedan inservibles o confusos tras el cambio | Baja | Adaptarlos a `talleres` en el mismo cambio o marcarlos como legacy con nota en cabecera |

## Decisiones abiertas

1. **[Negocio] Umbral de grupo grande**: `> 15` (recomendado; evidencia: tests de facturación, copy público "Hasta 15 niños / 16 o más", labels admin "(≤15)/(>15)") vs mantener `>= 15` en el flujo de booking. Requiere confirmación porque cambia el precio mostrado a los 15 niños.
2. **[Negocio] Actividad inexistente al editar reservas legacy**: 400 estricto con backfill en migración (recomendado) vs fallback silencioso con warning. Depende de la tolerancia a bloquear ediciones de casos legacy rotos.

Técnicas ya resueltas por recomendación (a confirmar en design, sin consulta de negocio): nombre de campo `talleres` (linaje `taller→talleres`, espejo `personaje→personajes`), reutilización de `precioTallerApplied` como total, helper de compat-read transitorio, helper de umbral por aplicación.

## Estrategia de pruebas

**API (Jest + mongodb-memory-server, `cd api && npm test`)** — patrón `budget-flow.test.js`:

1. Pricing multi-actividad: 0/1/2/3 actividades (suma de `priceBase`/`pricePlus` por elemento), snapshot `precioTallerApplied` como total; a 15 niños todos base y a 16 todos plus (regla `> 15`); combinación de actividades con `pricePlus` distinto.
2. Límites: 4 actividades → 400; duplicados (`['A','A']`) → 400 (y lo mismo para `personajes`, defecto 3); nombre no existente o `active: false` → 400 en create.
3. Invalidación en PATCH (espejo de `356-545`): cambiar el conjunto recalcula; mismo conjunto desordenado NO invalida; vaciar limpia el snapshot; payload con snapshot stale es sobreescrito (regresión `f509160`); cambiar `talleres` recomputa `precioTotal`.
4. Umbral: mantener `events.test.js:229-244` (15 → base) y añadir 16 → plus por actividad.
5. Migración (opcional pero recomendable): sembrar docs con `taller: 'X'` + snapshot, `taller: 'ninguno'`, sin campo y ya migrado; ejecutar dos veces; verificar `$unset`, preservación de snapshot, backfill y `precioTotal` intacto.

**Web (Vitest, `cd web && npm run test:run`)**:

1. `bookingUtils.test.js`: fixtures a `talleres`; suma 0/1/2/3; umbral `> 15` (actualizar el test `57-64` — cambio deliberado de negocio); fallback de nombre desconocido en display; `validateBookingStep` sin regresión.
2. `Step8Summary.test.jsx`: fixtures `talleres: []` / `['Cocina']` (hoy `taller` singular).
3. Nuevo `Step5Workshops.test.jsx` (recomendado, al ser la UX insignia): selección/deselección (toggle), toast al 4º intento, "Sin actividad" limpia el array, modal AÑADIR/QUITAR. Actualmente no existe ningún test de este componente.
4. Sin cambios esperados en `bookingUtils.test.js:134-200` (personajes) salvo los de dedupe si se testean en frontend.

**Manual/E2E**: ambos wizards (reserva y presupuesto) con 0/1/3 actividades; edición admin (`ExtrasEdit`) preservando snapshots históricos; `/mi-reserva/:id` público; correos y evento de Google con N actividades; smoke Safari/iOS del modal (patrón `AnimatePresence` ya probado en `Step5Workshops`).

Comando de verificación completo (de `openspec/config.yaml`): `cd api && npm test && cd ../web && npm run test:run`.

## Ready for Proposal

**Sí.** Los anclajes están verificados, el patrón espejo multi-personajes está documentado con sus líneas exactas, y solo quedan dos decisiones de negocio (umbral y política ante nombres huérfanos) que pueden resolverse en la propuesta con las recomendaciones aquí fijadas. La fase de tareas debe pronosticar PRs encadenados por el tamaño de la superficie (~20 archivos).
