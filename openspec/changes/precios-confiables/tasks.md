# Tasks: Precios confiables — el servidor como única fuente de verdad del precio de las reservas

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1.800 estimadas (`additions + deletions`; rango 1.550–2.000; suma de unidades ≈ 1.840) |
| 800-line budget risk | **High** a nivel de cambio completo (≈2× el presupuesto); **Low** por PR tras el corte (máx. ~580 por slice) |
| 400-line budget risk | **High** global · **Medium** por PR (WU 2 y WU 4 por encima de 400, ambos dentro de 800) |
| Chained PRs recommended | **Yes** |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 → PR 6 (feature-branch-chain) |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

```text
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High
```

Ramas: tracker `feat/precios-confiables` (única que mergea a `main`). Ramas slice con nombres sibling `feat/precios-confiables-wu-N-<slug>` (Git no permite una hija `feat/precios-confiables/...` con el tracker existente). PR #1 base = tracker; PR #k base = rama del PR #(k-1). Si un diff hijo muestra cambios de PRs anteriores, retarget/rebase hasta que el diff sea limpio.

Honestidad sobre la estimación: este change toca el camino de dinero (CREATE y PATCH) con TDD y fixtures de API completas. En `multi-actividades` la estimación (1.500–1.900) se quedó en ~la mitad del real (3.268). El margen de error apunta al alza: si un slice real supera 800 líneas revisables, subdividirlo (patrón TASK-05a/5b/5c de `multi-actividades`), sin superar jamás el presupuesto por PR.

### Suggested Work Units

| Unit | Goal | Base (feature-branch-chain) | Likely PR | Focused test command | Runtime harness | Rollback boundary | Lines |
|------|------|----------------------------|-----------|----------------------|-----------------|-------------------|-------|
| 1 | Regla de rol, identidad opcional y límites del modelo | `feat/precios-confiables` | PR 1 | `cd api && npx jest tests/role-based-fields.test.js tests/events.test.js` | `POST /api/v1/events` local con JWT admin + `tipo: 'bloqueo'` → 201; sin token → 400; `PATCH` admin con `costoExtra: -50` → persiste | Revert de `event.model.js` + `routes.config.js` + `optionalAuth`/`isAdmin` + proyección de rol + `role-based-fields.test.js` | ~400 |
| 2 | CREATE: whitelist de precios y recálculo desde catálogo | rama PR 1 | PR 2 | `cd api && npx jest tests/price-authority.test.js` | `POST /api/v1/events` con `precioApplied: 0`, `precioUnitario: 0`, `precioTotal: 1` → snapshots y total del catálogo en respuesta y BD | Revert del bloque de proyección/cálculo en `create` + parte CREATE de `price-authority.test.js` | ~420 |
| 3 | CREATE: validación de `menuId` (solo reservas) | rama PR 2 | PR 3 | `cd api && npx jest tests/menu-id-validation.test.js` | `POST` reserva con `menuId: 'inexistente'` → 400 sin documento; bloqueo admin con `menuId: 1` → 201 con total 0 | Revert de la validación de menú + `menu-id-validation.test.js` (degradable a warning sin tocar whitelist/precios) | ~280 |
| 4 | PATCH: snapshot del servidor, invalidación selectiva y total aislado | rama PR 3 | PR 4 | `cd api && npx jest tests/price-authority.test.js tests/budget-flow.test.js` | `PATCH { precioTotal: 0 }` aislado → total = suma almacenada; `PATCH` con `precioApplied: 0` sin cambio de selección → conserva el almacenado | Revert del bloque `update` + reescritura de `budget-flow.test.js` | ~580 |
| 5 | Auditoría dry-run de snapshots (comida adulta) [MANUAL] | rama PR 4 | PR 5 | N/A automático (script dry-run manual); regresión `cd api && npm test` | `node api/scripts/analyze-stale-snapshots.js` sobre entorno controlado con reserva sembrada → reporta `precioUnitario` divergente | Borrar el bloque nuevo del script (sin consumidores) | ~100 |
| 6 | Gate de verificación y smoke transversal | rama PR 5 | PR 6 | `cd api && npm test && cd ../web && npm run test:run` (+ `cd web && npm run build`) | Matriz de smoke: embudo completo, admin (bloqueo con `menuId: 1`, descuento), `/mi-reserva/:id`, histórico inocuo | Borrar los tests transversales del gate (el código vive en PR 1–5) | ~60 |

