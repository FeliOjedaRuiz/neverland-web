```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:01bcc0a91a9925bb2fa7d4dc9c74e0b5592aed1037772a8dfe0bb0eae1dbbdc3
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 30/30
scenarios: 78/78
test_command: cd api && npm test && cd ../web && npm run test:run
test_exit_code: 0
test_output_hash: sha256:59eddfe60d18172f4c08f4763d807509e7b0d38d5ac89ee2cab914296a9e6b83
build_command: cd web && npm run build
build_exit_code: 0
build_output_hash: sha256:45c6143eb2757640a0cfb448bee10a09fa62ff50a20f8a9d8ec76bf554a73e8e
```

## Verification Report (RE-VERIFICACIÓN)

**Change**: multi-actividades
**Version**: N/A (openspec/specs aún no existe; las 4 specs son delta specs nuevas)
**Mode**: Standard (`openspec/config.yaml` `apply.tdd: true`; el orquestador no declaró STRICT TDD MODE ni existe runner strict, por lo que no se cargó el módulo strict-tdd-verify)
**Repo HEAD verificado**: `main` = `e82f0be` (`Merge pull request #19`) — idéntico al de la verificación anterior; el diff del working tree es EXCLUSIVAMENTE documental (`specs/multi-activity-selection/spec.md`, `specs/activity-validation/spec.md`, `tasks.md`, `apply-progress.md` + este informe). Ningún byte de código de aplicación cambió desde la verificación anterior.
**Naturaleza de esta ejecución**: RE-VERIFICACIÓN tras la corrección de la deriva de spec que motivó el FAIL anterior (W-01, bloqueante del archivo; W-02 y W-07, no bloqueantes). Las tres puertas de ejecución se re-ejecutaron completas; las citas de código se re-comprobaron sobre el árbol actual.
**evidence_revision**: sha256 de la concatenación de las salidas completas de test (api+web) y build capturadas en esta ejecución.

### Correcciones documentales verificadas en esta re-verificación

| # | Corrección | Verificación | Estado |
|---|-----------|--------------|--------|
| W-01 | Escenario "Con una sola actividad seleccionada" de `multi-activity-selection/REQ-04`: THEN reescrito a «el botón muestra "Quitar actividad" (ni "Quitar todas" ni "Sin actividad"), y al pulsarlo limpia el array» | Coherente con `Step5Workshops.jsx:113-114` (`etiquetaEliminar = length === 1 ? 'Quitar actividad' : 'Quitar todas'`), `:135` (onClick = `clearAllWorkshops` → `talleres: []`), `:150-165` (tarjeta "Sin actividad" no interactiva, `aria-disabled`, solo con 0). Fijado por tests pasados en esta ejecución: `Step5Workshops.test.jsx:71` (etiqueta con 1), `:54` (card con 1 → `[]`), `:147-163` (modal QUITAR → `[]`), `:80`/`:211` (mismo handler con ≥2 → `[]`), `:251` (0 → no interactivo). El MUST del requisito (≥2 → "Quitar todas"; al pulsar vacía a `[]` y revierte a "Sin actividad"; precio desaparece) permanece intacto y cumplido | ✅ RESUELTO |
| W-02 | Edge case "Nombre con espacios extra o case distinto" de `activity-validation`: actualizado a «Comparación normalizada (trim + minúsculas) en ambos lados» | Coherente con el código real: `normalizarNombreActividad` (`api/utils/pricing.js:88`) y `resolverWorkshop` (`:102-109`, normaliza ambos lados); uso en deduplicación (`events.controllers.js:63-64`), detección de selección modificada (`:75-79`), resolución de catálogo (`:87,:230`) y los dos pases de invalidación (`:606-607,:671-672`); espejo web `bookingUtils.js:48-55`. Regresiones D-01 pasadas en esta ejecución: `events.test.js:655` (PATCH con nombre de catálogo con espacio final → 200) y `:710` (duplicado por espacios/mayúsculas → 400) | ✅ RESUELTO |
| W-07 | Tabla "Coverage Verification" de `tasks.md` corregida a 25 escenarios de `activity-data-migration` y total **78** (19+19+15+25); nota aclaratoria añadida en `apply-progress.md` | Recuento autoritativo re-ejecutado (`grep -c '^#### Scenario:'`): multi-activity-selection 19, activity-sum-pricing 19, activity-validation 15, activity-data-migration 25 → **78**. La tabla de `tasks.md:145-146` y la nota de `tasks.md:119` ahora coinciden con las specs; la atribución TASK-01 (6: REQ-07) también fue corregida | ✅ RESUELTO |
| Nota | Escenario "talleres vacío explícito gana al legacy" (`activity-data-migration/REQ-07`), omitido en la auditoría de TASK-07 | Implementado (`pricing.js:29-31`, semántica de presencia + `event.model.js:62-71` `default: undefined`) y testeado: `pricing.test.js:40-43` (`{ talleres: [], taller: 'Cocina' }` → `[]`), pasado en esta ejecución | ✅ CONFIRMADO |

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 10 (TASK-01, 02, 03, 04, 05a, 05b, 05c, 06, 07, 08) |
| Tasks complete | 10 |
| Tasks incomplete | 0 |

### Build & Tests Execution

**Build**: ✅ Passed
```text
cd web && npm run build  → exit 0
vite v7.3.1 — ✓ 67 modules transformed (cliente) + service worker sw.mjs 19.61 kB
PWA v1.2.0 injectManifest — precache 9 entries (1151.93 KiB) — dist/sw.js generado
build_output_hash: sha256:45c6143eb2757640a0cfb448bee10a09fa62ff50a20f8a9d8ec76bf554a73e8e
```

**Tests**: ✅ 297 passed / ❌ 0 failed / ⚠️ 0 skipped
```text
cd api && npm test && cd ../web && npm run test:run  → exit 0
API (Jest + Supertest + mongodb-memory-server): Test Suites: 5 passed, 5 total — Tests: 159 passed, 159 total
  Suites: pricing.test.js, events.test.js, budget-flow.test.js, mailer.test.js, talleres.test.js
WEB (Vitest + Testing Library): Test Files 14 passed (14) — Tests 138 passed (138)
  Incluye: bookingUtils.test.js (51), Step5Workshops.test.jsx (18), Step8Summary.test.jsx (12),
  StepBudgetSummary.test.jsx (3), CrossWizardWorkshops.test.jsx (3), CrossSummaryConsistency.test.jsx (3),
  crossLayerPricing.test.js (5)
test_output_hash: sha256:59eddfe60d18172f4c08f4763d807509e7b0d38d5ac89ee2cab914296a9e6b83
```

**Coverage**: ➖ No disponible (umbral configurado en `openspec/config.yaml`: `coverage_threshold: 0`; no se exige métrica de cobertura)

Nota de recuentos: el conteo autoritativo se tomó de las specs reales (`grep -c '^#### Scenario:'`): multi-activity-selection 8 REQ/19 SCN, activity-sum-pricing 7/19, activity-validation 7/15, activity-data-migration 8/25. Total real: **30 requisitos / 78 escenarios**, ahora coincidente con la tabla de auditoría de `tasks.md` (W-07 resuelto).

