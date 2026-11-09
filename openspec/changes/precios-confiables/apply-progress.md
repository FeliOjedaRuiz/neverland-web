# Apply Progress: Precios confiables

## Resumen de la cadena

- Tracker: `feat/precios-confiables`
- Estrategia: `feature-branch-chain`
- Work units totales: 6

## TASK-01: Regla de rol, identidad opcional y límites del modelo

### Estado

Completado.

### Alcance implementado

- `api/models/event.model.js`
  - `horario.costoExtension` ahora tiene `min: 0`.
  - `costoExtra` conserva valores negativos (descuento/ajuste legítimo de admin); añadido comentario explicativo.
- `api/config/routes.config.js`
  - Extraído el wrapper JWT opcional inline del `PATCH /events/:id` a un middleware reutilizable `optionalAuth`.
  - Aplicado `optionalAuth` a `POST /events` y `PATCH /events/:id`.
  - El mapa de rutas y niveles de acceso no cambiaron: POST sigue público, PATCH con auth opcional, sin elevar a admin-only.
- `api/controllers/events.controllers.js`
  - Helper `isAdmin(req)`.
  - Helper `applyClientProjection(req)` para descartar en silencio campos administrativos y snapshots de precio para no-admin.
  - Proyección por rol en `create` y `update`.
  - Sin rol admin se ignoran en silencio `costoExtra`, `estado`, `tipo`, `publicId`, `invitationId`, `googleEventId`, `notasAdmin`, `precioTotal` y los snapshots de precio.
  - CREATE no-admin fuerza `estado: 'pendiente'`.
  - `tipo: 'bloqueo'` no-admin → 400.
  - Admin conserva escritura completa (bloqueos, estado, `costoExtra` negativo).
  - Sustituido el 403 previo de cambio de `estado` en PATCH por el silencio de la spec.
  - `update` guarda con `event.save({ validateModifiedOnly: true })` para proteger reservas históricas con `costoExtension` negativo heredado.

### Tests

- Nuevo `api/tests/role-based-fields.test.js` con 17 tests (9 escenarios + 5 casos límite + 3 límites de modelo):
  - REQ-01: `costoExtra` solo escribible por admin.
  - REQ-02: campos administrativos no escribibles por clientes.
  - REQ-03: `tipo: 'bloqueo'` solo para admin.
  - REQ-04: admin conserva capacidades completas.
  - REQ-05: estado en CREATE/PATCH para clientes.
  - Casos límite: PATCH mixto, admin con `costoExtension` falsificado, bloqueo+estado no-admin, usuario guest, `precioTotal` en PATCH.
  - Límites del modelo: `costoExtension` negativa rechazada, `costoExtra` negativo persiste.
- Nuevo helper `api/tests/helpers/eventFixtures.js` con payload base, usuario admin/guest y token.
- Reescritura deliberada de `api/tests/events.test.js:701-705`: PATCH anónimo ya no persiste `notasAdmin` pero sigue devolviendo 200.

### Evidencia RED → GREEN

- Primera corrida de `role-based-fields.test.js`: 8 fallos / 14 tests (RED).
- Tras implementación y ajustes: 17/17 tests verdes.
- Suite completa API: **200 tests pasan** (183 originales + 17 nuevos).
- Suite web: **138 tests pasan**, sin regresiones.

### Comandos de verificación

```bash
cd api && npx jest tests/role-based-fields.test.js --setupFilesAfterEnv ./tests/setup.js --no-coverage
cd api && npm test
cd web && npm run test:run
```

### Commit

- Hash: `b1bef25`
- Mensaje: `feat(api): enforce role-based event field writes`
- Ficheros: `api/config/routes.config.js`, `api/controllers/events.controllers.js`, `api/models/event.model.js`, `api/tests/events.test.js`, `api/tests/helpers/eventFixtures.js`, `api/tests/role-based-fields.test.js`
- Hook GGA: PASSED.

### PR

- Rama: `feat/precios-confiables-wu-1-rol-identidad`
- Base: `feat/precios-confiables`
- URL de creación manual: https://github.com/FeliOjedaRuiz/neverland-web/pull/new/feat/precios-confiables-wu-1-rol-identidad
- Nota: `gh` no está disponible en el entorno; la creación del PR requiere acción manual o instalación de GitHub CLI.

### Rollback boundary

Revertir únicamente:
- `api/models/event.model.js`: quitar `min: 0` de `horario.costoExtension`.
- `api/config/routes.config.js`: eliminar `optionalAuth` y restaurar middleware inline del PATCH.
- `api/controllers/events.controllers.js`: eliminar `isAdmin`, `applyClientProjection`, proyección por rol en `create`/`update`, restaurar 403 de estado, quitar `validateModifiedOnly`.
- Borrar `api/tests/role-based-fields.test.js` y `api/tests/helpers/eventFixtures.js`.
- Revertir `api/tests/events.test.js:701-705`.

### Requisitos cubiertos

