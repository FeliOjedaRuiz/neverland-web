# Proposal: Multi-Actividades — Hasta 3 actividades por evento

## Intent

Hoy cada reserva permite una sola actividad del catálogo de booking (`detalles.extras.taller`, String). Los clientes quieren combinar hasta 3 actividades en una misma fiesta, espejando la feature `multi-personajes` ya mergeada (commit `60008b4`). El cambio migra el modelo String→Array, calcula el precio como suma de actividades, y corrige defectos preexistentes detectados en la exploración (umbral de grupo grande inconsistente, fallback silencioso de precio, ausencia de dedupe).

## Scope

### In Scope
- Modelo: `detalles.extras.taller` (String) → `detalles.extras.talleres` ([String], máx 3) + migración one-shot desde el campo legacy. Sin dual-write, sin ids.
- Precio: suma del precio de cada actividad (`priceBase`/`pricePlus` según nº de niños). Snapshot `precioTallerApplied` se reutiliza como importe TOTAL de la selección.
- Validaciones: límite 3 (validador de schema + check explícito), dedupe de `talleres` y `personajes` → 400, existencia + `active` en catálogo → 400 ante selección nueva/modificada.
- Umbral de grupo grande unificado en `> 15` (corrección de bug, ver Decisiones registradas).
- UX multi-select en `Step5Workshops.jsx` (espejo de `Step6Characters.jsx`): toggle, toast al 4º intento, chips, "Quitar todas".
- Colaterales: resúmenes de ambos wizards, vista/edición admin y pública (`/mi-reserva/:id`), mailer, Google Calendar, `PricingPage`.
- Tests backend y frontend, incluida regresión de snapshots stale en PATCH.

### Out of Scope
- NO toca los talleres públicos (colección `Taller`, con aforo/inscripciones, sin vínculo con `Event`).
- NO introduce packs de actividades ni descuentos escalonados.
- NO agrega campos de precio a `Config` (sin `precioPack3Actividades` ni similar).
- NO usa ids: la persistencia es un array de NOMBRES de actividad.
- Sin dual-write: el código nuevo solo escribe/lee `talleres`.

## Estado actual y gap

| Evidencia verificada (rama `feat/multi-actividades`) | Gap |
|---|---|
| `api/models/event.model.js:58-59` — `taller: String, default: 'ninguno'` + snapshot `precioTallerApplied` | Persistencia de 1 sola actividad |
| `api/controllers/events.controllers.js:162-178` — pricing actividad única; `isLargeGroup > 15` (168); fallback silencioso 25/30 € (174) | Sin suma de actividades; nombre desconocido cobra un precio que el cliente no eligió |
| `events.controllers.js:48` — check `personajes.length > 3` → 400 | Sin check equivalente para actividades y sin dedupe (el `seen` Set de 132-142 solo cubre catálogo de extras) |
| `web/src/components/booking/Step5Workshops.jsx:34-40,75` — `selectWorkshop` sobrescribe `extras.taller`; `isSelected` por igualdad única | Selector single-select |
| `Step5Workshops.jsx:77,172,195`, `Step8Summary.jsx:109`, `StepBudgetSummary.jsx:86`, `bookingUtils.js:58` + `bookingUtils.test.js:57` — umbral `>= 15` | Outlier defectuoso: a 15 niños el cliente ve plus pero el servidor cobra base (`api/tests/events.test.js:232-244`) |
| `web/src/pages/PricingPage.jsx:370-371` — "Hasta 15 niños / 16 o más"; `ConfigurationPanel.jsx:412-415` — labels "(≤15)/(>15)" | La política publicada y facturada es `> 15` |
| `events.controllers.js:523-535, 581-593` — invalidación de snapshots por JSON ordenado (patrón personajes) | El guard de taller (524/582) es truthiness: no cubre valores falsy; a espejar con presencia de campo |
| `ReservationDetailView.jsx:1229` — lookup `w.nombre ===` (el modelo es `name`) | Bug latente: el fallback de recálculo nunca matchea |

## Requisitos de alto nivel

