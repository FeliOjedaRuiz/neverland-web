# Tasks: Multi-Actividades — Hasta 3 actividades por evento

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~3.268 reales acumuladas (`additions + deletions`; estimación original 1.500–1.900) |
| 800-line budget risk | **High** a nivel de cambio completo; **Low** por PR tras el corte real (máx. 760 por PR) |
| 400-line budget risk | **High** |
| Chained PRs recommended | **Yes** |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 → PR 5a → PR 5b → PR 5c → PR 6 → PR 7 (feature-branch-chain) + TASK-08 manual |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

```text
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High
```

Ramas: tracker `feat/multi-actividades` (única que mergea a `main`; PR draft/no-merge hasta cerrar la cadena). Las ramas slice usan nombres sibling `feat/multi-actividades-wu-N-<slug>` porque Git no permite una rama hija `feat/multi-actividades/...` cuando ya existe la rama tracker con ese prefijo. PR #1 base = tracker; PR #k base = rama del PR #(k-1). Si un diff hijo muestra cambios de PRs anteriores, retarget/rebase hasta que el diff sea limpio.

## Estado de implementación y ajuste real de PRs

- [x] TASK-01: helpers de precio y compat-read (`feat/multi-actividades-wu-1-helpers-pricing`, 200 líneas revisables).
- [x] TASK-02: modelo y validaciones (`feat/multi-actividades-wu-2-modelo-validaciones`, 256 líneas revisables).
- [x] TASK-03: pricing/snapshots/PATCH (`feat/multi-actividades-wu-3-pricing-snapshots`, 474 líneas revisables).
- [x] TASK-04: migración legacy (`feat/multi-actividades-wu-4-script-migracion`, 324 líneas revisables).
- [x] TASK-05a: helpers/precio web (`feat/multi-actividades-wu-5a-precio`, 308 líneas revisables).
- [x] TASK-05b: selector, estado de los dos wizards y componentes de resumen (`feat/multi-actividades-wu-5b-selector-wizards`, 760 líneas revisables).
- [x] TASK-05c: cobertura de ambos resúmenes (`feat/multi-actividades-wu-5c-summary-tests`, 124 líneas revisables).
- [x] TASK-06: admin y colaterales (`feat/multi-actividades-wu-6-admin-colaterales`, 529 líneas revisables).
- [x] TASK-07: suites transversales y gate de verificación final.

- [ ] TASK-08: despliegue controlado y ejecución manual de migración.

TASK-05 se subdividió después de implementar porque el candidato real alcanzó 1.065 líneas, por encima del presupuesto de 800. Los tres PRs encadenados anteriores sustituyen el único PR-5 inicialmente estimado; cada uno está por debajo del límite. La suma real acumulada de los nueve slices es ~3.268 líneas, con máximo de 760 por PR.

### Suggested Work Units

