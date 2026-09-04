# Tasks: Catálogo Genérico de Extras

> Status legend: `[x]` done · `[~]` in-progress · `[ ]` pending · `[!]` blocked

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~850 (full feature) |
| 400-line budget risk | ~~High~~ **Low** (tracker already merged, single PR strategy used) |
| Chained PRs recommended | No (3 WUs merged into single tracker branch) |
| Delivery strategy | ~~ask-on-risk~~ **single-pr** (tracker → main when approved) |
| Chain strategy | stacked-to-main |
| Decision needed before apply | Yes (manual UX approval pending) |

---

## Work Unit 1 — Backend Foundation

**Status**: ✅ merged to tracker (`b50b545`, cherry-pick from `d1afbe2`)
**Tests**: 79/79 backend passing

- [x] **1.1** `api/models/config.model.js` — `extrasCatalogo[]` schema
- [x] **1.2** `api/models/event.model.js` — `catalogoItemIds` + `precioCatalogoApplied`
- [x] **1.3** `api/controllers/config.controllers.js` — Piñata seed idempotente en bootstrap (20€)
- [x] **1.4** `api/controllers/events.controllers.js` — `calculateEventPrice` con catálogo + dual-write
- [x] **1.5** `api/controllers/events.controllers.js` — PATCH invalidation en ambas pasadas
- [x] **1.6** `api/services/google.service.js` — Calendar description con catálogo
- [x] **1.7** `api/config/mailer.config.js` — HTML block para catálogo en email

---

## Work Unit 2 — Cliente (booking + budget)

**Status**: ✅ merged to tracker (`a3c1e53`)
**Tests**: 64/64 frontend passing

- [x] **2.1** `web/src/utils/bookingUtils.js` — `filterActiveCatalog`, `sumCatalogPrices`, `getCatalogItemById`
- [x] **2.2** `web/src/pages/BookingPage.jsx` — carga `extrasCatalogo`, inicializa `catalogoItemIds: []`
- [x] **2.3** `web/src/pages/BudgetPage.jsx` — mirror de 2.2
- [x] **2.4** `web/src/components/booking/Step7Extras.jsx` — checkboxes de catálogo activo (sin toggle Piñata)
- [x] **2.5** `web/src/components/booking/Step8Summary.jsx` — "Subtotal actividades y extras" inclusivo
- [x] **2.6** `web/src/components/booking/StepBudgetSummary.jsx` — mirror de 2.5
- [x] **2.7** `web/src/pages/PricingPage.jsx` — sección "Extras Adicionales"

---

## Work Unit 3 — Admin + Scripts + Tests

**Status**: ✅ merged to tracker (`34f4d9b`)

- [x] **3.1** `web/src/components/admin/ConfigurationPanel.jsx` — accordion "Extras Adicionales" + modal CRUD
- [x] **3.2** `web/src/components/admin/ConfigurationPanel.jsx` — Cloudinary image upload + slug generation
- [x] **3.3** `web/src/components/admin/ReservationDetailView.jsx` — cards catálogo + legacy badge
- [x] **3.4** `web/src/components/admin/ReservationDetailView.jsx` — modal editor ExtrasEdit
- [x] **3.5** `web/src/components/admin/ReservationDetailModal.jsx` — badge "Extras: N items"
- [x] **3.6** `api/scripts/analyze-stale-snapshots.js` — detección discrepancias
- [x] **3.7** `api/scripts/fix-stale-snapshots.js` — reparación snapshots
- [x] **3.8** `api/tests/events.test.js` — tests de `calculateEventPrice` + PATCH catálogo
- [x] **3.9** `api/tests/budget-flow.test.js` — flujo completo con catálogo + Piñata sync
- [x] **3.10** `web/src/utils/bookingUtils.test.js` — tests helpers catálogo
- [x] **3.11** `web/src/components/booking/Step8Summary.test.jsx` — render con catálogo

---

## Followups (refactor + polish)

**Status**: ✅ merged to tracker (varios commits)