1. Selección de hasta 3 actividades con orden de selección (no significativo para precio: suma conmutativa; comparación de invalidación por JSON ordenado, como personajes).
2. Precio = Σ `getWorkshopPrice(actividad, niños)` por elemento, con `isLargeGroup = niños > 15` y fallback `pricePlus > 0 ? pricePlus : priceBase` (heredado de `workshop-pricing-safety`), definido una sola vez por aplicación (`api/utils/pricing.js`, `web/src/utils/bookingUtils.js`).
3. `precioTallerApplied` = TOTAL de la selección (con 1 actividad coincide con el valor actual; con N es la suma). Sin renombrar ni migrar precios.
4. Validación estricta en selección nueva/modificada: cada nombre debe existir en `Config.workshops` y estar `active` → 400. En recálculo sin cambio de selección: fallback + `console.warn` (no bloquear reservas legacy).
5. Migración idempotente `api/scripts/migrate-taller-to-array.js` (precedente `migrate-personaje-to-array.js`): backup previo, `.lean()`, `'X'` → `['X']`, `'ninguno'`/ausente → `[]`, `$unset taller`, preservar snapshot existente y hacer backfill del ausente, `precioTotal` intocado.
6. Compat-read transitorio `getTalleres(extras)` (fallback `talleres ?? [taller]`) para la ventana deploy↔migración. Solo lectura.
7. UX espejo de `Step6Characters.jsx` en `Step5Workshops.jsx` (compartido por `BookingPage` y `BudgetPage`); init `extras.talleres: []` en ambos wizards y en los creadores de `DayDetailView`/`BlockDateModal`.
8. Colaterales listan N actividades: `mailer.config.js:98-102,206-209`, `google.service.js:118,168`, resúmenes, `ReservationDetailView` (lectura, desglose 1226-1250, subtotal 1078-1085, `ExtrasEdit` 2426-2527 con shim legacy `taller`→`talleres`), `PricingPage` copy multi.

## Capabilities

### New Capabilities
- `multi-activity-selection`: Multi-selección de hasta 3 actividades del catálogo de booking en el paso 4 del wizard. Toggle añadir/quitar, límite 3 con aviso, chips, "Quitar todas", sin ids.
- `activity-sum-pricing`: Precio por suma de actividades (`priceBase`/`pricePlus` por elemento), umbral unificado `> 15`, snapshot `precioTallerApplied` como total, invalidación por conjunto ordenado de nombres.
- `activity-validation`: Límite 3 (schema + check explícito), dedupe de `talleres` y `personajes` → 400, existencia + `active` en catálogo → 400 ante selección nueva/modificada.
- `activity-data-migration`: Script one-shot idempotente `taller` → `talleres`, con backup previo, preservación/backfill de snapshots y helper de compat-read `getTalleres`.

### Modified Capabilities
None — `openspec/specs/` no existe aún; no hay specs previos que modificar.

## Approach

Backend-first incremental (espejo de `multi-personajes`): modelo → validaciones/pricing → migración → colaterales backend → frontend wizards → admin/colaterales → tests. Cada componente verificable en aislamiento. El núcleo es `events.controllers.js` (pricing por suma + validaciones + invalidación de snapshots en los dos pases del PATCH); la UX insignia es `Step5Workshops.jsx`. Migración idempotente con backup previo y compat-read transitorio. Hechos Mongoose 7.8.8 (Context7 `/automattic/mongoose/7.8.8`): el validador de ruta array corre en `pre('save')` (el PATCH `set()+save()` lo dispara), pero los update validators no cubren `$push/$addToSet/$pull` sobre el array → el check explícito en `validateEventData` es obligatorio, no redundante.

## Decisiones registradas