| Unit | Goal | Base (feature-branch-chain) | Likely PR | Focused test command | Runtime harness | Rollback boundary | Lines |
|------|------|----------------------------|-----------|----------------------|-----------------|-------------------|-------|
| 1 | Helpers de precio y compat-read | `feat/multi-actividades` | PR 1 | `cd api && npx jest tests/pricing.test.js` | N/A — helpers puros sin I/O; los unit tests son la evidencia | Borrar `api/utils/pricing.js` + `api/tests/pricing.test.js` (aún sin consumidores) | 200 |
| 2 | Modelo `talleres` + validaciones | rama PR 1 | PR 2 | `cd api && npx jest tests/events.test.js` | `POST /api/events` local con 4 actividades o con duplicados → 400 | Revert de `event.model.js` + bloque de validación + `tests/events.test.js` | 256 |
| 3 | Pricing por suma + snapshots + PATCH | rama PR 2 | PR 3 | `cd api && npx jest tests/budget-flow.test.js` | Crear evento con 2 actividades vía API local: `precioTallerApplied` = Σ y `precioTotal` recalculado; PATCH reordenado no invalida | Revert del bloque de pricing/invalidación + `tests/budget-flow.test.js` | 474 |
| 4 | Script de migración (MANUAL) | rama PR 3 | PR 4 | N/A automático (decisión: migración sin test automático) | Entorno controlado: `node api/scripts/migrate-taller-to-array.js --dry-run` → ejecución → segunda ejecución = 0 transformaciones | Borrar `api/scripts/migrate-taller-to-array.js` (sin consumidores) | 324 |
| 5a | Helpers y precio web | rama PR 4 | PR 5a | `cd web && npm run test:run -- src/utils/bookingUtils.test.js` | Mantiene precio legacy mientras se encadena el nuevo selector | Revert de `bookingUtils.js` y su test | 308 |
| 5b | Selector multi, estado/payload de ambos wizards y componentes summary | rama PR 5a | PR 5b | `cd web && npm run test:run -- src/components/booking/Step5Workshops.test.jsx` | Booking y Budget comparten selector, envían `talleres[]` y muestran actividades en el resumen | Revert de selector, ambos wizards y componentes summary | 760 |
| 5c | Cobertura de ambos resúmenes | rama PR 5b | PR 5c | `cd web && npm run test:run -- src/components/booking/Step8Summary.test.jsx src/components/booking/StepBudgetSummary.test.jsx` | Total y subtotal extras coherentes en ambos resúmenes | Borrar/retirar los tests summary de la slice | 124 |
| 6 | Admin y colaterales | rama PR 5c | PR 6 | `cd web && npm run test:run` (sin suite admin propia) | Admin: editar reserva legacy → shim muestra chip; `/mi-reserva/:id`; email y evento Calendar con N actividades | Revert de `ReservationDetailView.jsx`, `ReservationDetailModal.jsx`, `DayDetailView.jsx`, `BlockDateModal.jsx`, `PricingPage.jsx`, mailer, `google.service.js`, scripts de snapshots | 529 |
| 7 | Suites transversales + gate | rama PR 6 | PR 7 | `cd api && npm test && cd ../web && npm run test:run && cd web && npm run build` | Matriz de smoke transversal (ambos wizards, admin, pública, mailer, Calendar, Safari/iOS) | Borrar los tres tests transversales y el fix REQ-04 | 293 |

TDD (`openspec/config.yaml` `apply: tdd: true`): cada task de código lleva sus tests en el MISMO work unit (RED→GREEN→commit único verificable). Toda cita de requisito es cualificada (`<capacidad>/REQ-NN`).

---

## Fase 1: Backend

### TASK-01: Backend — helpers de precio y compat-read (`api/utils/pricing.js`)
- **Alcance**: crear `api/utils/pricing.js` con helpers puros, sin efectos de lado: `obtenerTalleres(extras)` → si `extras.talleres` es un array se devuelve tal cual; en otro caso se evalúa `extras.taller`, se normaliza con `trim().toLowerCase()` y, si no es `'ninguno'` ni vacío, se devuelve `[valorLimpio]`; garantiza `string[]`. `obtenerPrecioTaller(workshop, ninos)` → `ninos > 15 ? (pricePlus > 0 ? pricePlus : priceBase) : priceBase`, con `priceBase`/`pricePlus` coercidos a número; devuelve 0 si `workshop` no es un objeto. `esGrupoGrande(ninos)` → `ninos > 15`. Crear `api/tests/pricing.test.js`. Sin cablear consumidores todavía.
- **Dependencias**: ninguna (primer eslabón de la cadena).
- **Verificación** (TDD): `cd api && npx jest tests/pricing.test.js` en verde + suite completa `cd api && npm test` sin regresiones.
- **Requisitos**: `activity-sum-pricing/REQ-02` · `activity-sum-pricing/REQ-03` · `activity-data-migration/REQ-07`.
- **Escenarios (9)**: `activity-data-migration` "Documento ya migrado", "Documento legacy con taller válido", "Documento legacy con 'ninguno'", "Documento legacy sin taller", "talleres existe y taller también (post-parcial)"; `activity-sum-pricing` "Exactamente 15 niños — precio base", "16 niños — precio plus", "Actividad sin pricePlus en grupo grande", "Actividad con pricePlus válido en grupo grande" (compartidos con TASK-03/TASK-05).