- [x] **F.1** `41135fa` refactor(catalogo) — simplificar UX: sin `suspended`, sin `slug` visible, Piñata como item normal
- [x] **F.2** `833f5b9` fix(catalogo) — ocultar Piñata legacy del UI + limpieza BD + quitar "(incluye Piñata)"
- [x] **F.3** `5da2926` chore — restaurar `preciosExtras.pinata: 20` en BD antes de deploy
- [x] **F.4** `ddf491f` fix(admin) — precio visible en Actividad + subtotal incluye todas las secciones
- [x] **F.5** `548b2f1` fix(booking) — subtotal inclusivo en Step8 y StepBudget summaries
- [x] **F.6** `7ffe71c` fix(admin) — quitar (LEGACY), Sin actividad, preservar `precioPinataApplied` al guardar
- [x] **F.7** `c597ac2` fix(admin) — línea única "Subtotal actividades y extras" suma catálogo + legacy
- [x] **F.8** `0bef948` fix(admin) — ReferenceError `niñosExt` en ExtrasEdit (añadir prop `ninosCantidad`)
- [x] **F.9** `c6cb04c` fix(admin) — uniformar UI editor de extras: precio actividades, contraste, tamaño tipográfico
- [x] **F.10** `097c111` fix(admin) — menos rounded en cards seleccionadas + catálogo más claro
- [x] **F.11** `2fa2943` fix(admin) — badge pink `+X€` en extras seleccionados (consistencia con actividades)
- [x] **F.12** fix(events+admin) — sync Piñata legacy/catálogo en Calendar, email y editor; modal edición contenido/responsivo
- [x] **F.13** fix(booking) — modales de talleres, personajes y menús infantiles con proporción natural de imagen (sin recorte) y card adaptada
- [x] **F.14** feat(budget) — botón 'Comenzar' en step 1 de presupuesto y badge interactivo para avanzar

---

## Verification Checklist

- [x] `cd web && npm run test:run` — 65/65 passing
- [x] `cd api && npm test` — 79/79 passing
- [x] Manual smoke: cliente selecciona catálogo en booking → Step8 muestra ambos → email incluye catálogo → Calendar incluye catálogo
- [x] Manual smoke: admin crea/elimina items del catálogo → aparecen/desaparecen en booking checkboxes
- [x] Manual smoke: 6 reservas legacy (7EXGX7, 1MF328, 37ABWV, E82EHM, KWK6MQ, TO24JE) muestran Piñata con precio backcompat en admin
- [x] Manual smoke: PricingPage muestra catálogo activo, oculta suspendidos/inactivos

---

## Deploy Steps (pendiente)

1. Confirmar con usuario los últimos cambios UX (F.11).
2. Push final a `origin/feat/catalogo-extras` (ya hecho).
3. Abrir PR `feat/catalogo-extras` → `main` (Vercel preview auto).
4. Verificar preview end-to-end.
5. Merge PR → Vercel auto-deploy front, Render auto-deploy back.
6. Ejecutar `cleanup-legacy-pinata-config.js` en BD de producción después de deploy estable.
7. Opcional: `fix-stale-snapshots.js` para reparar `precioCatalogoApplied` stale.

---

## Commit Strategy (histórico)

| WU | Commit Message | Hash |
|----|---------------|------|
| 1 (original) | `feat(api): extras catalog model + price calculation + Piñata backcompat` | `d1afbe2` |
| 1 (tracker) | `feat(api): cherry-pick WU1 to tracker — extras catalog backend` | `b50b545` |
| 2 | `feat(web): client can select catalog extras in booking and budget flows` | `a3c1e53` |
| 3 | `feat(admin+tests): catalog admin CRUD + views + scripts + test coverage` | `34f4d9b` |
| F.1 | `refactor(catalogo): simplificar UX — un solo flag, sin slug visible, Piñata como item normal` | `41135fa` |
| F.2 | `fix(catalogo): ocultar Piñata legacy del UI + limpiar BD + quitar texto redundante` | `833f5b9` |
| F.3 | `chore(scripts): restaurar preciosExtras.pinata legacy en BD` | `5da2926` |
| F.4-F.11 | varios `fix(admin)` y `fix(booking)` | ver sección Followups |

---

## Environments

- **Local dev**: `web/.env.local` → `VITE_API_BASE_URL=http://192.168.1.216:8081/api/v1` (IP LAN para mobile). Actualizar si cambia la IP.
- **Backend local**: `api/.env` → `MONGODB_URI` local, `CORS_ORIGIN=http://localhost:5173`, `PORT=8080`, listen en `0.0.0.0`.
- **Producción front**: Vercel auto-deploy, `web/vercel.json` rewrites `/api/v1/*` → `https://neverland-api.onrender.com`.
- **Producción back**: Render auto-deploy al pushear a `main`.

---

## Estado actual del branch

- Branch: `feat/catalogo-extras`
- Commits ahead de main: 15 (todos los WUs + followups)
- Tests: 79/79 backend + 64/64 frontend
- Pushed: sí (`origin/feat/catalogo-extras`)
- main: limpio (WU1 revertido en `b1d992a`, nada desplegado aún)