| Decisión | Razón / evidencia |
|---|---|
| Alcance = catálogo `Config.workshops[]` del booking (paso 4, `Step5Workshops.jsx`) | Confirmado por producto. Los talleres públicos (`Taller`) no se tocan |
| Precio = suma de `priceBase`/`pricePlus` por actividad; sin pack ni descuentos | Confirmado por producto. Sin campos de precio nuevos en `Config` |
| Persistencia = array de nombres + migración desde `detalles.extras.taller`; sin ids ni dual-write | Confirmado por producto |
| Extras = corrección de defectos preexistentes incluida en la feature | Confirmado por producto |
| Umbral unificado en `> 15` | CORRECCIÓN DE BUG, no subida de precio. Evidencia unívoca: `events.test.js:232-244` fija 15→base; copy público "Hasta 15 niños / 16 o más" (`PricingPage.jsx:370-371`); labels admin "(≤15)/(>15)" (`ConfigurationPanel.jsx:412-415`); scripts de auditoría. El `>= 15` del flujo de booking es el outlier: hoy el cliente ve un precio que el servidor nunca cobra |
| Actividad inexistente al editar reserva legacy → 400 estricto SOLO ante selección nueva o modificada, con backfill de snapshots en la migración | Sin fallback silencioso (hoy `events.controllers.js:173-174` cobra 25/30 sin aviso). El backfill cierra el hueco legacy; el recálculo sin cambio de selección no bloquea |
| Campo `talleres` | Linaje `taller` → `talleres`, espejo exacto de `personaje` → `personajes` |
| `precioTallerApplied` reutilizado como TOTAL | Con 1 actividad = valor actual (continuidad histórica); con N = suma. Espejo de `precioPersonajeApplied`. Sin renombrar ni migrar precios |
| Orden de actividades NO significativo | Suma conmutativa; invalidación por JSON ordenado (patrón `events.controllers.js:531,589`) |
| Helper compat-read `getTalleres` | Ventana deploy↔migración sin regresión visible; solo lectura, retirable tras la migración |

## Affected Areas

| Area | Impact | Files |
|------|--------|-------|
| Modelos | Modified | `api/models/event.model.js` |
| Controladores | Modified | `api/controllers/events.controllers.js` |
| Servicios | Modified | `api/services/google.service.js`, `api/config/mailer.config.js` |
| Migración | New | `api/scripts/migrate-taller-to-array.js`; reutiliza `api/scripts/backup-before-migrate.js` |
| Scripts snapshots | Modified | `api/scripts/analyze-stale-snapshots.js`, `fix-stale-snapshots.js`, `backup-affected.js` |
| Estado frontend | Modified | `web/src/pages/BookingPage.jsx`, `web/src/pages/BudgetPage.jsx` (init + exit-guard `isDirty`) |
| Selector UX | Modified | `web/src/components/booking/Step5Workshops.jsx` (alta complejidad) |
| Resúmenes | Modified | `web/src/components/booking/Step8Summary.jsx`, `web/src/components/booking/StepBudgetSummary.jsx` |
| Admin | Modified | `web/src/components/admin/ReservationDetailView.jsx`, `ReservationDetailModal.jsx`, `DayDetailView.jsx`, `BlockDateModal.jsx` |
| Pricing/Utils | Modified | `web/src/pages/PricingPage.jsx`, `web/src/utils/bookingUtils.js` |
| Tests | Modified/New | `api/tests/budget-flow.test.js`, `api/tests/events.test.js`, `web/src/utils/bookingUtils.test.js`, `web/src/components/booking/Step8Summary.test.jsx`, nuevo `Step5Workshops.test.jsx` |

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| La migración corrompe reservas existentes (`'ninguno'`, snapshots seteados, campos ausentes) | Alta | Backup completo previo; `.lean()`; skip si ya migrado; snapshot existente jamás se reescribe; `precioTotal` intocado; dry-run con conteos; prueba de idempotencia (ejecutar dos veces) |
| Romper uno de los dos wizards o los creadores de `DayDetailView`/`BlockDateModal` | Alta | Componentes compartidos (un cambio cubre ambos wizards); checklist de sitios creadores; fixtures actualizadas; smoke manual de ambos flujos |
| Ventana deploy ↔ migración muestra "Sin actividad" en reservas legacy | Media | Helper `getTalleres` con fallback de lectura; migración en el mismo despliegue |
| Cambio de umbral modifica el precio visible a exactamente 15 niños | Media | Corrección de bug documentada; tests API ya fijan 15→base; actualizar el test web de forma deliberada |
| Renombre/baja de actividad deja nombres huérfanos en reservas | Media | Aceptado (nombres, sin ids); snapshots preservan el precio histórico; 400 solo ante selección nueva inválida |
| Regresión del snapshot stale en PATCH (bug `f509160`) para `talleres` | Media | Espejar los tests `budget-flow.test.js:469-545` para arrays; patrón de presencia de campo (no truthiness) |
| Superficie amplia (~20 archivos) supera el presupuesto de revisión (800 líneas) | Media | PRs encadenadas por work unit (ver Estrategia de entrega) |

## Rollback Plan

