# Diseño: Multi-Actividades — hasta 3 actividades por evento

## Approach

Backend primero: `taller` pasa a `talleres`, la API valida y calcula la suma autoritativa, y web la previsualiza. Anclas verificadas: `event.model.js:57-68`; `events.controllers.js:48,162-192,523-535,581-593,626-631`; `config.model.js:28-39,49-56`; mailer `98-102,206-209`; Calendar `118,168`; analyzer `44-57`, fixer `93-105,198-215`, backup `26-42`; Step5 `34-40,75,77,172,195`; Step6 `56-78`; Booking/Budget `95`; utils `52-78`; summaries `100/109` y `77/86`; admin `1226-1250,2426-2527`; BlockDate `61-62`; tests de snapshot `budget-flow:470-545`.

`obtenerTalleres(extras)` se crea en `api/utils/pricing.js`: helper puro, solo lectura y retirable tras migración. Si `extras.talleres` es un array se devuelve tal cual; en otro caso se evalúa `extras.taller`, se normaliza con `trim().toLowerCase()` y, si no es `'ninguno'` ni vacío, se devuelve `[valorLimpio]`. Si nada aplica, devuelve `[]`. La capa web mantiene su helper de precio en `bookingUtils.js`; no hay paquete compartido en este monorepo.

## Components

Los requisitos se citan SIEMPRE cualificados como `<capacidad>/REQ-NN`: las cuatro specs numeran sus requisitos de forma independiente, de modo que un `REQ-03` suelto es ambiguo entre specs.