- `role-based-event-fields/REQ-01` — `costoExtra` solo escribible por admin.
- `role-based-event-fields/REQ-02` — campos administrativos no escribibles por clientes.
- `role-based-event-fields/REQ-03` — `tipo: 'bloqueo'` solo para admin.
- `role-based-event-fields/REQ-04` — admin conserva capacidades completas.
- `role-based-event-fields/REQ-05` — estado en CREATE para clientes.
- `server-price-authority/REQ-07` (parcial, protección de ediciones inocuas) — `validateModifiedOnly: true`.

## TASK-02: CREATE — whitelist de precios y recálculo desde catálogo

### Estado

Completado.

### Alcance implementado

- `api/controllers/events.controllers.js`
  - Nuevo helper `stripClientPriceSnapshots(body, admin)` que descarta `precioTotal` y todos los snapshots de precio (`precioApplied`, `precioUnitario`, `precioTallerApplied`, `precioPersonajeApplied`, `precioPinataApplied`, `precioCatalogoApplied`, `costoExtension`) del payload de CREATE.
  - Preserva `detalles.extras.costoExtra` cuando el solicitante es admin (descuento/ajuste legítimo, no un precio de catálogo).
  - `create` invoca `stripClientPriceSnapshots(req.body, admin)` para todos los roles, después de la proyección por rol de TASK-01.
- `api/tests/helpers/eventFixtures.js`
  - Nuevo helper `createFullConfig()` con catálogo completo: menú, comida de adultos, talleres, personajes, piñata y precios de extensión.
- `api/tests/price-authority.test.js`
  - Suite nueva "Autoridad de precio en CREATE" con 10 tests.

### Tests

- Nuevo `api/tests/price-authority.test.js` (10 tests):
  - REQ-01: precio manipulado por cliente no se usa; snapshot enviado no queda almacenado.
  - REQ-02: snapshots calculados desde catálogo para menú, taller, personaje, piñata, catálogo, extensión y comida de adultos.
  - REQ-03: `precioTotal` recalculado server-side.
  - REQ-08: respuestas (GET público) incluyen snapshots.
  - Casos límite: `precioUnitario: 0`, payload PWA con `precioTotal`, admin con snapshots falsos conservando `costoExtra`.

### Evidencia RED → GREEN

- Primera corrida de `price-authority.test.js`: 4 fallos / 10 tests (RED).
- Tras implementar `stripClientPriceSnapshots`: 10/10 tests verdes.
- Suite completa API: **210 tests pasan** (200 anteriores + 10 nuevos).
- Suite web: **138 tests pasan**, sin regresiones.

### Comandos de verificación

```bash
cd api && npx jest tests/price-authority.test.js --setupFilesAfterEnv ./tests/setup.js --no-coverage
cd api && npm test
cd web && npm run test:run
```

### Commit

- Hash: `d886f1c`
- Mensaje: `feat(api): enforce server-side price snapshots on create`
- Ficheros: `api/controllers/events.controllers.js`, `api/tests/helpers/eventFixtures.js`, `api/tests/price-authority.test.js`
- Hook GGA: PASSED.

### PR

- Rama: `feat/precios-confiables-wu-2-create-precios`
- Base: `feat/precios-confiables-wu-1-rol-identidad`
- URL de creación manual: https://github.com/FeliOjedaRuiz/neverland-web/compare/feat/precios-confiables-wu-1-rol-identidad...feat/precios-confiables-wu-2-create-precios?expand=1
- Nota: `gh` no está disponible en el entorno; la creación del PR requiere acción manual o instalación de GitHub CLI.

### Rollback boundary

Revertir únicamente:
- `api/controllers/events.controllers.js`: eliminar `stripClientPriceSnapshots` y su invocación en `create`.
- Borrar `api/tests/price-authority.test.js`.
- Revertir la adición de `createFullConfig` en `api/tests/helpers/eventFixtures.js`.

### Requisitos cubiertos

- `server-price-authority/REQ-01` — whitelist de campos de precio en CREATE.
- `server-price-authority/REQ-02` — cálculo de snapshots desde catálogo en CREATE.
- `server-price-authority/REQ-03` — recálculo de `precioTotal` en CREATE.
- `server-price-authority/REQ-08` — respuestas con snapshots.
- `server-price-authority/REQ-09` — comida de adultos resuelta por catálogo en CREATE.
- `role-based-event-fields/REQ-01` — admin conserva `costoExtra` (no tratado como snapshot de precio).

## Próxima work unit

- **TASK-03**: CREATE — validación de `menuId` solo para reservas.
  - Base: rama de PR 2 (`feat/precios-confiables-wu-2-create-precios`).
  - Foco: `events.controllers.js#create` — validar `menuId` contra `Config.menusNiños` solo para `tipo: 'reserva'`, 400 descriptivo sin crear documento.
  - Tests: `api/tests/menu-id-validation.test.js`.

## Notas

- El diff real fue de ~465 líneas (ligeramente por encima de las ~400 estimadas, pero dentro del presupuesto de 800 líneas por PR).
- La proyección de precios añadida en TASK-01 es defensiva; la autoridad de precio completa (incluyendo recalcificación de `costoExtension` en PATCH) se implementa en TASK-02/TASK-04.