TDD (`openspec/config.yaml` `apply: tdd: true`): cada task de código lleva sus tests en el MISMO work unit (RED→GREEN→commit único verificable). Toda cita de requisito es cualificada (`<capacidad>/REQ-NN`). Los 183 tests del API y los 138 del web deben seguir en verde salvo las REESCRITURAS declaradas (`budget-flow.test.js:948-998` y `events.test.js:680-705`) y las fixtures de menú declaradas en TASK-03.

---

## Fase 1: Base — identidad, rol y modelo

### [ ] TASK-01: Regla de rol en CREATE/PATCH, identidad opcional y límites del modelo
- **Alcance**: `api/models/event.model.js` — `min: 0` en `horario.costoExtension` (`:108`); `costoExtra` conserva negativos (descuento legítimo de admin, sin `min`; `ReservationDetailView.jsx:1195`). En `update`, guardar con `event.save({ validateModifiedOnly: true })` para que un `costoExtension` negativo heredado no invalide ediciones inocuas (REQ-07 histórica). `api/config/routes.config.js` — extraer el wrapper JWT opcional inline del PATCH (`:43-59`) a un middleware reutilizable `optionalAuth` y adjuntarlo a `POST /events` y `PATCH /events/:id`: el mapa de rutas y los niveles de acceso NO cambian (POST sigue público, PATCH con auth opcional, sin elevar a admin-only); solo se propaga identidad tras `checkUserForAuth`, prerequisito de los escenarios admin de CREATE (`role-based-event-fields/REQ-03`, `REQ-05`) — sin esto `isAdmin(req)` es siempre falso en `create` y los bloqueos del panel (`BlockDateModal.jsx:53-54`, `DayDetailView.jsx:101-132`) rechazarían con 400. `api/controllers/events.controllers.js` — helper `isAdmin(req)` (true solo con usuario cargado por JWT válido y `role === 'admin'`; ausente/fallido → falso) y proyección de escritura por rol en `create` y `update`: sin rol admin se ignoran en silencio `costoExtra`, `estado`, `tipo`, `publicId`, `invitationId`, `googleEventId` y `notasAdmin` (decisión de specs: sin 400/403; sustituye el 403 actual de `estado` en PATCH `:556-558`, que impide el cambio igualmente); CREATE no-admin fuerza `estado: 'pendiente'`; `tipo: 'bloqueo'` no-admin → 400 (con `estado` a la vez: 400 por el tipo, estado ignorado); admin conserva escritura completa (bloqueos con `menuId: 1` heredado, `estado` en alta y edición, `costoExtra` negativo). Tests RED primero: nuevo `api/tests/role-based-fields.test.js` (9 escenarios + 3 edge cases) y helper `api/tests/helpers/eventFixtures.js` (payload base de reserva + token admin, reutilizado por las suites siguientes); tests de modelo (`costoExtension` negativa rechazada al escribir; `costoExtra` negativo de admin persiste); REESCRITURA deliberada de `api/tests/events.test.js:680-705` (PATCH anónimo que hoy persiste `notasAdmin`: el edit legacy sigue en 200 pero el campo ya no persiste desde el cliente).
- **Dependencias**: ninguna (primer eslabón de la cadena).
- **Verificación** (TDD): RED → GREEN → commit único; `cd api && npx jest tests/role-based-fields.test.js tests/events.test.js` en verde + `cd api && npm test` sin regresiones (183 existentes salvo las reescrituras declaradas).
- **Requisitos**: `role-based-event-fields/REQ-01` · `REQ-02` · `REQ-03` · `REQ-04` · `REQ-05`.
- **Escenarios (9)**: "Anónimo envía costoExtra", "Admin envía costoExtra", "Cliente envía campo administrativo", "Admin envía campos administrativos", "Anónimo intenta crear bloqueo", "Admin crea bloqueo", "Admin fija estado en PATCH", "Cliente envía estado en CREATE", "Admin fija estado en CREATE". Edge cases (3): "PATCH costoExtra por no-admin + campo legítimo → costoExtra ignorado, legítimo aplicado", "Admin envía costoExtra con costoExtension falsificado → costoExtra se aplica, costoExtension por reglas del servidor" (compartido con TASK-02/TASK-04), "No-admin envía tipo: 'bloqueo' y estado a la vez → 400 por el tipo, estado ignorado".