### Spec Compliance Matrix

Estados: ✅ COMPLIANT (test automatizado pasado en esta ejecución) · ⚠️ PARTIAL (evidencia automatizada parcial/indirecta, o evidencia runtime manual documentada en apply-progress para tareas designadas [MANUAL] en tasks.md) · ❌ FAILING/UNTESTED (ninguno).

#### multi-activity-selection (8 REQ / 19 escenarios)

| Requirement | Scenario | Test / Evidencia | Result |
|-------------|----------|------|--------|
| REQ-01 Toggle | Primera actividad seleccionada | `Step5Workshops.test.jsx > debería abrir el modal y añadir una actividad desde el botón AÑADIR` (:118) y `> debería añadir una actividad al pulsar una card` (:41); impl. `Step5Workshops.jsx:73-100,345-361` | ✅ COMPLIANT |
| REQ-01 Toggle | Segunda actividad añadida | Cobertura conjunta: `:41/:118` (append desde estado previo) + `:97/:108` (estado resultante con 2 actividades); impl. `Step5Workshops.jsx:88` (`[...current, name]`) | ✅ COMPLIANT |
| REQ-01 Toggle | Toggle para quitar desde modal | `Step5Workshops.test.jsx > debería mostrar QUITAR en el modal cuando la actividad ya está seleccionada` (:134) y `> debería quitar una actividad desde el botón QUITAR del modal` (:147); impl. `Step5Workshops.jsx:350-354` | ✅ COMPLIANT |
| REQ-01 Toggle | Toggle para quitar desde card | `Step5Workshops.test.jsx > debería quitar una actividad seleccionada al pulsar su card` (:54) + `> la tarjeta "Sin actividad" no debe ser interactiva` (:251); impl. `Step5Workshops.jsx:78-80,150-166` | ✅ COMPLIANT |
| REQ-02 Máximo 3 | Bloqueo de 4ª actividad | `Step5Workshops.test.jsx > debería bloquear la 4ª actividad y mostrar toast sin mutar el estado` (:180) y `> debería renderizar el toast con posición fixed, role="alert"` (:261); impl. `Step5Workshops.jsx:83-87` (bloqueo+toast), `:42-53` (auto-cierre 3000 ms). El auto-descarte a los 3 s no se aserta en tests (solo impl. + QA manual TASK-08 local) | ⚠️ PARTIAL |
| REQ-03 Precio dinámico | Transiciones de precio con selección | `Step5Workshops.test.jsx > debería mostrar el precio dinámico como suma` (:108, 2 act. = 40€) + `bookingUtils.test.js > debería sumar el precio de 2/3 actividades` (:296,:308); impl. `Step5Workshops.jsx:115-120,170-188` | ✅ COMPLIANT |
| REQ-03 Precio dinámico | Precio con grupo grande | `bookingUtils.test.js > debería sumar pricePlus para grupo grande` (:97) y `> sumar 3 actividades con grupo grande` (:308); impl. `bookingUtils.js:6,8-16,46-65` | ✅ COMPLIANT |
| REQ-04 Quitar todas | Limpiar selección múltiple | `Step5Workshops.test.jsx > debería limpiar todas las actividades al pulsar "Quitar todas"` (:80) y `> al activar la card "Quitar todas"` (:211); impl. `Step5Workshops.jsx:102-114` | ✅ COMPLIANT |
| REQ-04 Quitar todas | Con una sola actividad seleccionada | **Spec corregida (W-01 resuelto)**: el THEN literal exige ahora "Quitar actividad" con 1 selección y limpieza del array al pulsar. Tests pasados en esta ejecución: `Step5Workshops.test.jsx:71` (etiqueta "Quitar actividad" con 1 seleccionada) + cobertura conjunta de limpieza: `:54` (card con 1 → `talleres: []`), `:147-163` (modal QUITAR con 1 → `[]`), `:80/:211` (mismo handler `clearAllWorkshops` con ≥2 → `[]`); tarjeta "Sin actividad" con 0 no interactiva `:251`. Impl. `Step5Workshops.jsx:113-114,135,150-166`. Texto literal del escenario y MUST del requisito conformes | ✅ COMPLIANT |
| REQ-05 Chips | Chips reflejan selección | `Step5Workshops.test.jsx > debería mostrar chips con las actividades seleccionadas` (:97); impl. `Step5Workshops.jsx:173-182` | ✅ COMPLIANT |
| REQ-05 Chips | Chip desaparece al quitar | Cobertura conjunta: `:54/:147/:180` (actualización de estado al quitar) + `:97` (chips derivados del estado); impl. `Step5Workshops.jsx:173-182` | ✅ COMPLIANT |
| REQ-06 Admin edit | Admin añade y quita via chips | Sin test automatizado (tasks.md TASK-06 designa harness manual). Impl. `ReservationDetailView.jsx:2522-2554` (chips removibles con "x"), `:2565-2620` (picker inline que NO cierra al seleccionar; límite 3 con toast `:2582-2584`; precio por actividad PR #18 `:2570,2607-2611`). Evidencia runtime manual: QA en navegador local y producción (apply-progress TASK-08 y PR #18) | ⚠️ PARTIAL (ver W-05) |
| REQ-06 Admin edit | Admin con reserva legacy pre-migración | Sin test automatizado. Impl. shim `ReservationDetailView.jsx:2410-2413` (`obtenerTalleres` con fallback legacy). Evidencia manual: harness TASK-06 ("editar reserva legacy → el shim muestra el chip") + verificación producción | ⚠️ PARTIAL (ver W-05) |
| REQ-07 Inicialización | Nuevo booking inicializa talleres vacío | `CrossWizardWorkshops.test.jsx > BookingPage renderiza Step5Workshops con extras.talleres como array vacío` (:38) y variante BudgetPage (:59) y contrato de props (:80); impl. `BookingPage.jsx:94-103`, `BudgetPage.jsx:94-103` | ✅ COMPLIANT |
| REQ-07 Inicialización | Nuevo bloqueo de fecha | Sin test automatizado. Impl. `BlockDateModal.jsx:61` (`talleres: []`), `DayDetailView.jsx:109,138` (`extras: { talleres: [], personajes: [] }`) — verificado por inspección; grep confirma ausencia de `taller` legacy en ambos creadores | ⚠️ PARTIAL (ver W-05) |
| REQ-08 Colaterales | Resumen de booking muestra múltiples actividades | `CrossSummaryConsistency.test.jsx > ambos resúmenes muestran el mismo importe de actividades` (:59, 2 actividades + 40€ en ambos resúmenes) + `Step8Summary.test.jsx:67,:216` + `StepBudgetSummary.test.jsx:58,:68`; impl. `Step8Summary.jsx:21,105-140`, `StepBudgetSummary.jsx:21,80-115` | ✅ COMPLIANT |
| REQ-08 Colaterales | Email de confirmación lista actividades | `mailer.test.js > lista varias actividades con el total de la selección` (:24) y `> lista una actividad y conserva el total del snapshot` (:17); impl. `mailer.config.js:11-22,120-121` | ✅ COMPLIANT |
| REQ-08 Colaterales | Google Calendar incluye actividades | Sin test automatizado (`google.service` está mockeado en las suites API: `budget-flow.test.js:7`, `events.test.js:8`). Impl. `google.service.js:119-122` (línea "Actividad (Σ) = total€") y `:173` (descripción con N nombres). Evidencia manual: harness TASK-06 y QA producción | ⚠️ PARTIAL (ver W-05) |
| REQ-08 Colaterales | Sin actividades seleccionadas | `mailer.test.js > devuelve "Sin actividad" cuando no hay actividades` (:4) y `> para talleres vacíos explícitos` (:11) + `Step5Workshops.test.jsx:35,:251`; impl. resúmenes ocultan el bloque y no aplican recargo (`Step8Summary.jsx:105`); `/mi-reserva/:id` muestra "Sin actividad" (`ReservationDetailView.jsx:1002-1004`) | ✅ COMPLIANT |

#### activity-sum-pricing (7 REQ / 19 escenarios)

| Requirement | Scenario | Test / Evidencia | Result |
|-------------|----------|------|--------|
| REQ-01 Suma | Suma con múltiples actividades (grupo normal) | `budget-flow.test.js > Debería sumar precios de 2 actividades` (:598, snapshot 45 = 25+20); impl. `events.controllers.js:221-252` | ✅ COMPLIANT |
| REQ-01 Suma | Suma con 3 actividades (grupo grande) | `budget-flow.test.js > Debería sumar precios de 3 actividades en grupo grande` (:609, snapshot 83 = 30+25+28) | ✅ COMPLIANT |
| REQ-01 Suma | Una sola actividad (compatibilidad legacy) | `budget-flow.test.js > Debería calcular el mismo precio legacy con 1 actividad` (:587, 25) y `> Debería preservar el precio legacy al editar una reserva antigua con campo taller` (:892) | ✅ COMPLIANT |
| REQ-01 Suma | Sin actividades | `budget-flow.test.js > Debería calcular 0€ y no snapshotear precioTallerApplied con 0 actividades` (:576); impl. `events.controllers.js:250-252` (`delete`) | ✅ COMPLIANT |
| REQ-02 Umbral >15 | Exactamente 15 niños — precio base | `budget-flow.test.js:633` + `events.test.js > Debería aplicar tallerBase (no plus) si hay exactamente 15 niños` (:232) + `bookingUtils.test.js:221` + `pricing.test.js:99`; impl. `pricing.js:49`, `bookingUtils.js:6` | ✅ COMPLIANT |
| REQ-02 Umbral >15 | 16 niños — precio plus | `budget-flow.test.js:642` + `bookingUtils.test.js:236` + `pricing.test.js:104` | ✅ COMPLIANT |
| REQ-02 Umbral >15 | Frontend y backend consistentes a 15 niños | `crossLayerPricing.test.js > ambas capas coinciden en esGrupoGrande: false a 15 y true a 16` (:27) y `:35`; grep global: ningún `>= 15` residual en `web/src` (re-verificado en esta ejecución) | ✅ COMPLIANT |
| REQ-03 Fallback | Actividad sin pricePlus en grupo grande | `budget-flow.test.js:651` + `pricing.test.js:109` + `bookingUtils.test.js:65,:248,:266` + `crossLayerPricing.test.js:53`; impl. `pricing.js:72-74` | ✅ COMPLIANT |
| REQ-03 Fallback | Actividad con pricePlus válido en grupo grande | `pricing.test.js:114` + `bookingUtils.test.js:61` + `crossLayerPricing.test.js:44`; edge "priceBase 0 resuelto NO aplica fallback": `budget-flow.test.js:672` | ✅ COMPLIANT |
| REQ-04 Snapshot TOTAL | Snapshot con 2 actividades | `budget-flow.test.js:598` (`precioTallerApplied = 45` = Σ) y `:718` (Σ 45 tras PATCH); impl. `events.controllers.js:246` | ✅ COMPLIANT |
| REQ-04 Snapshot TOTAL | Snapshot con 1 actividad (compatibilidad) | `budget-flow.test.js:587` (25, idéntico al legacy) y `events.test.js:686-707` (D-01: 20+20=40) | ✅ COMPLIANT |
| REQ-04 Snapshot TOTAL | Sin actividades — sin snapshot | `budget-flow.test.js:576` (undefined en create) y `:749` (eliminado al vaciar); impl. `events.controllers.js:251` (`delete`) y `:674` (`event.set(..., undefined)`) | ✅ COMPLIANT |
| REQ-05 Invalidación ordenada | Cambio de conjunto — invalidación | `budget-flow.test.js > Debería invalidar snapshot al cambiar el conjunto de actividades` (:693, 25→45); impl. `events.controllers.js:605-612,670-677` (comparación NORMALIZADA, D-01) | ✅ COMPLIANT |
| REQ-05 Invalidación ordenada | Mismo conjunto reordenado — sin invalidación | `budget-flow.test.js > NO debería invalidar snapshot si el conjunto es igual en orden distinto` (:722); impl. sort+JSON `events.controllers.js:606-608,671-673` | ✅ COMPLIANT |
| REQ-05 Invalidación ordenada | Snapshot stale en payload — sobreescritura | `budget-flow.test.js > Debería sobrescribir snapshot stale enviado por el cliente` (:777, stale 25 → recalculado 20) y `:501-510` (regresión bug f509160) | ✅ COMPLIANT |
| REQ-06 Guard por presencia | Array vacío dispara invalidación | `budget-flow.test.js > Debería recalcular precioTotal al remover taller (selección vacía)` (:513-547, `talleres: []` → snapshot eliminado) y `:749`; impl. `'talleres' in newDetalles.extras` `events.controllers.js:605,670` | ✅ COMPLIANT |
| REQ-06 Guard por presencia | Campo ausente no dispara invalidación | Evidencia estática sólida (guard por presencia `events.controllers.js:605,670`); `budget-flow.test.js:892` y `events.test.js:599` hacen PATCH sin `talleres` y pasan, pero NO son discriminantes (el snapshot se recalcula al mismo valor; no distinguen "no invalidado" de "invalidado y recalculado"). Falta test con snapshot previo distinto del recálculo | ⚠️ PARTIAL (ver W-03) |
| REQ-07 precioTotal | precioTotal incluye suma de actividades | `budget-flow.test.js > Debería incluir la suma de actividades en precioTotal` (:882, 270 = 225+45); impl. `events.controllers.js:249,721-726` | ✅ COMPLIANT |
| REQ-07 precioTotal | Cambio de actividades recalcula precioTotal | `budget-flow.test.js:474-510` (Magia→Pintura: total −5€) y `:513-547` (quitar taller: total −25€) | ✅ COMPLIANT |

#### activity-validation (7 REQ / 15 escenarios)

| Requirement | Scenario | Test / Evidencia | Result |
|-------------|----------|------|--------|
| REQ-01 Límite 3 | Exactamente 3 actividades — válido | `events.test.js > Debería aceptar exactamente 3 actividades válidas` (:510) | ✅ COMPLIANT |
| REQ-01 Límite 3 | 4 actividades — rechazo 400 | `events.test.js > Debería rechazar 4 actividades con 400` (:518, mensaje "Máximo 3 actividades permitidas"); impl. schema `event.model.js:72-75` + check explícito `events.controllers.js:56` | ✅ COMPLIANT |
| REQ-01 Límite 3 | Array vacío — válido | `events.test.js > Debería aceptar un array vacío de actividades` (:526) | ✅ COMPLIANT |
| REQ-02 Dedupe talleres | Actividad duplicada en talleres | `events.test.js > Debería rechazar actividades duplicadas en talleres` (:534, "Actividad duplicada: {nombre}") + D-01 `:710` (duplicado por espacios/mayúsculas, coherente con el edge case corregido W-02); impl. `events.controllers.js:58-66` (clave normalizada) | ✅ COMPLIANT |
| REQ-02 Dedupe talleres | Sin duplicados — válido | `events.test.js > Debería aceptar actividades sin duplicados` (:542) | ✅ COMPLIANT |
| REQ-03 Dedupe personajes | Personaje duplicado en personajes | `events.test.js > Debería rechazar personajes duplicados` (:550, "Personaje duplicado: {nombre}"); impl. `events.controllers.js:96-103` | ✅ COMPLIANT |
| REQ-03 Dedupe personajes | Sin duplicados en personajes — válido | `events.test.js > Debería aceptar personajes sin duplicados` (:558) | ✅ COMPLIANT |
| REQ-04 Catálogo | Nombre inexistente en catálogo | `events.test.js > Debería rechazar actividad inexistente en el catálogo` (:565, "Actividad no válida o inactiva: ActividadFantasma") | ✅ COMPLIANT |
| REQ-04 Catálogo | Nombre existente pero inactivo | `events.test.js > Debería rechazar actividad existente pero inactiva` (:573); impl. `events.controllers.js:81-92` (`resolverWorkshop` + `active`/`suspended`) | ✅ COMPLIANT |
| REQ-04 Catálogo | Todas las actividades válidas y activas | `events.test.js > Debería aceptar todas las actividades válidas y activas` (:581) + D-01 `:655` (PATCH con nombre de catálogo con espacio final → 200, coherente con el edge case corregido W-02) | ✅ COMPLIANT |
| REQ-05 Recálculo legacy | Recálculo con actividad legacy inexistente | `budget-flow.test.js > Debería aplicar fallback y emitir warning para actividad legacy no resoluble sin devolver 400` (:804, snapshot 25 + `console.warn`) + `events.test.js:599` (editar legacy sin `talleres` → 200); impl. `events.controllers.js:232-240` | ✅ COMPLIANT |
| REQ-05 Recálculo legacy | Recálculo con selección modificada y actividad inválida | Sin test con la combinación exacta (PATCH que MODIFICA la selección a un nombre inválido → 400). Cubierto por ramas: POST selección nueva inválida → 400 (`events.test.js:565,:573`) y PATCH con selección modificada válida → pasa validación (`:655`, prueba que `seleccionModificada` se computa en PATCH vía `previousEventData`, `events.controllers.js:75-92,709`) | ⚠️ PARTIAL (ver W-04) |
| REQ-06 Lookup w.name | Lookup correcto con campo name | Sin test automatizado (componente admin sin suite). Impl. verificada por inspección: `ReservationDetailView.jsx:2490` (`w.name === formData.talleres[0]`) y recálculo normalizado `:1277` (`sumarPrecioTalleres`); grep confirma 0 apariciones de `w.nombre` | ⚠️ PARTIAL (ver W-05) |
| REQ-06 Lookup w.name | Bug corregido — antes no encontraba | Evidencia estática: el bug `w.nombre` ya no existe en el código (grep); la resolución usa `w.name` y `sumarPrecioTalleres` (normaliza ambos lados, `bookingUtils.js:46-65`). QA manual producción: `/mi-reserva/:id` muestra actividad e importe en reservas migradas | ⚠️ PARTIAL (ver W-05) |
| REQ-07 Check explícito | Validador explícito cubre caso no cubierto por schema | `events.test.js > Debería detectar el límite de 3 actividades en el check explícito (caso no cubierto por el validador de schema en operadores de array)` (:589); impl. `events.controllers.js:51-56` | ✅ COMPLIANT |

#### activity-data-migration (8 REQ / 25 escenarios)

Nota: TASK-04 (script) y TASK-08 (ejecución) están designadas **[MANUAL]** en tasks.md ("Verificación MANUAL: no forma parte de ningún test automático"). Los escenarios de REQ-01…REQ-06 se verifican con evidencia runtime manual documentada (ensayo local sobre copia de producción de 395 eventos con invariantes I1-I8 + ejecución real en producción sobre 398 eventos con verificación contra backup) más inspección de código. REQ-07 tiene cobertura automatizada completa (6/6 escenarios).

| Requirement | Scenario | Test / Evidencia | Result |
|-------------|----------|------|--------|
| REQ-01 Script idempotente | Ejecución normal con documentos legacy | Manual (TASK-08 producción): 398 leídos · 170 con actividad · 397 escrituras · estadísticas = dry-run. Código: `migrate-taller-to-array.js:169-301` | ⚠️ PARTIAL (manual documentado, W-06) |
| REQ-01 Script idempotente | Ejecución idempotente (segunda vez) | Manual: 2.ª ejecución producción = 0 transformaciones (también en ensayo local: 395 ya migrados, 0). Código: skip `'talleres' in extras` `:230-234` | ⚠️ PARTIAL (manual documentado) |
| REQ-01 Script idempotente | Backup generado antes de cualquier escritura | Manual: backups producción `backup-2026-11-06T13-01-{19,44}.json` y `13-02-27` (uno por operación A/B/C) + verificación contra backup post-migración. Código: `ejecutarBackup()` `:61-79` invocado en `:214-216` ANTES del bucle de escrituras; aborta si falla | ⚠️ PARTIAL (manual documentado) |
| REQ-02 .lean() | Campo ausente detectado correctamente con lean | Código: `Event.find({}).lean()` `:200`. Runtime (ensayo local): dry-run detectó 226 documentos con selección vacía por campo ausente/'ninguno', coincidente con la auditoría previa | ⚠️ PARTIAL (estática + manual) |
| REQ-02 .lean() | Sin lean — comportamiento incorrecto (contraste) | Escenario de contraste conceptual; garantizado por el uso de `.lean()` (`:200`) y por el modelo con `default: undefined` (`event.model.js:71`). El ensayo local confirmó la detección correcta de campos ausentes (395 a migrar, 0 skip erróneos) | ⚠️ PARTIAL (estática + manual) |
| REQ-03 Transformación | Actividad válida — transformación a array | Código `construirUpdateTallerValido` `:125-140` (`$set [tallerLimpio]`, preserva snapshot, `$unset taller`). Manual: invariante I5 (395/395 `talleres == [taller original]`, snapshot idéntico; tras D-01 con normalización) | ⚠️ PARTIAL (manual documentado) |
| REQ-03 Transformación | Actividad válida sin snapshot — backfill | Código `:134-137` + `calcularSnapshotBackfill` `:96-111` (fórmula actual vía `obtenerPrecioTaller`, fallback 25/30). Manual: producción 0 backfill necesarios (169/169 con snapshot en el ensayo; 170/170 en producción) — rama verificada en rehearsal | ⚠️ PARTIAL (manual documentado) |
| REQ-03 Transformación | Taller 'ninguno' — array vacío | Código `esTallerValido` `:116-120` + `construirUpdateSeleccionVacia` `:145-157` (`[]` + `$unset` snapshot + `$unset taller`). Manual: 227 documentos producción; invariante I6 (4 de 4 snapshots residuales eliminados) | ⚠️ PARTIAL (manual documentado) |
| REQ-03 Transformación | Taller null — array vacío | Código `:116-117` (typeof !== 'string' → inválido → rama vacía `:247-249`) | ⚠️ PARTIAL (estática + manual) |
| REQ-03 Transformación | Taller undefined (campo ausente) — array vacío | Código: misma rama (`extras.taller` ausente → `esTallerValido` false → `[]`). Manual: incluido en los 227 de selección vacía | ⚠️ PARTIAL (estática + manual) |
| REQ-03 Transformación | Extras ausente — skip | Código `:220-226` (`!extras` → `stats.sinExtras`, continue sin escritura) | ⚠️ PARTIAL (estática + manual) |
| REQ-03 Transformación | Ya migrado — skip idempotente | Código `:230-234`. Manual: producción 1 ya migrado (skip) en la ejecución real; 398 skip en la 2.ª ejecución | ⚠️ PARTIAL (manual documentado) |
| REQ-04 $unset sin dual-write | Campo legacy eliminado | Código `$unset 'detalles.extras.taller'` `:131,:152-154`. Manual producción: 0 eventos con campo legacy `taller`, 0 con ambos campos (invariantes I3/I8) | ⚠️ PARTIAL (manual documentado) |
| REQ-04 $unset sin dual-write | Sin escritura dual post-migración | Estática + tests parciales: wizards web solo envían `talleres` (`BookingPage.jsx:94-103,359-361`; `BudgetPage.jsx` igual, sin clave `taller`); admin extrae `taller` y snapshots del payload (`ReservationDetailView.jsx:2892-2894`); `Step5Workshops.test.jsx:166` (el selector no escribe `precioTallerApplied`); ningún script nuevo escribe `taller` | ⚠️ PARTIAL (estática + tests indirectos) |
| REQ-05 precioTotal | precioTotal preservado tras migración | Código: el script jamás escribe `precioTotal` (grep: 0 apariciones en `$set`). Manual producción: verificación contra backup pre-migración → **0 diferencias de `precioTotal`** (suma 63961.5 € intacta en el ensayo local) | ⚠️ PARTIAL (manual documentado) |
| REQ-06 Dry-run | Dry-run reporta estadísticas | Código `:276-290` (total, a migrar, skip, vacíos, válidos, snapshot preservado/backfill, escrituras). Manual: dry-run producción antes de la ejecución real (398/170/227/1/0) y dry-run local (395/169/226) con conteos idénticos a la ejecución | ⚠️ PARTIAL (manual documentado) |
| REQ-06 Dry-run | Dry-run no modifica base de datos | Código `:252-254` (escritura solo `if (!IS_DRY_RUN)`) + `:284-286` ("Escrituras reales: 0"). Manual: ensayo local y producción, 0 escrituras en dry-run | ⚠️ PARTIAL (manual documentado) |
| REQ-07 obtenerTalleres | Documento ya migrado | `pricing.test.js > debería devolver el array talleres cuando ya está migrado` (:15); impl. `pricing.js:29-31` | ✅ COMPLIANT |
| REQ-07 obtenerTalleres | Documento legacy con taller válido | `pricing.test.js:20` (+ normalización de espacios `:77`, "NINGUNO" mayúsculas `:72`); impl. `pricing.js:33-39` | ✅ COMPLIANT |
| REQ-07 obtenerTalleres | Documento legacy con 'ninguno' | `pricing.test.js:25`; impl. `pricing.js:36` | ✅ COMPLIANT |
| REQ-07 obtenerTalleres | Documento legacy sin taller | `pricing.test.js:30` (+ `extras` undefined `:11`); impl. `pricing.js:41` | ✅ COMPLIANT |
| REQ-07 obtenerTalleres | talleres vacío explícito gana al legacy | `pricing.test.js > debería respetar un array vacío explícito (la selección vacía gana al legacy)` (:40-43, `{ talleres: [], taller: 'Cocina' }` → `[]`); impl. presencia `pricing.js:29` + `event.model.js:71` (`default: undefined`). Confirmado en esta re-verificación (nota 4 del lanzamiento) | ✅ COMPLIANT |
| REQ-07 obtenerTalleres | talleres existe y taller también (post-parcial) | `pricing.test.js > debería priorizar talleres sobre taller cuando ambos coexisten` (:35); impl. `pricing.js:29-31` | ✅ COMPLIANT |
| REQ-08 Scripts snapshots | Análisis de snapshots con talleres | Sin test automatizado. Código: `analyze-stale-snapshots.js:13,45-70` (usa `obtenerTalleres` + Σ con `obtenerPrecioTaller`/`esGrupoGrande`, reporta discrepancias). Manual: harness TASK-06 (caso sembrado reportado) | ⚠️ PARTIAL (ver W-05) |
| REQ-08 Scripts snapshots | Fix de snapshots con talleres | Sin test automatizado. Código: `fix-stale-snapshots.js:16,94-98` (recalcula con la Σ; respeta `--dry-run`). `backup-affected.js:10,28-44` adaptado a imprimir `talleres`. Manual: harness TASK-06 | ⚠️ PARTIAL (ver W-05) |

**Compliance summary**: 78 escenarios — 50 ✅ COMPLIANT con test automatizado pasado en esta ejecución; 28 ⚠️ PARTIAL con evidencia runtime manual documentada (19 de migración [MANUAL por decisión explícita de tasks.md] + 9 de admin/Calendar/toast/dry-run con harness manual) o cobertura automatizada indirecta; 0 ❌ FAILING; 0 ❌ UNTESTED sin evidencia. **Ningún escenario quedó sin verificar**: todos tienen evidencia runtime (automatizada o manual documentada) más inspección de código. Respecto a la verificación anterior, el escenario "Con una sola actividad seleccionada" (REQ-04 de multi-activity-selection) pasa de ⚠️ PARTIAL (desviación literal, W-01) a ✅ COMPLIANT tras la corrección del texto de la spec, verificada coherente con `Step5Workshops.jsx` y sus tests. **Escenarios conformes al texto literal de las specs: 78/78.**

### Correctness (Static Evidence) — Cobertura requisito → estado

| # | Requisito | Estado | Evidencia (fichero:línea) |
|---|-----------|--------|---------------------------|
| 1 | multi-activity-selection/REQ-01 Toggle AÑADIR/QUITAR | ✅ Cumple | `Step5Workshops.jsx:73-100,345-361` |
| 2 | multi-activity-selection/REQ-02 Máximo 3 + toast | ✅ Cumple con salvedad | `Step5Workshops.jsx:83-87,42-53` (auto-cierre 3 s sin aserción automatizada — W-05/S-04) |
| 3 | multi-activity-selection/REQ-03 Precio dinámico = Σ | ✅ Cumple | `Step5Workshops.jsx:115-120`; `bookingUtils.js:46-65` |
| 4 | multi-activity-selection/REQ-04 Quitar todas / Quitar actividad / Sin actividad | ✅ Cumple | `Step5Workshops.jsx:113-114,129-166` — MUST (≥2→"Quitar todas"; al pulsar vacía a `[]` y revierte a "Sin actividad") y texto literal del escenario corregido (1→"Quitar actividad"; 0→tarjeta no interactiva) cumplidos; tests `Step5Workshops.test.jsx:71,:54,:80,:211,:251` (W-01 resuelto) |
| 5 | multi-activity-selection/REQ-05 Chips visibles | ✅ Cumple | `Step5Workshops.jsx:173-182` |
| 6 | multi-activity-selection/REQ-06 Admin multi-toggle + shim | ✅ Cumple con salvedad | `ReservationDetailView.jsx:2410-2413,2522-2620` — sin tests automatizados (W-05) |
| 7 | multi-activity-selection/REQ-07 Init `talleres: []` | ✅ Cumple con salvedad | `BookingPage.jsx:95`, `BudgetPage.jsx:95`, `DayDetailView.jsx:109,138`, `BlockDateModal.jsx:61` — creadores admin sin test (W-05) |
| 8 | multi-activity-selection/REQ-08 Colaterales N actividades | ✅ Cumple con salvedad | Resúmenes `Step8Summary.jsx:105-140`/`StepBudgetSummary.jsx:80-115`; mailer `mailer.config.js:11-22`; Calendar `google.service.js:119-122,173` (sin test, W-05); PricingPage `:359-371`; modal `ReservationDetailModal.jsx:215-230`; vista pública `ReservationDetailView.jsx:986-1007,1272-1282` |
| 9 | activity-sum-pricing/REQ-01 Precio = Σ | ✅ Cumple | `events.controllers.js:221-252`; `bookingUtils.js:116-120` |
| 10 | activity-sum-pricing/REQ-02 Umbral >15 unificado | ✅ Cumple | `pricing.js:49`; `bookingUtils.js:6`; grep: 0 outliers `>= 15` en web/src (re-verificado) |
| 11 | activity-sum-pricing/REQ-03 Fallback pricePlus>0 | ✅ Cumple | `pricing.js:72-74`; `bookingUtils.js:12-14` |
| 12 | activity-sum-pricing/REQ-04 Snapshot = TOTAL | ✅ Cumple | `events.controllers.js:246,251`; `event.model.js:77` |
| 13 | activity-sum-pricing/REQ-05 Invalidación conjunto ordenado (2 pases) | ✅ Cumple | `events.controllers.js:605-612` (pase 1), `:670-677` (pase 2), ambos con clave normalizada (D-01) |
| 14 | activity-sum-pricing/REQ-06 Guard por presencia de campo | ✅ Cumple con salvedad | `'talleres' in newDetalles.extras` `:605,:670` — falta test discriminante de "campo ausente" (W-03) |
| 15 | activity-sum-pricing/REQ-07 precioTotal incluye Σ | ✅ Cumple | `events.controllers.js:249,721-726` |
| 16 | activity-validation/REQ-01 Límite 3 (schema + check) | ✅ Cumple | `event.model.js:72-75`; `events.controllers.js:56` |
| 17 | activity-validation/REQ-02 Dedupe talleres → 400 | ✅ Cumple | `events.controllers.js:58-66` (clave normalizada, fix D-01; edge case de la spec alineado — W-02 resuelto) |
| 18 | activity-validation/REQ-03 Dedupe personajes → 400 | ✅ Cumple | `events.controllers.js:96-103` |
| 19 | activity-validation/REQ-04 Catálogo active en selección nueva/modificada | ✅ Cumple | `events.controllers.js:75-92` (`resolverWorkshop` + `active`/`suspended`; comparación normalizada en ambos lados) |
| 20 | activity-validation/REQ-05 Recálculo legacy: fallback + warn, sin 400 | ✅ Cumple con salvedad | `events.controllers.js:232-240`; falta la combinación exacta PATCH-modificada-inválida en tests (W-04) |
| 21 | activity-validation/REQ-06 Lookup `w.name` | ✅ Cumple con salvedad | `ReservationDetailView.jsx:2490`; 0 apariciones de `w.nombre` — sin test automatizado (W-05) |
| 22 | activity-validation/REQ-07 Check explícito obligatorio | ✅ Cumple | `events.controllers.js:51-56` + test `events.test.js:589` |
| 23 | activity-data-migration/REQ-01 Script idempotente + backup | ✅ Cumple con salvedad | `migrate-taller-to-array.js:61-79,205-234`; evidencia manual producción (W-06) |
| 24 | activity-data-migration/REQ-02 `.lean()` | ✅ Cumple con salvedad | `:200` + `event.model.js:71` (`default: undefined`); manual |
| 25 | activity-data-migration/REQ-03 Reglas de transformación | ✅ Cumple con salvedad | `:116-157,239-250`; invariantes I1-I8 ensayo local + verificación producción |
| 26 | activity-data-migration/REQ-04 `$unset taller`, sin dual-write | ✅ Cumple con salvedad | `:131,152-154`; producción: 0 documentos con campo legacy; web/admin no escriben `taller` |
| 27 | activity-data-migration/REQ-05 `precioTotal` intocado (MUST NOT) | ✅ Cumple con salvedad | 0 escrituras de `precioTotal` en el script; producción: 0 diferencias contra backup |
| 28 | activity-data-migration/REQ-06 Dry-run con estadísticas | ✅ Cumple con salvedad | `:44,252-254,276-290`; dry-run producción y local con 0 escrituras |
| 29 | activity-data-migration/REQ-07 Compat-read `obtenerTalleres` | ✅ Cumple | `pricing.js:23-42`; 6/6 escenarios con test automatizado (`pricing.test.js:11-86`, incluido "talleres vacío explícito gana al legacy" `:40`); espejo web `bookingUtils.js:25-39` |
| 30 | activity-data-migration/REQ-08 Scripts de snapshots adaptados | ✅ Cumple con salvedad | `analyze-stale-snapshots.js:45-70`, `fix-stale-snapshots.js:94-98`, `backup-affected.js:28-44`; sin tests (W-05) |

Resumen: **30/30 requisitos cumplidos** — 16 sin salvedad, 14 con salvedad (brechas de cobertura o evidencia manual documentada), **0 no cumplidos**.

### Coherence (Design)

| Decisión (design.md) | ¿Seguida? | Notas |
|----------|-----------|-------|
| Dominio `Config.workshops[]`, sin tocar talleres públicos | ✅ Yes | `talleres.controllers.js`/`Taller` sin cambios por este change; suite `talleres.test.js` en verde |
| Identidad por nombres, sin ids ni dual-write | ✅ Yes | Array de nombres; web/admin solo escriben `talleres` (`ReservationDetailView.jsx:2894` extrae `taller` del payload) |
| Precio = Σ `obtenerPrecioTaller` por actividad, sin packs | ✅ Yes | `events.controllers.js:229-244`; sin campos nuevos en `Config` |
| Snapshot `precioTallerApplied` = TOTAL, sin renombrar | ✅ Yes | `event.model.js:77`; `events.controllers.js:246` |
| Helpers uno por capa | ✅ Yes | `api/utils/pricing.js` / `web/src/utils/bookingUtils.js`; definición única por capa verificada por grep |
| Umbral `>15` (corrección del outlier `>=15`) | ✅ Yes | Ambas capas; `crossLayerPricing.test.js` fija el contrato |
| Validación: schema + check explícito + dedupe | ✅ Yes | `event.model.js:72-75` + `events.controllers.js:56,58-66,96-103` |
| Catálogo: 400 solo en selección nueva/modificada; fallback+warn en recálculo | ✅ Yes | `events.controllers.js:75-92` vs `:232-240` |
| Invalidación: presencia + sort/JSON en DOS pases | ✅ Yes | `:605-612` y `:670-677` (con normalización D-01 en ambos) |
| Transición: backup → deploy con compat-read → migración idempotente | ✅ Yes | Ejecutado en producción en ese orden (A: fix-corrupt → B: migrate → C: normalize, cada una con backup previo) |
| `obtenerTalleres` retirable tras migración; ruta `taller` deprecated se retira en TASK-08 | ⚠️ Parcial | La ruta legacy sigue en el schema (`event.model.js:58-61`) y el fallback activo; la retirada se reclasificó como follow-up en apply-progress (W-08) |
| Nombres de diseño `getTalleres` (proposal) vs `obtenerTalleres` (design) | ✅ Yes | Implementación sigue design.md (`obtenerTalleres`); la proposal usaba el nombre en inglés — sin impacto |
| Componentes del diseño 25/25 | ✅ Yes | Todos los ficheros listados en design.md existen con los cambios descritos, más los añadidos justificados: `api/tests/pricing.test.js`, `api/tests/mailer.test.js`, suites transversales web, `normalize-workshop-names.js` (D-01) y `fix-corrupt-workshop-names.js` (D-02, PR #17) |

### Tasks (10)

| Task | Estado | Evidencia |
|------|--------|-----------|
| TASK-01 helpers precio/compat-read | ✅ Completada | `api/utils/pricing.js` + `api/tests/pricing.test.js` (helpers puros, suite en verde) |
| TASK-02 modelo + validaciones | ✅ Completada | `event.model.js:58-77`; `events.controllers.js:51-103`; `events.test.js:476-717` |
| TASK-03 pricing/snapshots/PATCH | ✅ Completada | `events.controllers.js:217-252,600-677`; `budget-flow.test.js:473-938` |
| TASK-04 script migración [MANUAL] | ✅ Completada | `migrate-taller-to-array.js`; ensayo local (395 eventos, I1-I8) + producción (397 escrituras, idempotencia 0) |
| TASK-05a helpers/precio web | ✅ Completada | `bookingUtils.js:1-65`; `bookingUtils.test.js` (51 tests) |
| TASK-05b selector + wizards + resúmenes | ✅ Completada | `Step5Workshops.jsx`; `BookingPage.jsx:95`/`BudgetPage.jsx:95`; resúmenes; `Step5Workshops.test.jsx` (18 tests) |
| TASK-05c cobertura resúmenes | ✅ Completada | `Step8Summary.test.jsx` (12), `StepBudgetSummary.test.jsx` (3), `CrossSummaryConsistency.test.jsx` (3) |
| TASK-06 admin y colaterales | ✅ Completada | `ReservationDetailView.jsx`, `ReservationDetailModal.jsx:215-230`, creadores admin, `PricingPage.jsx:359-371`, `mailer.config.js`, `google.service.js`, scripts de snapshots; harness manual documentado |
| TASK-07 suites transversales + gate | ✅ Completada | `CrossWizardWorkshops.test.jsx` (3), `crossLayerPricing.test.js` (5); gate re-ejecutado en esta verificación: 159+138 en verde + build OK |
| TASK-08 despliegue + migración [MANUAL] | ✅ Completada | `main` mergeada (11 PRs + #16-#19), Render `live`, Vercel `success`; secuencia producción A→B→C con backups; 398/398 eventos con `talleres`, 0 legacy, 0 diferencias `precioTotal`; PR #18 (precios en modal) verificado en bundle producción |

### Issues Found

**CRITICAL**: None

**WARNING** (activos, no bloqueantes):
- **W-03 — Test no discriminante para `activity-sum-pricing/REQ-06`, escenario "Campo ausente no dispara invalidación"**. Los PATCH sin `talleres` (`budget-flow.test.js:892`, `events.test.js:599`) pasan, pero el snapshot resultante coincide con el recalculado, por lo que no distinguen "guard no disparado" de "invalidado y recalculado al mismo valor". El código es correcto (`'talleres' in newDetalles.extras`, `events.controllers.js:605,670`). Recomendación: añadir regresión con snapshot previo distinto del recálculo (p. ej. `precioTallerApplied: 99` + PATCH sin `talleres` → conserva 99).
- **W-04 — Combinación exacta sin test para `activity-validation/REQ-05`, escenario "Recálculo con selección modificada y actividad inválida"** (PATCH que modifica la selección a un nombre inexistente → 400). Cubierto por ramas separadas: POST inválido → 400 (`events.test.js:565,573`) y PATCH con selección modificada que atraviesa la validación (`events.test.js:655`, vía `previousEventData` en `events.controllers.js:709`). Riesgo bajo (mismo código), hueco de cobertura real. Recomendación: añadir el test exacto.
- **W-05 — Superficie admin/Calendar/scripts sin cobertura automatizada** (9 escenarios PARTIAL): `multi-activity-selection/REQ-06` ×2 y REQ-07 "Nuevo bloqueo de fecha", REQ-08 "Google Calendar incluye actividades"; `activity-validation/REQ-06` ×2; `activity-data-migration/REQ-08` ×2; más el auto-descarte del toast (REQ-02). tasks.md designó explícitamente harness manual para estos puntos (TASK-06/TASK-07) y apply-progress documenta QA en navegador real (local y producción), por lo que no se clasifican como CRITICAL; `google.service` está mockeado en las suites API y no existe suite de componentes admin. Recomendación: tests mínimos para la construcción de descripción de Calendar (función pura), el shim/`ExtrasEdit` de `ReservationDetailView` y los creadores admin.
- **W-06 — 19 escenarios de `activity-data-migration` (REQ-01…REQ-06 + REQ-08) verificados solo por ejecución manual**, conforme a la decisión explícita de tasks.md (TASK-04/TASK-08 [MANUAL], "no forma parte de ningún test automático"). La evidencia runtime es sólida y está documentada (ensayo local sobre copia de producción con invariantes I1-I8; ejecución producción A→B→C con backup previo, idempotencia confirmada y 0 diferencias de `precioTotal` contra el backup). Riesgo residual: sin red de seguridad automatizada si el script se reutiliza. Aceptable para el archivo; se señala para trazabilidad.
- **W-08 — Limpieza planificada no ejecutada: ruta legacy `taller` en el schema**. TASK-02 indicó "se retira en TASK-08" para la ruta String deprecated (`api/models/event.model.js:58-61`); TASK-08 se cerró reclasificando la retirada como follow-up (apply-progress: "retirar la ruta `taller` deprecated del schema y simplificar `obtenerTalleres` — ya sin uso en producción porque no queda ningún documento legacy"). Es una tarea de limpieza (WARNING según las reglas de decisión), no rompe ningún requisito: la ruta es de solo lectura, sin default, y el compat-read sigue siendo correcto. Recomendación: `/tarea` de retirada tras confirmar la ventana cerrada.

**WARNING resueltos desde la verificación anterior** (se conservan numerados por trazabilidad; ya no computan como activos):
- **W-01 — RESUELTO (era el único bloqueante del archivo)**. El escenario "Con una sola actividad seleccionada" de `multi-activity-selection/REQ-04` fue reescrito (THEN: botón "Quitar actividad" con 1 selección, ni "Quitar todas" ni "Sin actividad"; al pulsarlo limpia el array). Verificado coherente con `Step5Workshops.jsx:113-114,135,150-166` y con los tests `Step5Workshops.test.jsx:71,:54,:147,:80,:211,:251`, todos pasados en esta ejecución. El MUST del requisito sigue intacto y cumplido. La spec ya no contradice producción; archivar la delta spec ahora canoniza el comportamiento deliberado real.
- **W-02 — RESUELTO**. El edge case "Nombre con espacios extra o case distinto" de `activity-validation` describe ahora la comparación normalizada (trim + minúsculas) en ambos lados, con el motivo (fix D-01, PR #16). Verificado coherente con `pricing.js:88,102-109`, `events.controllers.js:63-64,75-79,87,230,606-607,671-672` y `bookingUtils.js:48-55`, y con las regresiones `events.test.js:655,:710` pasadas en esta ejecución.
- **W-07 — RESUELTO**. La tabla "Coverage Verification" de `tasks.md` declara 25 escenarios para `activity-data-migration` y total 78 (19+19+15+25), idéntico al recuento real de las specs re-ejecutado en esta verificación; la atribución TASK-01 (6: REQ-07) y la nota de TASK-07 ("cuenta global en 78") fueron corregidas, y `apply-progress.md:861` documenta la aclaración del recuento.

**SUGGESTION**:
- **S-01 — Duplicación de `resolverWorkshop`**: `api/scripts/migrate-taller-to-array.js:84-89` reimplementa localmente el helper que ya existe en `api/utils/pricing.js:102-109` (misma semántica trim+lowercase). Reutilizar el util (DRY) si el script vuelve a ejecutarse.
- **S-02 — Contador `stats.escrituras` en dry-run**: `migrate-taller-to-array.js:252-255` incrementa el contador también en dry-run (se compensa imprimiendo "Escrituras reales: 0"); renombrar a "transformaciones previstas" evitaría lecturas confusas del log.
- **S-03 — Deuda preexistente fuera de alcance**: mass assignment `event.set(req.body)` en PATCH (`api/controllers/events.controllers.js:719`). No es regresión de este change (documentada en apply-progress como deuda no tocada); un cliente admin podría fijar campos no previstos (p. ej. `precioTotal` sin modificación de `detalles`). Recomendación: change independiente con whitelist de campos.
- **S-04 — Toast de `Step5Workshops`**: el auto-descarte a los 3 s (`Step5Workshops.jsx:44-50`) no se aserta con fake timers en `Step5Workshops.test.jsx:180-197`; añadir la aserción temporal cerraría el THEN completo del escenario "Bloqueo de 4ª actividad".
- **S-05 — Inconsistencia interna restante en la spec `multi-activity-selection`**: el edge case "Todas deseleccionadas vía toggles individuales" (tabla Edge Cases, `spec.md:178`) sigue diciendo "Precio muestra 0€" mientras el escenario de REQ-04 dice "el precio desaparece"; la implementación oculta el bloque de precio con 0 seleccionadas (`Step5Workshops.jsx:170`), conforme a REQ-04. Es una tabla informativa (no un escenario numerado) y no afecta al recuento ni al veredicto; alinear durante el archivo.
- **S-06 — Lookup de icono sin normalizar**: `ReservationDetailView.jsx:2490` usa igualdad exacta `w.name === formData.talleres[0]` (solo para elegir icono con 1 actividad); tras la normalización del catálogo de producción funciona, pero usar comparación normalizada lo haría consistente con el criterio D-01 del resto del fichero.
- **S-07 — Correcciones documentales sin commitear**: las correcciones verificadas (specs W-01/W-02, tasks.md W-07, apply-progress.md) están en el working tree sin commitear, y este informe sobrescribe un `verify-report.md` aún untracked. Commitear los artefactos (convencional commit, p. ej. `docs(sdd): ...`) antes o junto con el archivo para que `sdd-archive` sincronice los textos corregidos hacia `openspec/specs/`.

### Follow-ups registrados

No bloqueantes (fuera del alcance de este change):

1. Retirar la ruta `taller` deprecated del schema y simplificar `obtenerTalleres` (W-08) — sin documentos legacy en producción.
2. Revisar la regla de las 72 h para el cliente y la adecuación del mensaje 403.
3. Decidir el tratamiento de las 12 reservas con actividades retiradas ("Show de Magia" ×9, "Spa de Princesas" ×3), que conservan el fallback histórico 25/30 € por diseño (el nombre histórico es su facturación).
4. Mass assignment `event.set(req.body)` (S-03) — change aparte.
5. Tests discriminantes de W-03/W-04 y cobertura mínima de W-05 (admin/Calendar/toast) — mejora de red de seguridad.

El item bloqueante de la verificación anterior (alineación de textos W-01/W-02/W-07) queda **cerrado**: las correcciones fueron aplicadas por el orquestador/usuario y verificadas en esta re-verificación contra el código y los tests reales.

### Verdict

**PASS WITH WARNINGS** — apto para archivar.

Sustanciación: las tres puertas de ejecución están en verde con evidencia hash de esta re-ejecución (API 159/159 suites 5/5, web 138/138 files 14/14, build Vite OK; exit 0 en test y build); los 30 requisitos de las 4 specs están cumplidos sobre el código real (citado por fichero y línea, re-comprobado en esta ejecución); los 78/78 escenarios son conformes al texto literal de sus specs (50 con test automatizado pasado, 28 con evidencia runtime manual documentada en tareas designadas [MANUAL] o cobertura indirecta, 0 sin verificar); la migración se ejecutó en producción con backup previo, idempotencia confirmada y 0 diferencias de `precioTotal`; 0 hallazgos CRITICAL, 0 bloqueantes. La deriva de spec que motivó el FAIL anterior (W-01) fue corregida y verificada coherente con `Step5Workshops.jsx` y `Step5Workshops.test.jsx`; W-02 y W-07 también quedaron resueltos y verificados. Los 5 WARNING activos (W-03, W-04, W-05, W-06, W-08) son brechas de cobertura no bloqueantes o limpieza planificada, y las 7 SUGGESTION no impiden el archivo. Ruta siguiente: `sdd-archive` (sincronizar las 4 delta specs hacia `openspec/specs/`), teniendo en cuenta S-07 (commitear los artefactos documentales corregidos).