### [x] TASK-02: Backend — modelo `talleres` y validaciones de selección
- **Alcance**: `api/models/event.model.js` — añadir `talleres: { type: [String], default: [], validate: length <= 3 }` en `detalles.extras`; conservar `precioTallerApplied` (semántica de TOTAL de la selección); mantener `taller` como ruta String **deprecated, de solo lectura y sin default** (detalle de implementación de la decisión de compat-read: sin esta ruta, la hidratación de Mongoose oculta el `taller` legacy y el fallback de `obtenerTalleres` no puede cumplir la ventana deploy↔migración; se retira en TASK-08). `api/controllers/events.controllers.js` `validateEventData()`: check explícito `talleres.length > 3` → 400 (obligatorio además del validador de schema), dedupe `talleres` → 400 "Actividad duplicada: {nombre}", dedupe `personajes` → 400 "Personaje duplicado: {nombre}", y validación de catálogo (`Config.workshops[]` con `active: true`) → 400 "Actividad no válida o inactiva: {nombre}" en selección nueva o modificada. Ampliar `api/tests/events.test.js`.
- **Dependencias**: TASK-01 (helpers presentes para pasos posteriores; la validación estricta es directa).
- **Verificación** (TDD): `cd api && npx jest tests/events.test.js` en verde + `cd api && npm test` sin regresiones (los fixtures legacy `taller` siguen en verde vía compat-read).
- **Requisitos**: `activity-validation/REQ-01` · `activity-validation/REQ-02` · `activity-validation/REQ-03` · `activity-validation/REQ-04` · `activity-validation/REQ-07` · `activity-data-migration/REQ-04` (sin dual-write: el código nuevo no escribe `taller`).
- **Escenarios (11)**: "Exactamente 3 actividades — válido", "4 actividades — rechazo 400", "Array vacío — válido", "Actividad duplicada en talleres", "Sin duplicados — válido", "Personaje duplicado en personajes", "Sin duplicados en personajes — válido", "Nombre inexistente en catálogo", "Nombre existente pero inactivo", "Todas las actividades válidas y activas", "Validador explícito cubre caso no cubierto por schema".

### TASK-03: Backend — pricing por suma, snapshot total e invalidación PATCH
- **Alcance**: `api/controllers/events.controllers.js` — `calculateEventPrice()` tarifica como Σ de `obtenerPrecioTaller(actividad, niños)` sobre `obtenerTalleres(extras)` (0 actividades → 0; 1 → valor legacy idéntico); escribe `precioTallerApplied` = TOTAL de la selección (ausente/`$unset` con 0 actividades); `precioTotal` se recomputa incluyendo esa Σ; nombre no resuelto en recálculo sin cambio de selección → precio fallback histórico 25/30 € + `console.warn` (sin 400), porque `obtenerPrecioTaller` devuelve 0 para un workshop desconocido y 0 no significa "sin coste". Invalidación de snapshot en los DOS pases PATCH (~523-535 y ~581-593): guard por **presencia de campo** (`'talleres' in extras`, no truthiness) + comparación de conjuntos por arrays ordenados + `JSON.stringify` (patrón personajes); el snapshot stale enviado por el cliente se sobrescribe. Ampliar `api/tests/budget-flow.test.js` (fixtures `taller` → `talleres` donde el guard cambia).
- **Dependencias**: TASK-01 (helpers), TASK-02 (modelo `talleres` y validaciones activas).
- **Verificación** (TDD): `cd api && npx jest tests/budget-flow.test.js` en verde + `cd api && npm test` sin regresiones (`events.test.js:232-244` mantiene 15 → base).
- **Requisitos**: `activity-sum-pricing/REQ-01` · `activity-sum-pricing/REQ-02` · `activity-sum-pricing/REQ-03` · `activity-sum-pricing/REQ-04` · `activity-sum-pricing/REQ-05` · `activity-sum-pricing/REQ-06` · `activity-sum-pricing/REQ-07` · `activity-validation/REQ-05`.
- **Escenarios (20)**: `activity-sum-pricing` "Suma con múltiples actividades (grupo normal)", "Suma con 3 actividades (grupo grande)", "Una sola actividad (compatibilidad legacy)", "Sin actividades", "Exactamente 15 niños — precio base", "16 niños — precio plus", "Actividad sin pricePlus en grupo grande", "Actividad con pricePlus válido en grupo grande", "Snapshot con 2 actividades", "Snapshot con 1 actividad (compatibilidad)", "Sin actividades — sin snapshot", "Cambio de conjunto — invalidación", "Mismo conjunto reordenado — sin invalidación", "Snapshot stale en payload — sobreescritura", "Array vacío dispara invalidación", "Campo ausente no dispara invalidación", "precioTotal incluye suma de actividades", "Cambio de actividades recalcula precioTotal"; `activity-validation` "Recálculo con actividad legacy inexistente", "Recálculo con selección modificada y actividad inválida".