---

## Fase 2: Autoridad de precio en CREATE y validación de menú

### [ ] TASK-02: CREATE — whitelist de precios y recálculo desde catálogo
- **Alcance**: `api/controllers/events.controllers.js#create` — proyectar el payload descartando TODOS los campos de precio antes de construir el documento: `precioTotal` top-level, `detalles.niños.precioApplied`, `detalles.adultos.comida[].precioUnitario`, `detalles.extras.precioTallerApplied`/`precioPersonajeApplied`/`precioPinataApplied`/`precioCatalogoApplied` y `horario.costoExtension` (REQ-01: ningún valor de precio del cliente queda almacenado ni se muestra en panel). `calculateEventPrice` recibe solo selecciones y snapshots confiables → resuelve SIEMPRE desde `Config`: `precioApplied` por `menuId` en `menusNiños`, `precioTallerApplied` por `obtenerPrecioTaller` (fallback 25/30 € de `workshop-pricing-safety` conservado), `precioPersonajeApplied`, piñata/catálogo, `costoExtension` por `extensionMinutos` (payload negativo ignorado, calculado del catálogo) y `precioUnitario` de comida adulta por `id`/`nombre` en `Config.preciosAdultos` (REQ-02, `REQ-09` en CREATE); `precioTotal` = suma de snapshots (REQ-03). Respuesta conserva snapshots para display (REQ-08). Tests RED primero: parte CREATE de `api/tests/price-authority.test.js`, afirmando respuesta Y documento persistido.
- **Dependencias**: TASK-01 (proyección por rol e `isAdmin`).
- **Verificación** (TDD): `cd api && npx jest tests/price-authority.test.js` en verde + `cd api && npm test` sin regresiones.
- **Requisitos**: `server-price-authority/REQ-01` · `REQ-02` · `REQ-03` · `REQ-08` (compartido) · `REQ-09` (rama CREATE).
- **Escenarios (7)**: "Cliente envía precio manipulado", "El precio enviado por el cliente no queda almacenado" (rama CREATE; compartido con TASK-04), "CREATE con actividades válidas", "CREATE con costoExtension negativo en payload", "CREATE con comida de adultos y precioUnitario falseado", "Cliente envía precioTotal falso", "GET de reserva" (compartido con TASK-04). Edge cases: "precioUnitario: 0 en CREATE → calcular desde catálogo", "Payload front con precioTotal (PWA cache) → ignorado sin error".

### [ ] TASK-03: CREATE — validación de `menuId` solo para reservas
- **Alcance**: `events.controllers.js#create` — para `tipo: 'reserva'`, `detalles.niños.menuId` debe resolverse exacto (`id`/`_id`) en `Config.menusNiños`; ausente, vacío, retirado o con typo → 400 con mensaje descriptivo y SIN crear el documento (hoy: `childPrice = 0` silencioso, `:132-136`). Ubicar la comprobación DESPUÉS de `validateEventData` para no robar los mensajes 400 específicos que afirman tests existentes. `tipo: 'bloqueo'` exento: acepta `menuId: 1` heredado y conserva total 0. El PATCH NO se toca aquí (TASK-04 valida solo cuando el `menuId` cambia). Tests RED primero: `api/tests/menu-id-validation.test.js` (7 escenarios + 4 edge cases). Fixture deliberada: `events.test.js:38-95` crea reservas sin `Config` de menús — añadir fixture solo en los tests afectados, sin tocar los `beforeEach` que ya crean su `Config` (evitar documentos duplicados que cambien el `Config.findOne()`).
- **Dependencias**: TASK-02 (la aserción de precio de menú exige el recálculo desde catálogo ya instalado).
- **Verificación** (TDD): `cd api && npx jest tests/menu-id-validation.test.js tests/events.test.js` en verde + `cd api && npm test` sin regresiones.
- **Requisitos**: `menu-id-validation/REQ-01` · `REQ-02` · `REQ-03` · `REQ-04`.
- **Escenarios (7)**: "menuId válido", "menuId inexistente", "menuId vacío o ausente en una reserva", "Prevención de reserva con precio 0", "Resolución correcta de precio", "Bloqueo de fecha sin menuId", "Bloqueo de fecha con menuId heredado que no resuelve". Edge cases (4): "menuId de menú retirado → 400", "menuId con typo / case sensitivity → 400 sin match exacto", "Alta de bloqueo con menuId heredado → 201", "Reservas existentes con menuId antiguo → no afectadas (la validación solo es al alta)".

