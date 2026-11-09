# Proposal: Precios Confiables — El servidor como única fuente de verdad del precio de las reservas

## Intent

**Problema.** El servidor confía en los importes que envía el cliente al crear o editar una reserva: cualquiera puede hoy crear una reserva a 0 € o autoconcederse un descuento. Es la deuda de mass assignment registrada al archivar `multi-actividades` (`archive-report.md:172` — S-03; `verify-report.md:264`) y verificada fichero-línea en `exploration.md`:

| Vector | Punto de confianza | Impacto |
|---|---|---|
| `detalles.niños.precioApplied` | `events.controllers.js:129-141` (solo recalcula si falta) | Menú infantil al precio que diga el cliente |
| `detalles.adultos.comida[].precioUnitario` | `:160-162` | Cada ración de adulto a 0 € |
| `detalles.extras.precioTallerApplied` | `:223-247` | Total de actividades a voluntad del cliente |
| `detalles.extras.precioPersonajeApplied` | `:257-263` | Personajes a voluntad del cliente |
| `detalles.extras.precioPinataApplied` (ruta legacy) | `:270-278` | Piñata a voluntad del cliente |
| `horario.costoExtension` negativo (truthy, sin `min`) | `:288-294` | Extensión que resta del total |
| `detalles.extras.costoExtra` (sin `min`) | `:281-283` | Descuento autoconcedido (legítimo solo para admin) |
| `detalles.niños.menuId` sin validar | `:132-136` | Id desconocido → 0 € silencioso |
| `estado`, `tipo`, `publicId`, `invitationId`, `googleEventId`, `notasAdmin` | `:348-350` (spread del body) | Salto de cola, robo de id, ruptura de Google Calendar, ocupación de turnos |
| `precioTotal` en PATCH aislado | `:738-743` | `PATCH { precioTotal: 0 }` se persiste tal cual (deuda S-03) |

En PATCH, además, cuando la selección NO cambia el merge (`:668-672`) conserva la copia del **cliente** en vez de la del servidor.

**Objetivo.** Que el precio de una reserva nueva se calcule siempre en el servidor desde el catálogo y que el cliente no pueda escribir campos de precio ni de integridad; sin romper la regla de negocio de que una reserva ya cobrada conserva su precio histórico aunque el catálogo cambie después.

## Scope

### In Scope
- Whitelist de campos escribibles en el alta (`events.controllers.js:348-350`) y en la edición (`:736`): solo selecciones y datos de contacto/consentimiento; nunca importes.
- Recálculo desde catálogo en CREATE (ignorando snapshots del cliente) y preservación del snapshot del servidor en PATCH sin cambio de selección.
- Tratamiento por rol de `costoExtra` (descuento admin) y de los campos de identidad/estado (`estado`, `tipo`, `publicId`, `invitationId`, `googleEventId`, `notasAdmin`).
- Validación de `menuId` contra `Config.menusNiños` en CREATE → 400 si no resuelve (hoy: 0 € sin error).
- Protección de `precioTotal`: nunca persiste desde el cliente, ni en CREATE ni en PATCH (incluido el PATCH aislado).
- `min: 0` en `horario.costoExtension` (`event.model.js:108`); `costoExtra` conserva negativos (descuento de admin, `ReservationDetailView.jsx:1195`).
- Tests TDD rojo primero: reescritura de `budget-flow.test.js:948-998` (REQ-06) y nuevos tests de los criterios 1-8.

### Out of Scope
- Ruta legacy `taller` (ya resuelta con normalización en `api/utils/pricing.js:81-97`).
- Ventana de 72 h y ausencia de autoría del PATCH (`routes.config.js:43-59`): este change reduce el daño de precio, no la superficie de edición.
- Las 12 reservas con actividades retiradas: solo se protege su precio histórico; no se reparan aquí.
- Drift de ids del `Config` (`config.model.js:6`, `config.controllers.js:57-61`): change posterior. Aquí solo se valida `menuId` en el alta.
- Reescritura de las 4 specs de `multi-actividades` (`activity-*`, `multi-activity-selection`): quedan intactas.
- Mass assignment de otros endpoints (`config.update`, talleres, inscripciones, usuarios).

## Capabilities

### New Capabilities
- `server-price-authority`: los importes (`precioApplied`, `precioUnitario`, `precioTallerApplied`, `precioPersonajeApplied`, `precioPinataApplied`, `costoExtension`, `precioTotal`) son server-owned. Whitelist de entrada; recálculo desde catálogo en CREATE; preservación del snapshot almacenado en PATCH sin cambio de selección y recálculo con cambio; `precioTotal` recalculado siempre. Las respuestas siguen devolviendo los snapshots (display).
- `role-based-event-fields`: `costoExtra` solo es escribible con JWT admin (anónimo: ignorado); `estado`, `tipo`, `publicId`, `invitationId`, `googleEventId`, `notasAdmin` no son escribibles por clientes no admin. `tipo: 'bloqueo'` y fijación de `estado` siguen funcionando para admin.
- `menu-id-validation`: el `menuId` del alta debe resolverse en `Config.menusNiños`; si no resuelve → 400 en lugar de cobrar 0 €.