### [x] TASK-04: Backend — script de migración `api/scripts/migrate-taller-to-array.js` [MANUAL]
- **Alcance**: crear `api/scripts/migrate-taller-to-array.js` siguiendo el precedente `migrate-personaje-to-array.js`: invoca `api/scripts/backup-before-migrate.js` (REUSE, sin cambios) antes de cualquier escritura; lee con `Event.find({}).lean()`; reglas de transformación (`extras.talleres` presente → skip idempotente; `extras` ausente → skip; `taller: 'X'` → `['X']` preservando snapshot existente y con backfill del ausente por la fórmula actual; `'ninguno'`/`''`/`null`/`undefined` → `[]` + `$unset precioTallerApplied`); `$unset taller` en todo documento procesado; **nunca** toca `precioTotal`; valida unicidad por seguridad; `--dry-run` con estadísticas (total, a migrar, skip, vacíos, válidos, snapshot existente, snapshot a backfill) sin escrituras. **Verificación MANUAL: no forma parte de ningún test automático.**
- **Dependencias**: TASK-01 (fórmula de backfill vía `obtenerPrecioTaller`), TASK-02 (contrato del modelo `talleres`).
- **Verificación** (MANUAL, entorno controlado con copia de datos): `node api/scripts/migrate-taller-to-array.js --dry-run` con conteos esperados → ejecución real → segunda ejecución reporta 0 transformaciones; spot-check de una regla por caso y de `precioTotal` intacto.
- **Requisitos**: `activity-data-migration/REQ-01` · `activity-data-migration/REQ-02` · `activity-data-migration/REQ-03` · `activity-data-migration/REQ-04` · `activity-data-migration/REQ-05` · `activity-data-migration/REQ-06`.
- **Escenarios (17; la ejecución real se cierra en TASK-08)**: "Ejecución normal con documentos legacy", "Ejecución idempotente (segunda vez)", "Backup generado antes de cualquier escritura", "Campo ausente detectado correctamente con lean", "Sin lean — comportamiento incorrecto (contraste)", "Actividad válida — transformación a array", "Actividad válida sin snapshot — backfill", "Taller 'ninguno' — array vacío", "Taller null — array vacío", "Taller undefined (campo ausente) — array vacío", "Extras ausente — skip", "Ya migrado — skip idempotente", "Campo legacy eliminado", "Sin escritura dual post-migración", "precioTotal preservado tras migración", "Dry-run reporta estadísticas", "Dry-run no modifica base de datos".

---

## Fase 2: Frontend