---

## Fase 3: Autoridad de precio en PATCH

### [ ] TASK-04: PATCH — preservación del snapshot del servidor y recálculo controlado
- **Alcance**: `api/controllers/events.controllers.js#update` — proyección allowlisted del patch (nunca precios entrantes ni campos restringidos de TASK-01); la fusión de `detalles` deja de dejar pasar snapshots del payload (el merge actual `:668-672` conserva la copia del cliente): el snapshot ALMACENADO es la base autorizada. Sin cambio de selección → gana el snapshot almacenado (REQ-04/REQ-07; reescritura deliberada de `api/tests/budget-flow.test.js:948-998` — el fixture 99 deja de ser comportamiento esperado: almacenado 25 real ≠ enviado 99 → gana 25; `:1013-1051` y `:474-510` siguen en verde). Con cambio de selección → invalidar solo el dependiente y recalcular con el catálogo actual (REQ-05): menú→`precioApplied`, talleres→`precioTallerApplied`, personajes→`precioPersonajeApplied`, piñata/catálogo→`precioPinataApplied`/`precioCatalogoApplied`. Comida adulta: comparar la lista completa; si cambia, resolver `precioUnitario` desde `Config.preciosAdultos` (REQ-09); si no cambia, conservar el almacenado (edge: ítem fuera del catálogo conserva `precioUnitario` almacenado, sin imputar importe de catálogo). Extensión: los guards actuales miran `newDetalles.horario` (código muerto — `horario` es top-level) → corregir al campo top-level: cambiar `extensionMinutos` invalida `costoExtension`, sin cambio preserva el almacenado. `precioTotal` SIEMPRE recalculado desde los snapshots almacenados/resueltos, incluido el PATCH aislado `PATCH { precioTotal: 1 }` → suma almacenada (REQ-06; cierra S-03 del archive). Validar `menuId` en PATCH SOLO cuando cambia (→400 si no resuelve): validar siempre bloquearía las reservas legacy cuyo `menuId` ya no resuelve (riesgo 7 del design). Respuestas conservan snapshots (REQ-08). Tests RED primero: parte PATCH de `api/tests/price-authority.test.js` + reescritura de `budget-flow.test.js:948-998`.
- **Dependencias**: TASK-01 (proyección por rol), TASK-02 (semántica de resolución desde catálogo reutilizada en el recálculo).
- **Verificación** (TDD): `cd api && npx jest tests/price-authority.test.js tests/budget-flow.test.js` en verde + `cd api && npm test` sin regresiones.
- **Requisitos**: `server-price-authority/REQ-01` (rama PATCH, compartido) · `REQ-04` · `REQ-05` · `REQ-06` · `REQ-07` · `REQ-08` (compartido) · `REQ-09`.
- **Escenarios (6 únicos + 2 compartidos)**: "PATCH con snapshot falsificado sin cambio de selección", "PATCH cambia menuId", "PATCH aislado de precioTotal", "PATCH inocuo en reserva histórica (incluidas las 12 con actividad retirada)", "PATCH cambia la comida de adultos", "PATCH no cambia la comida de adultos"; compartidos: "El precio enviado por el cliente no queda almacenado" (rama PATCH), "GET de reserva". Edge cases: "costoExtension falso + extensionMinutos sin cambio → preservar costoExtension almacenado", "Ítem de comida que ya no está en Config.preciosAdultos → conservar precioUnitario almacenado, sin importe de catálogo", "Payload front con precioTotal → ignorado sin error".

---

## Fase 4: Auditoría de snapshots