1. **Orden de despliegue**: (a) backup completo con `api/scripts/backup-before-migrate.js` → `api/scripts/backups/`; (b) deploy del código nuevo (incluye compat-read `getTalleres`); (c) ejecución de `migrate-taller-to-array.js`. La ventana deploy↔migración no degrada vistas gracias al fallback de lectura.
2. **Rollback pre-migración**: revertir el deploy. El campo `taller` sigue intacto (la migración no corrió) → cero pérdida de datos.
3. **Rollback post-migración**: restaurar el backup de `events` y revertir el deploy. Es la vía autoritativa sin pérdida de datos.
4. **Script reverso** (alternativa documentada): `talleres: ['X']` → `taller: 'X'`; `[]` → `'ninguno'`. Para selecciones de N>1 es lossy (conserva solo el primer elemento) — por eso la reversión autoritativa es el backup, no el script.
5. `precioTotal` histórico nunca se reescribe, ni en la ida ni en la vuelta.

## Dependencies

- Precedente `openspec/changes/multi-personajes/` (mergeado en `main`, commit `60008b4`) — patrón espejo de modelo, migración, UX y snapshots.
- `openspec/changes/fix-snapshot-pricing-update/` — patrón de invalidación de snapshots en PATCH que este cambio extiende a `talleres`.
- `openspec/changes/workshop-pricing-safety/` — fallback `pricePlus > 0 ? pricePlus : priceBase` que el pricing por suma debe conservar.
- Mongoose 7.8.8 (Context7): validadores en `pre('save')` sí corren en el PATCH actual; update validators no cubren operadores de array → check explícito obligatorio; `default: []` con campo ausente es válido.
- Sin dependencias externas nuevas (npm, APIs ni infraestructura).

## Estrategia de entrega (PRs encadenadas)

El alcance supera el presupuesto de revisión (800 líneas) → PRs encadenadas por work unit. Candidatos para `sdd-tasks`:

1. `wu-1-backend-modelo-pricing-migracion` — modelo, validaciones, pricing por suma, invalidación de snapshots, script de migración + backup.
2. `wu-2-frontend-wizards` — `Step5Workshops`, `bookingUtils`, `BookingPage`, `BudgetPage`, resúmenes de ambos wizards.
3. `wu-3-admin-colaterales` — `ReservationDetailView`/`Modal`, `DayDetailView`, `BlockDateModal`, `PricingPage`, mailer, Google Calendar, scripts de snapshots.
4. `wu-4-tests` — suites transversales: migración, regresión snapshot stale, nuevos tests de componentes.

Nota para `sdd-tasks`: si se prefiere co-locar tests con su slice (convención work-unit-commits), las unidades 1-3 absorben sus tests propios y `wu-4-tests` queda para las suites transversales.

## Success Criteria

- [ ] Verificación completa en verde: `cd api && npm test && cd ../web && npm run test:run` (+ `cd web && npm run build`)
- [ ] Booking y Budget: crear con 0/1/2/3 actividades → suma correcta de `priceBase`/`pricePlus`; 4ª selección → toast/400
- [ ] Umbral unificado: 15 niños → base; 16 → plus, en API y frontend (test web actualizado de forma deliberada)
- [ ] Nombre desconocido o inactivo en selección nueva → 400; duplicados en `talleres`/`personajes` → 400
- [ ] PATCH: cambiar el conjunto recalcula snapshot y `precioTotal`; mismo conjunto desordenado NO invalida; payload con snapshot stale es sobreescrito
- [ ] Migración: idempotente, preserva snapshots existentes, backfill de ausentes, `precioTotal` intacto, backup previo generado
- [ ] Mailer y Google Calendar listan N actividades con el total
- [ ] `/mi-reserva/:id` y admin muestran/editan N actividades preservando snapshots históricos
- [ ] Métricas de éxito: 0 regresiones de facturación en `events.test.js`/`budget-flow.test.js`; todos los sitios creadores migrados a `talleres: []`; a 15 niños el precio mostrado en booking = precio cobrado por el servidor (gap cerrado)

## Decisiones abiertas

Ninguna. Todas las decisiones de negocio están confirmadas o resueltas con evidencia del repo (ver Decisiones registradas). Los detalles restantes (copy exacto de avisos, textos de toast) se resuelven en spec/design sin consulta de negocio.