### TASK-05: Frontend — wizards de reserva y presupuesto (multi-select + precio + resúmenes)
- **Alcance**: `web/src/utils/bookingUtils.js` — `calculateBookingTotal` suma `obtenerPrecioTaller` por cada elemento de `formData.extras.talleres` con umbral `> 15` (espejo del servidor; fuente única web del helper de precio). `web/src/components/booking/Step5Workshops.jsx` — multi-select espejo de `Step6Characters.jsx`: toggle AÑADIR/QUITAR en modal y toggle desde card, toast auto-dismissible "El máximo es 3 actividades" al 4º intento sin mutar estado, chips de las seleccionadas, "Quitar todas" (≥2) / "Sin actividad" (0), precio dinámico = Σ, filtro de catálogo alineado con `active`. `web/src/pages/BookingPage.jsx` y `BudgetPage.jsx` — init `extras.talleres: []` y exit-guard `isDirty` en forma array. `web/src/components/booking/Step8Summary.jsx` y `StepBudgetSummary.jsx` — N filas/chips con total. Tests co-locados: `bookingUtils.test.js` (fixtures `talleres`, Σ 0/1/2/3, umbral 15→base / 16→plus actualizado de forma deliberada), nuevo `Step5Workshops.test.jsx`, `Step8Summary.test.jsx` (fixtures migrados).
- **Dependencias**: TASK-02 (contrato `talleres`), TASK-03 (semántica de suma y umbral autoritativos).
- **Verificación** (TDD): `cd web && npm run test:run -- src/utils/bookingUtils.test.js src/components/booking/Step5Workshops.test.jsx src/components/booking/Step8Summary.test.jsx` en verde + `cd web && npm run test:run` completo sin regresiones.
- **Requisitos**: `multi-activity-selection/REQ-01` · `multi-activity-selection/REQ-02` · `multi-activity-selection/REQ-03` · `multi-activity-selection/REQ-04` · `multi-activity-selection/REQ-05` · `multi-activity-selection/REQ-07` (BookingPage/BudgetPage) · `multi-activity-selection/REQ-08` (resúmenes) · `activity-sum-pricing/REQ-01` · `activity-sum-pricing/REQ-02` · `activity-sum-pricing/REQ-03` · `activity-sum-pricing/REQ-07` (espejo web).
- **Escenarios (19)**: `multi-activity-selection` "Primera actividad seleccionada", "Segunda actividad añadida", "Toggle para quitar desde modal", "Toggle para quitar desde card", "Bloqueo de 4ª actividad", "Transiciones de precio con selección", "Precio con grupo grande", "Limpiar selección múltiple", "Con una sola actividad seleccionada", "Chips reflejan selección", "Chip desaparece al quitar", "Nuevo booking inicializa talleres vacío", "Resumen de booking muestra múltiples actividades", "Sin actividades seleccionadas" (compartido con TASK-06); `activity-sum-pricing` "Exactamente 15 niños — precio base", "16 niños — precio plus", "Frontend y backend consistentes a 15 niños", "Actividad sin pricePlus en grupo grande", "Actividad con pricePlus válido en grupo grande" (compartidos con TASK-01/TASK-03).

---

## Fase 3: Admin y colaterales

### [x] TASK-06: Admin y colaterales — edición admin, vistas, mailer, Calendar y scripts de snapshots
- **Alcance**: `web/src/components/admin/ReservationDetailView.jsx` — lectura de N actividades con `precioTallerApplied` como importe total (conserva subtotal 1078-1085 y desglose 1226-1250), corrección del lookup `w.nombre` → `w.name` (~1229), y `ExtrasEdit` multi con chips removibles que NO cierra el picker al seleccionar, límite 3 con aviso, precio dinámico junto al snapshot histórico, y shim legacy `taller` → `talleres` para reservas pre-migración. `web/src/components/admin/ReservationDetailModal.jsx` — lista de N nombres + total. `web/src/components/admin/DayDetailView.jsx` (ambos sitios creadores) y `BlockDateModal.jsx` — init `extras: { talleres: [], personajes: [] }` sin `taller` legacy. `web/src/pages/PricingPage.jsx` — copy multi-actividad manteniendo los umbrales publicados "Hasta 15 niños / 16 o más". `api/config/mailer.config.js` — `tallerText(extras)`: "Sin actividad" con 0; lista de N nombres con total. `api/services/google.service.js` — descripción con N nombres y línea de precio "Actividad (Σ)". `api/scripts/analyze-stale-snapshots.js` y `fix-stale-snapshots.js` — leer `talleres` (array) y comparar/recalcular con la Σ; `api/scripts/backup-affected.js` (legacy one-off) — solo adaptar el campo impreso.
- **Dependencias**: TASK-02 (contrato `talleres` + reglas de validación), TASK-03 (semántica de snapshot TOTAL), TASK-01 (`obtenerTalleres` para consumidores backend).
- **Verificación**: `cd web && npm run test:run` y `cd api && npm test` sin regresiones + `cd web && npm run build`; harness manual: editar reserva legacy (`taller` sin `talleres`) en admin → el shim muestra el chip; `/mi-reserva/:id` público lista N actividades; email de confirmación y evento de Google con N actividades; `node api/scripts/analyze-stale-snapshots.js` reporta el caso sembrado y `fix-stale-snapshots.js --dry-run` lo corrige con la Σ.
- **Requisitos**: `multi-activity-selection/REQ-06` · `multi-activity-selection/REQ-07` (DayDetailView/BlockDateModal) · `multi-activity-selection/REQ-08` (mailer, Calendar, PricingPage, vistas) · `activity-validation/REQ-06` · `activity-data-migration/REQ-08` · `activity-data-migration/REQ-04` (sin dual-write en escrituras admin).
- **Escenarios (10)**: `multi-activity-selection` "Admin añade y quita via chips", "Admin con reserva legacy pre-migración", "Nuevo bloqueo de fecha", "Email de confirmación lista actividades", "Google Calendar incluye actividades", "Sin actividades seleccionadas" (compartido con TASK-05); `activity-validation` "Lookup correcto con campo name", "Bug corregido — antes no encontraba"; `activity-data-migration` "Análisis de snapshots con talleres", "Fix de snapshots con talleres".