| Ruta | Acción; responsabilidad | Contrato (entrada → salida) | Requisitos |
|---|---|---|---|
| `api/models/event.model.js` | Modify; `talleres: [String]` sustituye a `taller: String`. | Entrada: documento con `detalles.extras.talleres`. Salida: array SIN `default: []` (preservar semántica de presencia para compat-read), con validador `length <= 3`; `precioTallerApplied` (Number) se conserva y representa el total de la selección. | `activity-validation/REQ-01` · `activity-data-migration/REQ-04` |
| `api/utils/pricing.js` | Create; helpers puros de precio y de lectura compatible. | `obtenerTalleres(extras) → string[]`: compat-read por PRESENCIA. Si `extras.talleres` está presente y es un array se devuelve tal cual (un array vacío explícito gana al legacy); en otro caso se evalúa `extras.taller`, se normaliza con `trim().toLowerCase()` y, si no es `'ninguno'` ni vacío, se devuelve `[valorLimpio]`. Garantiza que la salida siempre es un array (posiblemente vacío); nunca devuelve un valor crudo no-array. Requiere que `event.model.js` NO defina `default: []` para `talleres`. `obtenerPrecioTaller(workshop, ninos) → number`: `ninos > 15 ? (pricePlus > 0 ? pricePlus : priceBase) : priceBase`, con `priceBase`/`pricePlus` coercidos a número; devuelve 0 si `workshop` no es un objeto. El fallback legacy 25/30 € para un nombre no resuelto en el catálogo lo aplica el CONTROLADOR, porque 0 no significa "sin coste". `esGrupoGrande(ninos) → boolean`: `ninos > 15`. Sin efectos de lado. | `activity-sum-pricing/REQ-01` · `activity-sum-pricing/REQ-02` · `activity-sum-pricing/REQ-03` · `activity-data-migration/REQ-07` |
| `api/controllers/events.controllers.js` | Modify; valida la selección y calcula el precio autoritativo. | `validateEventData(data) → void`: lanza 400 si hay más de 3 actividades, duplicados, o actividad inexistente/inactiva en selección nueva o modificada. `calculateEventPrice(eventData, config) → number`: devuelve el total y escribe `detalles.extras.precioTallerApplied = Σ` como TOTAL de la selección. | `activity-sum-pricing/REQ-01` · `activity-sum-pricing/REQ-02` · `activity-sum-pricing/REQ-03` · `activity-sum-pricing/REQ-04` · `activity-sum-pricing/REQ-05` · `activity-sum-pricing/REQ-06` · `activity-sum-pricing/REQ-07` · `activity-validation/REQ-01` · `activity-validation/REQ-02` · `activity-validation/REQ-03` · `activity-validation/REQ-04` · `activity-validation/REQ-05` · `activity-validation/REQ-07` |
| `api/scripts/migrate-taller-to-array.js` | Create; CLI one-shot idempotente. | Entrada: `node scripts/migrate-taller-to-array.js [--dry-run]`. Salida por documento: `talleres` = `[taller]`, o `[]` si `taller` es `'ninguno'`/ausente; `$unset taller`; preserva `precioTallerApplied` si existe y hace backfill si falta; nunca escribe `precioTotal`; imprime estadísticas; una segunda ejecución es no-op. | `activity-data-migration/REQ-01` · `activity-data-migration/REQ-02` · `activity-data-migration/REQ-03` · `activity-data-migration/REQ-04` · `activity-data-migration/REQ-05` · `activity-data-migration/REQ-06` |
| `api/scripts/backup-before-migrate.js` | Reuse sin cambios; backup general de `events` + `config` antes de migrar. | Entrada: `node scripts/backup-before-migrate.js`. Salida: `api/scripts/backups/backup-YYYY-MM-DD-HHmmss.json` con los documentos íntegros, incluyendo `taller` y `precioTallerApplied` sin transformar. Es la vía autoritativa de rollback sin pérdida. | `activity-data-migration/REQ-01` |
| `api/scripts/analyze-stale-snapshots.js` | Modify; audita snapshots contra la suma de `talleres`. | Lee `detalles.extras.talleres` (y `taller` legacy) y compara `precioTallerApplied` con la Σ recalculada; imprime las reservas discrepantes. | `activity-data-migration/REQ-08` |
| `api/scripts/fix-stale-snapshots.js` | Modify; recalcula snapshots con la suma de `talleres`. | Reescribe `precioTallerApplied` (y `precioTotal`) de las reservas cuya selección cambió; respeta `--dry-run`. | `activity-data-migration/REQ-08` |
| `api/scripts/backup-affected.js` | Legacy; NO es el backup previo de esta migración. | Script one-off con 6 ids hardcodeados de una migración anterior. Solo se adapta el campo impreso (`taller` → `talleres`) para que no confunda; no se reutiliza como backup previo. | `activity-data-migration/REQ-08` |
| `api/config/mailer.config.js` | Modify; el email lista N actividades. | `tallerText(extras) → string`: "Sin actividad" con 0 seleccionadas, lista de N nombres con N ≥ 1; el bloque "Actividad" del email de confirmación pasa a lista + total. | `multi-activity-selection/REQ-08` |
| `api/services/google.service.js` | Modify; descripción y precio del evento en Google Calendar. | Descripción con los N nombres unidos y línea de precio "Actividad (Σ)". | `multi-activity-selection/REQ-08` |
| `web/src/utils/bookingUtils.js` | Modify; precio local en espejo del servidor. | `calculateBookingTotal(formData, prices, menus) → number`: suma `obtenerPrecioTaller` por cada actividad de `formData.extras.talleres`, con umbral `ninos > 15`. `validateBookingStep` sin cambios: el paso sigue siendo opcional. | `activity-sum-pricing/REQ-01` · `activity-sum-pricing/REQ-02` · `activity-sum-pricing/REQ-03` · `activity-sum-pricing/REQ-07` |
| `web/src/components/booking/Step5Workshops.jsx` | Modify; multi-select con límite y feedback. | `selectWorkshop(name)`: alterna añadir/quitar; si `talleres.length >= 3` muestra toast auto-dismissible y NO muta el estado. Render: chips de las seleccionadas, "Quitar todas" con ≥ 2, "Sin actividad" con 0. El modal ofrece AÑADIR o QUITAR según el estado actual. | `multi-activity-selection/REQ-01` · `multi-activity-selection/REQ-02` · `multi-activity-selection/REQ-03` · `multi-activity-selection/REQ-04` · `multi-activity-selection/REQ-05` |
| `web/src/pages/BookingPage.jsx` | Modify; estado y payload del wizard de reserva. | Init `formData.extras.talleres: []`; el payload envía `detalles.extras.talleres`; el guard de salida compara `talleres` contra el valor inicial. | `multi-activity-selection/REQ-07` |
| `web/src/pages/BudgetPage.jsx` | Modify; estado y payload del wizard de presupuesto. | Igual que `BookingPage.jsx`: comparten componentes y contrato de payload. | `multi-activity-selection/REQ-07` |
| `web/src/components/booking/Step8Summary.jsx` | Modify; resumen con N actividades. | Renderiza una fila por actividad y el total de actividades; el total de la reserva incluye esa Σ. | `multi-activity-selection/REQ-08` |
| `web/src/components/booking/StepBudgetSummary.jsx` | Modify; resumen con N actividades. | Igual que `Step8Summary.jsx` (clon funcional). | `multi-activity-selection/REQ-08` |
| `web/src/components/admin/ReservationDetailView.jsx` | Modify; lectura, desglose y edición multi. | Lectura: N actividades con `precioTallerApplied` (importe total). Lookup del catálogo por `w.name` (corrige el bug `w.nombre`). `ExtrasEdit`: picker multi con chips removibles que NO cierra al seleccionar, límite de 3 con aviso, y display de precio dinámico junto al snapshot histórico. | `multi-activity-selection/REQ-06` · `activity-validation/REQ-06` |
| `web/src/components/admin/ReservationDetailModal.jsx` | Modify; vista resumida con N actividades. | Muestra los N nombres y el total de actividades. | `multi-activity-selection/REQ-08` |
| `web/src/components/admin/DayDetailView.jsx` | Modify; creador de evento bloqueado. | Al crear: `extras: { talleres: [], personajes: [] }`, sin `taller` legacy. | `multi-activity-selection/REQ-07` |
| `web/src/components/admin/BlockDateModal.jsx` | Modify; creador de bloqueo de fecha. | Igual que `DayDetailView.jsx`. | `multi-activity-selection/REQ-07` |
| `web/src/pages/PricingPage.jsx` | Modify; copy de actividades múltiples. | Sección "Actividades": copy de N actividades, manteniendo los umbrales publicados "Hasta 15 niños / 16 o más". | `multi-activity-selection/REQ-08` · `activity-sum-pricing/REQ-02` |
| `api/tests/budget-flow.test.js` | Modify; pricing por suma, umbral y regresión de snapshot stale. | Cubre: 0/1/2/3 actividades con la Σ correcta; 15 niños → base y 16 → plus; PATCH que invalida con conjunto distinto, NO invalida con el mismo conjunto reordenado, y sobrescribe snapshot stale enviado por el cliente. | `activity-sum-pricing/REQ-01` · `activity-sum-pricing/REQ-02` · `activity-sum-pricing/REQ-03` · `activity-sum-pricing/REQ-04` · `activity-sum-pricing/REQ-05` · `activity-sum-pricing/REQ-06` · `activity-sum-pricing/REQ-07` |
| `api/tests/events.test.js` | Modify; límites, duplicados y catálogo. | Cubre: 4 actividades → 400; duplicados en `talleres` → 400; duplicados en `personajes` → 400; actividad inexistente o inactiva → 400 en selección nueva. | `activity-validation/REQ-01` · `activity-validation/REQ-02` · `activity-validation/REQ-03` · `activity-validation/REQ-04` · `activity-validation/REQ-07` |
| `web/src/utils/bookingUtils.test.js` | Modify; espejo web de la Σ y del umbral. | Cubre: fixtures con `talleres`; Σ de 0/1/2/3; 15 → base y 16 → plus (actualiza de forma deliberada el caso vigente con `>= 15`); `validateBookingStep` sin regresión. | `activity-sum-pricing/REQ-01` · `activity-sum-pricing/REQ-02` · `activity-sum-pricing/REQ-03` |
| `web/src/components/booking/Step5Workshops.test.jsx` | Create; primer test del componente. | Cubre: toggle añadir/quitar; toast en el cuarto intento sin mutar el estado; "Sin actividad" limpia el array; el modal ofrece AÑADIR o QUITAR. | `multi-activity-selection/REQ-01` · `multi-activity-selection/REQ-02` · `multi-activity-selection/REQ-04` · `multi-activity-selection/REQ-05` |