### [ ] TASK-05: Extender `api/scripts/analyze-stale-snapshots.js` al precio unitario de comida de adultos [MANUAL]
- **Alcance**: el script (dry-run, NO modifica datos) hoy audita `precioApplied` y `precioTallerApplied`; extender `detectStaleSnapshot` para comparar `detalles.adultos.comida[].precioUnitario` contra `Config.preciosAdultos` por `id`/`nombre`, e informar como hallazgos los ítems no resolubles y los `costoExtension`/`costoExtra` negativos heredados (insumo de la decisión de la admin). No tocar `fix-stale-snapshots.js` ni datos: la reparación selectiva es decisión de la admin, nunca reprecio masivo automático. **Verificación MANUAL: no forma parte de la suite automática.**
- **Dependencias**: TASK-02 (semántica de resolución de `precioUnitario` que el script replica).
- **Verificación** (MANUAL, entorno controlado con copia de datos): `node api/scripts/analyze-stale-snapshots.js` con una reserva sembrada de `precioUnitario` divergente → la reporta con campo/actual/esperado; segunda ejecución idempotente (0 escrituras); `cd api && npm test` sin regresiones.
- **Requisitos**: soporte del riesgo 6 del design (auditoría dry-run del rollback) y del plan de rollback del proposal (paso 5); **0 escenarios de spec** (ningún requisito de las 3 specs depende del script).
- **Escenarios**: sin escenarios de spec asignados; cierra la superficie de riesgo R6/R9.

---

## Fase 5: Gate de verificación

### [ ] TASK-06: Gate de verificación final y smoke manual
- **Alcance**: suite completa `cd api && npm test && cd ../web && npm run test:run` (API: 183 existentes + los nuevos de los WU 1–4; web: 138 intactos — `Step5Workshops.test.jsx`, `bookingUtils.test.js`, `Step8Summary.test.jsx` en verde y displays siguiendo leyendo snapshots, sin cambio de contrato de lectura) + `cd web && npm run build`. Auditoría de cobertura contra este artefacto (18/18 requisitos, 29/29 escenarios, 5/5 componentes, 9/9 riesgos). Smoke manual contra API local replicando los vectores de la tabla del Intent: 0 de los payloads hostiles altera el importe persistido; admin: bloqueo con `menuId: 1`, `estado` fijado en alta, `costoExtra` negativo; `PATCH { precioTotal: 0 }` aislado; PATCH inocuo en reserva histórica.
- **Dependencias**: TASK-01 … TASK-05 (cadena completa).
- **Verificación**: comando completo en verde + `cd web && npm run build` + checklist de smoke firmado.
- **Requisitos/escenarios**: gate sobre los 29 escenarios (no añade escenarios nuevos; cuenta global en 29).

---

## Coverage Verification (auditoría)

### Requisitos y escenarios → tareas (18 requisitos / 29 escenarios)