---

## Fase 4: Tests transversales

### TASK-07: Suites transversales y gate de verificación final
- **Alcance**: suite transversal web que no pertenece a un solo slice: test de componente compartido (`Step5Workshops` renderizado en contexto BookingPage y BudgetPage sin bifurcación, edge case de `multi-activity-selection`), y aserción de consistencia cross-layer del umbral 15→base / 16→plus (frontend mostrado = backend cobrado). Cierre del gate: suite completa, build y auditoría de cobertura contra specs y diseño.
- **Dependencias**: TASK-05 (wizards), TASK-06 (admin/colaterales).
- **Verificación**: `cd api && npm test && cd ../web && npm run test:run && cd web && npm run build` en verde; matriz de smoke manual: ambos wizards con 0/1/2/3 actividades, admin edición preservando snapshots, `/mi-reserva/:id`, mailer y Calendar con N actividades, Safari/iOS.
- **Requisitos**: `multi-activity-selection/REQ-07` (componente compartido) · `multi-activity-selection/REQ-08` (gate de colaterales) · `activity-sum-pricing/REQ-02` (consistencia cross-layer).
- **Escenarios**: gate sobre "Frontend y backend consistentes a 15 niños" y edge "Componente compartido por BookingPage y BudgetPage"; no añade escenarios nuevos de spec (cuenta global intacta en 77).

---

## Fase 5: Despliegue (MANUAL)

### TASK-08: Despliegue controlado y ejecución de la migración [MANUAL]
- **Alcance** (operación en entorno controlado; NO es test automático): orden de despliegue obligatorio —
  1. **Backup**: `node api/scripts/backup-before-migrate.js` → verificar `api/scripts/backups/backup-YYYY-MM-DD-HHmmss.json` con `events` + `config` íntegros (incluye `taller` y `precioTallerApplied` sin transformar). Es la vía autoritativa de rollback.
  2. **Deploy del código con compat-read** (cadena PR 1–PR 9 mergeada en el tracker → `main`): la ventana deploy↔migración queda cubierta por `obtenerTalleres` (solo lectura).
  3. **Ejecutar la migración**: `node api/scripts/migrate-taller-to-array.js --dry-run` → revisar estadísticas → ejecución real → segunda ejecución debe reportar 0 transformaciones (idempotencia) → spot-checks (actividades legacy visibles en admin y `/mi-reserva/:id`, snapshots preservados/backfill, `precioTotal` intacto).