## Data Flow

```text
Participantes: Usuario | Step5 | API | Pricing | Event | Consumidores
Usuario -> Step5: AÑADIR/QUITAR (0..3)
Step5 -> API: payload extras.talleres
API -> API: validateEventData (límite, dedupe, catálogo activo)
API -> Pricing: calculateEventPrice + obtenerPrecioTaller
Pricing -> Event: precioTallerApplied=Σ; precioTotal recalculado
Event -> Consumidores: resumen/admin/mailer/Calendar (obtenerTalleres)
```

```text
Participantes: Cliente | PATCH pase 1 | Event merge | PATCH pase 2 | Pricing
Cliente -> PATCH pase 1: extras contiene talleres, incluido []
PATCH pase 1 -> PATCH pase 1: sort+JSON; si cambia, borrar snapshot
PATCH pase 1 -> Event merge: fusionar payload, incluso snapshot stale
Event merge -> PATCH pase 2: misma presencia y comparación
PATCH pase 2 -> Event merge: event.set(snapshot, undefined) si cambia
Event merge -> Pricing: recalcular Σ y precioTotal; reorden no invalida
```

```text
Participantes: Operador | Backup | Migrador | MongoDB
Operador -> Backup: ejecutar antes de toda escritura
Operador -> Migrador: normal o --dry-run
Migrador -> MongoDB: Event.find({}).lean()
Migrador -> MongoDB: X→[X]: preserva el snapshot existente o lo hace backfill si falta
Migrador -> MongoDB: ausente/ninguno→[] y $unset del snapshot huérfano de precioTallerApplied
Migrador -> MongoDB: $unset taller; nunca modifica precioTotal
Migrador -> Operador: estadísticas; talleres existente=skip (idempotente)
```