### Modified Capabilities
None. Las 4 specs de `multi-actividades` se conservan sin cambios: este change añade la capa de confianza de entrada, no altera el algoritmo de cálculo ni la UX de selección.

## Approach

**Whitelist de campos (c) + recálculo desde catálogo con preservación del snapshot del servidor (a)** — combinación recomendada por la exploración:

1. **CREATE**: el servidor ignora cualquier importe del payload y calcula todo desde `Config`, escribiendo los snapshots como precio histórico. El cliente solo expresa selecciones (`menuId`, `talleres`, `personajes`, `catalogoItemIds`, `pinata`, `extensionMinutos`, cantidades).
2. **PATCH**: con cambio de selección se invalida el snapshot y se recalcula con el catálogo actual (comportamiento actual, correcto). Sin cambio de selección se conserva el snapshot **almacenado en el servidor**, ignorando el del payload. `precioTotal` se recalcula siempre, también en el PATCH aislado.
3. **Rol**: `costoExtra`, `tipo` y campos de identidad solo se aceptan con JWT admin.

**Alternativa descartada — 400 por discrepancia entre el importe del cliente y el recalculado** (opción `b`): el front legítimo sí envía importes calculados en el navegador (`BookingPage.jsx:353`, `BudgetPage.jsx:421`, `Step4Adults.jsx:110-125`) desde una PWA con config potencialmente cacheada (`registerType: 'prompt'`). Convertir la deriva de cache en 400 produciría falsos rechazos en el submit del embudo y chocaría con la preservación histórica (un edit inocuo con catálogo cambiado dispararía el error). Se acepta que el importe definitivo sea el del servidor. Contención: las respuestas siguen devolviendo los snapshots para display; solo se filtra la entrada. El front puede dejar de enviar importes (limpieza), pero la garantía no depende de él.

## Affected Areas

| Area | Impact | Files |
|------|--------|-------|
| Núcleo de precios | Modified | `api/controllers/events.controllers.js` — whitelist en `create` (`:348-350`) y `update` (`:736`), preservación del snapshot del servidor, recálculo de `precioTotal`, validación de `menuId`, regla de rol |
| Modelo | Modified | `api/models/event.model.js` — `min: 0` en `horario.costoExtension` (`:108`); `costoExtra` sin `min` (negativo = descuento admin) |
| Rutas | Contexto | `api/config/routes.config.js:38, 43-59` — POST público y PATCH con auth opcional (no se modifican) |
| Payload front | Modified | `web/src/pages/BookingPage.jsx:335-385`, `BudgetPage.jsx:403-456`, `web/src/components/booking/Step4Adults.jsx:110-125` — dejan de enviar importes (limpieza; el servidor los ignora igualmente) |
| Displays | Unchanged | `Step8Summary.jsx:205-207`, `StepBudgetSummary.jsx:196-198` siguen leyendo snapshots de la respuesta |
| Admin | Unchanged (verificación) | `ReservationDetailView.jsx:1554, 2388, 2906-2912` (ya strippea snapshots y envía `costoExtra` solo admin); `BlockDateModal.jsx:53-54`, `DayDetailView.jsx:101-132` (bloqueos admin) |
| Tests | Modified/New | `api/tests/budget-flow.test.js` (REQ-06 `:948-998` reescrito; `:1013-1051` en verde), nuevos tests CREATE/PATCH/rol; front `Step5Workshops.test.jsx`, `bookingUtils.test.js`, `Step8Summary.test.js` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| El preview del wizard difiere del precio cobrado si la PWA tiene config cacheada | Med | La respuesta 201 devuelve el `precioTotal` real del servidor; log/métrica de divergencia sin bloquear (aviso visible: pregunta abierta 4) |
| La whitelist sin regla de rol rompe el descuento legítimo de admin (`costoExtra`) | Med | Regla por rol (JWT admin) + test específico de descuento y de negativos |
| Restringir `tipo` rompe la creación admin de bloqueos por la ruta pública | Med | `tipo: 'bloqueo'` permitido solo con JWT admin (`BlockDateModal.jsx:53-54`, `DayDetailView.jsx:101-132`) + test |
| `budget-flow.test.js:948-998` (REQ-06) codifica la confianza a corregir | Alta | Reescritura deliberada: el PATCH conserva el snapshot almacenado; el fixture 99 deja de ser comportamiento esperado |
| Repricar reservas legacy (12 con actividad retirada, fallback 25/30 €) | Media | El PATCH sin cambio de selección NO recalcula: preserva el snapshot del servidor; el fix no fuerza recálculos |
| Displays que leen snapshots dejan de funcionar si se filtra la salida | Media | Solo se filtra la entrada; las respuestas siguen incluyendo los snapshots |