| Capacidad | Requisito | Escenarios (nº) | Tareas |
|-----------|-----------|-----------------|--------|
| `server-price-authority` | REQ-01 Whitelist de campos escribibles | "Cliente envía precio manipulado"; "El precio enviado por el cliente no queda almacenado" (2) | TASK-02 (CREATE) · TASK-04 (PATCH) |
| `server-price-authority` | REQ-02 Cálculo de snapshots en CREATE | "CREATE con actividades válidas"; "CREATE con costoExtension negativo en payload"; "CREATE con comida de adultos y precioUnitario falseado" (3) | TASK-02 |
| `server-price-authority` | REQ-03 Recálculo de precioTotal en CREATE | "Cliente envía precioTotal falso" (1) | TASK-02 |
| `server-price-authority` | REQ-04 Preservación de snapshot en PATCH sin cambio | "PATCH con snapshot falsificado sin cambio de selección" (1) | TASK-04 |
| `server-price-authority` | REQ-05 Recálculo en PATCH con cambio de selección | "PATCH cambia menuId" (1) | TASK-04 |
| `server-price-authority` | REQ-06 Recálculo aislado de precioTotal en PATCH | "PATCH aislado de precioTotal" (1) | TASK-04 |
| `server-price-authority` | REQ-07 Integridad de reservas históricas | "PATCH inocuo en reserva histórica" (1) | TASK-04 |
| `server-price-authority` | REQ-08 Respuestas con snapshots | "GET de reserva" (1) | TASK-02 · TASK-04 |
| `server-price-authority` | REQ-09 Comida de adultos por catálogo | "PATCH cambia la comida de adultos"; "PATCH no cambia la comida de adultos" (2) | TASK-02 (CREATE) · TASK-04 (PATCH) |
| `menu-id-validation` | REQ-01 Validación de menuId en el alta | "menuId válido"; "menuId inexistente"; "menuId vacío o ausente en una reserva" (3) | TASK-03 |
| `menu-id-validation` | REQ-02 Respuesta 400 para menuId inválido | "Prevención de reserva con precio 0" (1) | TASK-03 |
| `menu-id-validation` | REQ-03 menuId válido resuelve precio del catálogo | "Resolución correcta de precio" (1) | TASK-03 |
| `menu-id-validation` | REQ-04 La validación no aplica a los bloqueos | "Bloqueo de fecha sin menuId"; "Bloqueo de fecha con menuId heredado que no resuelve" (2) | TASK-03 |
| `role-based-event-fields` | REQ-01 costoExtra solo escribible por admin | "Anónimo envía costoExtra"; "Admin envía costoExtra" (2) | TASK-01 |
| `role-based-event-fields` | REQ-02 Campos administrativos no escribibles por clientes | "Cliente envía campo administrativo"; "Admin envía campos administrativos" (2) | TASK-01 |
| `role-based-event-fields` | REQ-03 tipo bloqueo solo para admin | "Anónimo intenta crear bloqueo"; "Admin crea bloqueo" (2) | TASK-01 |
| `role-based-event-fields` | REQ-04 Admin conserva capacidades completas | "Admin fija estado en PATCH" (1) | TASK-01 |
| `role-based-event-fields` | REQ-05 estado en CREATE para clientes | "Cliente envía estado en CREATE"; "Admin fija estado en CREATE" (2) | TASK-01 |
| **Totales** | **18 requisitos** | **29 escenarios** | **Ningún escenario sin tarea (29/29)** |

Edge cases (11) también cubiertos: `server-price-authority` (4) → TASK-02 (2) y TASK-04 (2: extensión preservada, ítem fuera de catálogo); `menu-id-validation` (4) → TASK-03 (3) y TASK-04 (reservas con menuId antiguo no afectadas); `role-based-event-fields` (3) → TASK-01.

### Componentes del diseño (5/5)

| Componente del design | Tareas |
|----------------------|--------|
| `api/controllers/events.controllers.js#create` | TASK-01 (rol/identidad) · TASK-02 (precios) · TASK-03 (menú) |
| `api/controllers/events.controllers.js#update` | TASK-01 (rol/identidad) · TASK-04 (precios) |
| `api/config/routes.config.js` | TASK-01 (`optionalAuth` reutilizable; sin cambio de acceso) |
| `api/models/event.model.js` | TASK-01 (`min: 0` en `horario.costoExtension`) |
| `api/tests/budget-flow.test.js` y pruebas API | TASK-01/02/03/04 (pruebas nuevas) · TASK-04 (reescritura REQ-06) · TASK-06 (gate) |

Nuevos ficheros adicionales: `api/tests/role-based-fields.test.js` (TASK-01), `api/tests/price-authority.test.js` (TASK-02/04), `api/tests/menu-id-validation.test.js` (TASK-03), `api/tests/helpers/eventFixtures.js` (TASK-01).

### Cobertura de riesgos (9 filas)

Composición: filas 1–8 de la tabla Risks del `design.md`; fila 9 del `proposal.md` (la única del proposal sin fila equivalente en el design). Las otras 5 filas del proposal se recogen aquí: "preview difiere"→R8, "whitelist rompe descuento admin"→R3, "restringir tipo rompe bloqueos admin"→R3, "repricar reservas legacy"→R6, "displays dejan de funcionar"→R1.