- **Post-verificación**: mailer y Google Calendar listan N actividades; reservas legacy no muestran "Sin actividad"; rollback = restaurar backup de `events` + revertir deploy (el script reverso es lossy para N>1, solo documentado). Follow-up: retirar la ruta `taller` deprecated del schema y el fallback de `obtenerTalleres` tras confirmar la migración.
- **Dependencias**: TASK-01 … TASK-07 (toda la cadena mergeada) y el backup previo del paso 1.
- **Verificación** (MANUAL): checklist del orden 1→2→3 ejecutado y firmado; idempotencia confirmada; conteos del dry-run = conteos reales.
- **Requisitos**: `activity-data-migration/REQ-01` (backup + ejecución) · `activity-data-migration/REQ-04` (campo legacy eliminado) · `activity-data-migration/REQ-05` (`precioTotal` intocado) · `activity-data-migration/REQ-06` (dry-run).
- **Escenarios**: la ejecución real cierra los 3 de `activity-data-migration/REQ-01` ("Ejecución normal con documentos legacy", "Ejecución idempotente (segunda vez)", "Backup generado antes de cualquier escritura"), más "Campo legacy eliminado", "precioTotal preservado tras migración", "Dry-run reporta estadísticas" y "Dry-run no modifica base de datos".

---

## Coverage Verification (auditoría)

| Capacidad | Requisitos | Escenarios | Atribución a tasks |
|-----------|-----------|-----------|--------------------|
| `multi-activity-selection` | 8 (REQ-01…REQ-08) | 19 | TASK-05 (14) · TASK-06 (5: REQ-06 ×2, REQ-07 ×1, REQ-08 ×2) |
| `activity-sum-pricing` | 7 (REQ-01…REQ-07) | 19 | TASK-03 (18) · TASK-01 (4 compartidos) · TASK-05 (5 compartidos) · TASK-07 gate ("Frontend y backend consistentes a 15 niños") |
| `activity-validation` | 7 (REQ-01…REQ-07) | 15 | TASK-02 (11) · TASK-03 (2: REQ-05) · TASK-06 (2: REQ-06) |
| `activity-data-migration` | 8 (REQ-01…REQ-08) | 24 | TASK-04 (17) · TASK-01 (5: REQ-07) · TASK-06 (2: REQ-08) · TASK-08 (ejecución real de REQ-01/04/05/06) |
| **Total** | **30** | **77** (19+19+15+24) | Todo escenario cubierto por ≥1 task; los compartidos se listan en cada task |

**Componentes del diseño (25/25)**: `api/models/event.model.js` → TASK-02 · `api/utils/pricing.js` → TASK-01 · `api/controllers/events.controllers.js` → TASK-02 + TASK-03 · `api/scripts/migrate-taller-to-array.js` → TASK-04 · `api/scripts/backup-before-migrate.js` → TASK-04 + TASK-08 (REUSE sin cambios) · `api/scripts/analyze-stale-snapshots.js`, `fix-stale-snapshots.js`, `backup-affected.js` → TASK-06 · `api/config/mailer.config.js` → TASK-06 · `api/services/google.service.js` → TASK-06 · `web/src/utils/bookingUtils.js` → TASK-05 · `web/src/components/booking/Step5Workshops.jsx` → TASK-05 · `web/src/pages/BookingPage.jsx`, `BudgetPage.jsx` → TASK-05 · `web/src/components/booking/Step8Summary.jsx`, `StepBudgetSummary.jsx` → TASK-05 · `web/src/components/admin/ReservationDetailView.jsx`, `ReservationDetailModal.jsx`, `DayDetailView.jsx`, `BlockDateModal.jsx` → TASK-06 · `web/src/pages/PricingPage.jsx` → TASK-06 · `api/tests/budget-flow.test.js` → TASK-03 · `api/tests/events.test.js` → TASK-02 · `web/src/utils/bookingUtils.test.js` → TASK-05 · `web/src/components/booking/Step5Workshops.test.jsx` → TASK-05. Nuevos ficheros adicionales: `api/tests/pricing.test.js` (TASK-01) y la suite transversal (TASK-07).

**Threat matrix del diseño → test RED previo (TDD)**: Facturación histórica → TASK-04/TASK-08 (backup, `.lean()`, dry-run, snapshot preservado, `precioTotal` intocado) · Snapshot stale → TASK-03 (sobrescritura del stale + guard por presencia de campo) · Legacy inactivo → TASK-02/TASK-03 (400 en selección modificada; fallback + `console.warn` en recálculo) · 15/16 divergente → TASK-01/TASK-03/TASK-05 (frontera 15→base / 16→plus en ambas capas).