## Risks

| Riesgo | Mitigación |
|---|---|
| Facturación histórica | Backup, `.lean()`, dry-run, preservar el snapshot de las reservas con actividad válida (y hacer `$unset` del snapshot huérfano cuando la selección queda vacía), y no tocar `precioTotal`. |
| Snapshot stale | Presencia de campo y dos pases PATCH. |
| Legacy inactivo | Selección cambiada: 400; recálculo intacto: fallback + `console.warn`. |
| 15/16 divergente | Helpers por capa y pruebas de frontera. |

## Architecture Decisions

| Decisión | Elección y razón | Alternativa rechazada |
|---|---|---|
| Dominio | `Config.workshops[]`, no mezcla talleres públicos. | `Taller`. |
| Identidad | Nombres en array, sin dual-write. | IDs/campos duales. |
| Precio por actividad | El precio es la Σ de `obtenerPrecioTaller(actividad, niños)` por actividad, cada una con su `priceBase`/`pricePlus`. No hay pack ni descuento por volumen. | Packs o descuentos escalonados; obligarían a campos de precio nuevos en `Config`. |
| Snapshot de actividades | `precioTallerApplied` almacena el TOTAL de la selección (la Σ), no un precio unitario. Con una sola actividad el valor coincide con el histórico, así que no hay que renombrar el campo ni migrar importes ya persistidos; con N actividades es la suma. Se invalida solo cuando cambia el conjunto ordenado de nombres. | Snapshot unitario o array de precios por actividad: obligaría a renombrar el campo, migrar precios históricos y romper el contrato de los snapshots ya guardados. |
| Helpers | Uno por capa del monorepo. | Lógica por componente/paquete nuevo. |
| Umbral | `>15`, cierra bug frente a `>=15`. | Mantener outlier web. |
| Validación de selección | Límite de 3 en el schema Y check explícito en `validateEventData` (obligatorio: los update validators de Mongoose no cubren `$push`/`$addToSet` sobre el array), más dedupe de `talleres` y `personajes` → 400. | Solo validadores de update: no se disparan sobre el array. |
| Validación de catálogo | Actividad inexistente o inactiva → 400 SOLO cuando la selección es nueva o modificada. En un recálculo sin cambio de selección se aplica precio fallback + `console.warn`, para no bloquear la edición de reservas legacy cuyo nombre de actividad ya no está en el catálogo. | 400 siempre: bloquearía editar reservas legacy por un problema del catálogo y no de la reserva. Fallback silencioso: ocultaría la corrupción del catálogo. |
| Invalidación | Presencia + sort/JSON en dos pases. | Truthiness/un pase/orden UI. |
| Transición | Backup, migración idempotente, compat-read temporal. | Migración no repetible o compat-write. |
