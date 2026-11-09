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

## Próxima work unit

- **TASK-02**: CREATE — whitelist de precios y recálculo desde catálogo.
  - Base: rama de PR 1 (`feat/precios-confiables-wu-1-rol-identidad`).
  - Foco: `api/controllers/events.controllers.js#create` — descartar todos los campos de precio del payload, `calculateEventPrice` como única fuente.
  - Tests: parte CREATE de `api/tests/price-authority.test.js`.

## Notas

- El diff real fue de ~465 líneas (ligeramente por encima de las ~400 estimadas, pero dentro del presupuesto de 800 líneas por PR).
- La proyección de precios añadida en TASK-01 es defensiva; la autoridad de precio completa (incluyendo recalcificación de `costoExtension` en PATCH) se implementa en TASK-02/TASK-04.