| # | Riesgo | Mitigación en el plan | Tareas |
|---|--------|----------------------|--------|
| R1 | Snapshot falso queda en documento aunque el cálculo lo ignore | La proyección excluye los precios del objeto ANTES de `Event.create`/`event.set`; tests afirman documento persistido y respuesta (entrada filtrada, salida conserva snapshots para displays) | TASK-02 · TASK-04 |
| R2 | PATCH sobrescribe snapshot legítimo por orden de merge | Snapshot almacenado prevalece; invalidación selectiva solo al cambiar selección; pruebas de selección igual y distinta | TASK-04 |
| R3 | Admin mal identificado en endpoint público/opcional (whitelist sin rol rompe descuentos y bloqueos admin) | `isAdmin(req)` solo con JWT validado y usuario cargado (`checkUserForAuth`); sin token/inválido/no-admin → política cliente; tests de descuento `costoExtra` negativo y de bloqueo admin | TASK-01 |
| R4 | Comida adulta cambia pero el precio unitario no | Comparar la selección completa de comida y resolver/soltar `precioUnitario` al cambiarla; preservarla si no cambia | TASK-02 (CREATE) · TASK-04 (PATCH) |
| R5 | Bloqueo falla por `menuId` heredado o menú inválido cobra 0 € | Validar menú exclusivamente en reserva; bloqueo admin y menú ausente/inválido con tests propios | TASK-03 |
| R6 | Revertir código afecta importes (repricing legacy) | Sin migración destructiva: revert de deploy no reescribe documentos; preservación de snapshots en PATCH inocuo (12 con actividad retirada intactas); auditoría dry-run extendida; reparación selectiva solo con decisión de la admin | TASK-04 · TASK-05 |
| R7 | PATCH con `menuId` inválido deja el precio del menú a 0 € | Validar `menuId` en PATCH SOLO cuando cambia (400 si no resuelve), sin repreciar selecciones intactas — validarlo siempre bloquearía las reservas legacy | TASK-04 |
| R8 | Preview PWA cacheada difiere del importe final | El servidor siempre cobra el suyo y la respuesta devuelve el precio definitivo (nunca 400 por discrepancia); log/métrica o aviso visible quedan como decisión de la admin (ver abajo) | TASK-02 · TASK-04 (REQ-08) + decisión admin |
| R9 | `budget-flow.test.js:948-998` (REQ-06) codifica la confianza a corregir | Reescritura deliberada en TASK-04 (fixture 99 deja de ser comportamiento esperado). Hallazgo adicional de esta fase: `events.test.js:680-705` codifica lo mismo con `notasAdmin` en PATCH anónimo → reescritura en TASK-01 | TASK-01 · TASK-04 |

---

## Decisiones de la admin (NO son tareas de implementación)

1. **Aviso de divergencia preview/cobro** (`server-price-authority` Open Question 1): cuando la PWA sirve config cacheada, el preview del wizard puede diferir del importe cobrado. Este change SIEMPRE cobra el del servidor y lo devuelve en la respuesta (REQ-03/REQ-08). Queda por decidir si se implementa solo log/métrica (recomendado) o un aviso visible en el paso de confirmación. **Decisión de la admin** — hasta decidir, no se implementa ni métrica ni aviso.
2. **Reparación de las 5 reservas antiguas** cuya línea de actividad quedó a 0 € (`server-price-authority` Open Question 2) y de cualquier caso que la auditoría confirme (p. ej. importes 0 €, `costoExtension`/`costoExtra` negativos heredados): el default es respetar el precio histórico (REQ-07). ¿Se aprueba reparación selectiva de los casos confirmados? **Decisión de datos de la admin** — fuera de implementación; el change solo extiende la auditoría dry-run (TASK-05) y prohíbe el reprecio masivo automático.

Nota: las otras dos preguntas del proposal ya quedaron cerradas por las specs ("Decisiones tomadas"): campos prohibidos a clientes → ignorados en silencio; `estado` en alta → forzado `pendiente` solo para clientes (el admin puede fijarlo).

## Notas de alcance (fuera de este plan)

- **Limpieza opcional del payload front** (`BookingPage.jsx:335-385`, `BudgetPage.jsx:403-456`, `Step4Adults.jsx:110-125` dejar de enviar importes): higiene documentada en el Affected Areas del proposal, fuera de este plan por la restricción de no tocar la UI. La garantía no depende del front (el servidor ignora esos campos igualmente). Candidata a change posterior.
- Ventana de 72 h y ausencia de autoría del PATCH (`routes.config.js:43-59`): fuera de alcance (nota residual del proposal); este change acota el daño de precio.
- Drift de ids de `Config` (`config.model.js`, `config.controllers.js`): change posterior; aquí solo se valida `menuId` en el alta (y al cambiarlo en PATCH).
- Ruta legacy `taller`, reescritura de las 4 specs de `multi-actividades`, mass assignment de otros endpoints: intactos.