Nota residual: el PATCH anónimo con id conocido sigue abierto (>72 h) — fuera de alcance, pero el daño de precio queda acotado.

## Rollback Plan

1. **Sin migración de datos ni cambios de schema destructivos**: los campos de snapshot conservan su forma. El rollback autoritativo es revertir el commit/deploy; el código anterior lee sin problema los documentos escritos con el código nuevo y viceversa.
2. **Reservas creadas con el código nuevo**: sus snapshots ya los calculó el servidor = precio histórico válido. Un eventual revert no las reprecia (el código antiguo también preserva snapshots existentes).
3. **Si la validación 400 de `menuId` generara falsos positivos** por el drift de ids de `Config`: rollback parcial acotado — degradar esa validación a warning (commit independiente en tasks), sin revertir la whitelist ni el recálculo.
4. **Si se detectaran reservas a precio incorrecto tras el deploy**: script de auditoría que recalcule desde el catálogo y compare con `precioTotal` persistido para acotar la ventana afectada; reparación selectiva solo con aprobación de producto; nunca reprecio masivo automático.
5. **Reservas ya creadas con snapshots manipulados (pre-fix): se respetan como históricos.** Justificación: sin evidencia externa no hay forma no ambigua de distinguir un snapshot manipulado de uno legítimo, y el reprecio retroactivo rompería la regla central («una reserva ya cobrada conserva su precio») y podría perjudicar a clientes correctos. Acción complementaria: auditoría dry-run (base existente: `api/scripts/analyze-stale-snapshots.js`) para cuantificar el universo; la reparación de casos confirmados (p. ej. reservas a 0 €) queda como decisión de producto (Pregunta abierta 2).
6. `precioTotal` histórico nunca se reescribe, ni en la ida ni en la vuelta.

## Dependencies

- Deuda heredada de `openspec/changes/archive/2026-11-08-multi-actividades/` (S-03; recomendación de whitelist en `verify-report.md:264`).
- `openspec/changes/fix-snapshot-pricing-update/` — patrón de invalidación de snapshots que este change extiende preservando la copia del servidor.
- `openspec/changes/workshop-pricing-safety/` — fallback `pricePlus > 0 ? pricePlus : priceBase` que el recálculo debe conservar.
- Sin dependencias nuevas (npm, APIs ni infraestructura).

## Success Criteria

- [ ] Suite completa en verde con TDD rojo primero: `cd api && npm test && cd ../web && npm run test:run`.
- [ ] CREATE con snapshots spoofeados (`precioApplied: 0`, `precioTallerApplied: 0`, `precioPersonajeApplied: 0`, `precioUnitario: 0`, `precioPinataApplied`, `costoExtension` negativa, `precioTotal` del cliente) → `precioTotal` y snapshots persistidos coinciden con el catálogo del servidor (criterio 1).
- [ ] PATCH sin cambio de selección con snapshot spoofed en el payload → se conserva el snapshot almacenado (criterio 2; reescritura de REQ-06).
- [ ] PATCH con cambio de selección → recálculo desde el catálogo actual (tests `budget-flow.test.js:1013-1051` y `:474-510` en verde) (criterio 3).
- [ ] `PATCH { precioTotal: 0 }` aislado → el servidor recalcula desde `detalles` almacenados (criterio 4; cierra S-03).
- [ ] `costoExtra` anónimo ignorado y admin sigue aplicando descuentos (criterio 5); `estado`/`publicId`/`invitationId`/`googleEventId`/`notasAdmin` no persisten desde el cliente; `tipo: 'bloqueo'` anónimo → 400 y admin → OK (criterio 6).
- [ ] Reserva legacy con snapshot histórico + edit inocuo → precio intacto, incluidas las 12 con actividad retirada (criterio 7).
- [ ] CREATE con `menuId` inexistente → 400 (criterio 8; hoy 0 € silencioso).
- [ ] Front en verde (`Step5Workshops.test.jsx`, `bookingUtils.test.js`, `Step8Summary.test.js`); los displays siguen mostrando snapshots.
- [ ] Métrica de éxito: 0 de los payloads hostiles de test altera el importe persistido; verificación manual con API local replicando los vectores de la tabla del Intent.

## Preguntas abiertas (decisión de producto para sdd-spec)

1. **Campos prohibidos para clientes no admin** (`costoExtra`, `tipo`, identidad): ¿ignorar silenciosamente (recomendado: no filtra información ni rompe el flujo) o responder 400/403 explícito?
2. **Reservas ya creadas con snapshots manipulados** que la auditoría dry-run identifique (p. ej. importes 0 €): el default decidido es respetar el histórico; ¿se aprueba reparación selectiva de los casos confirmados como explotados?
3. **`estado` en el alta**: ¿forzar `pendiente` para clientes y permitir al admin fijarlo (recomendado) o forzar `pendiente` también para admin?
4. **Divergencia preview vs cobro** (config cacheada en la PWA): ¿solo log/métrica (recomendado) o aviso visible en el paso de confirmación con el importe definitivo del servidor?
