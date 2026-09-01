# Tasks: Catálogo Genérico de Extras

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 650–850 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Backend: models, controllers, services, mailer | PR 1 (base = `feat/catalogo-extras`) | `cd api && npm test` | `node -e "require('./api/models/config.model')"` — verify schema loads | Revert WU1 files; frontend ignores missing fields |
| 2 | Booking/UI: client-facing catalog selection + pricing | PR 2 (base = PR 1 branch) | `cd web && npm run test:run` | `npm run dev` → booking flow manual smoke | Revert WU2 files; backend endpoints still work |
| 3 | Admin, scripts, tests | PR 3 (base = PR 2 branch) | `cd api && npm test && cd ../web && npm run test:run` | Admin panel manual smoke | Revert WU3 files; core flow unaffected |

---

## Work Unit 1: Backend Foundation

**Commit**: `feat(api): extras catalog model + price calculation + Piñata backcompat`
**Estimated lines**: ~200–280

### Dependency Graph (WU1)

```
WU1.1 (Config schema) ──┐
WU1.2 (Event schema)  ──┤
                        ├── WU1.3 (Config controller bootstrap)
                        ├── WU1.4 (calculateEventPrice)
                        │     └── WU1.5 (PATCH invalidation)
                        ├── WU1.6 (Google service)
                        └── WU1.7 (Mailer)
```

- [ ] **1.1** — `api/models/config.model.js`: Add `extrasCatalogo` subdocument array to Config schema
  - **What**: Add schema `{ id: String, slug: { type: String, required: true }, nombre: String, descripcion: String, precio: { type: Number, min: 0, default: 0 }, imageUrl: String, suspended: { type: Boolean, default: false }, active: { type: Boolean, default: true } }` as `extrasCatalogo: [Schema]` field
  - **Dependencies**: None
  - **Lines**: ~20
  - **Acceptance**: `Config.schema.path('extrasCatalogo')` is defined; existing tests still pass

- [ ] **1.2** — `api/models/event.model.js`: Add `catalogoItemIds` and `precioCatalogoApplied` to `detalles.extras`
  - **What**: Add `catalogoItemIds: { type: [String], default: [] }` and `precioCatalogoApplied: Number` inside `detalles.extras` subdocument
  - **Dependencies**: None
  - **Lines**: ~15
  - **Acceptance**: `Event.schema.path('detalles.extras.catalogoItemIds')` is defined; existing events with no catalog fields still load

- [ ] **1.3** — `api/controllers/config.controllers.js`: Idempotent Piñata seed in bootstrap
  - **What**: In the config bootstrap/init logic, after ensuring Config document exists, check if `extrasCatalogo` has an item with `slug === 'pinata'`. If not, push `{ id: 'pinata', slug: 'pinata', nombre: 'Piñata Neverland', descripcion: 'Piñata temática Neverland', precio: 15, imageUrl: '', suspended: false, active: true }`. Make it idempotent (no duplicate on re-run).
  - **Dependencies**: 1.1
  - **Lines**: ~25
  - **Acceptance**: Calling bootstrap twice produces exactly one Piñata entry; `GET /config` returns `extrasCatalogo` with Piñata

- [ ] **1.4** — `api/controllers/events.controllers.js`: Update `calculateEventPrice` to sum catalog items + Piñata dual-write
  - **What**: In `calculateEventPrice` (around line 54–179): (a) resolve each `catalogoItemIds` entry against Config `extrasCatalogo` where `active && !suspended`, (b) sum their prices into `precioCatalogoApplied`, (c) if `'pinata'` is in `catalogoItemIds`, also set `pinata: true` and `precioPinataApplied` to the Piñata item's precio, (d) exclude `pinata` slug from the generic sum to avoid double-counting (the legacy block already handles Piñata price). Snapshot `precioCatalogoApplied` on the event.
  - **Dependencies**: 1.1, 1.2
  - **Lines**: ~50
  - **Acceptance**: Event with `catalogoItemIds: ['pinata', 'other-slug']` gets `precioCatalogoApplied` = sum of non-pinata items; `pinata: true` and `precioPinataApplied` are set; total price includes both

- [ ] **1.5** — `api/controllers/events.controllers.js`: PATCH invalidation in both passes for catalog fields
  - **What**: In PATCH handler (around line 468–521): (a) first pass (delete-on-copy): compare sorted `catalogoItemIds` arrays; if changed, invalidate `precioCatalogoApplied` on the copy, (b) second pass (event.set): if `catalogoItemIds` changed, recalculate `precioCatalogoApplied` and sync Piñata dual-write. Also invalidate catalog snapshot when base prices/menus/horario change (existing rule extended).
  - **Dependencies**: 1.4
  - **Lines**: ~45
  - **Acceptance**: PATCH that changes `catalogoItemIds` recalculates snapshot; PATCH that changes base price also recalculates catalog snapshot; both passes handle catalog correctly

- [ ] **1.6** — `api/services/google.service.js`: Include catalog items in Google Calendar event description
  - **What**: In the Calendar event description builder, after existing extras lines, iterate `catalogoItemIds` and append each item's `nombre` + applied price from snapshot. Skip if array is empty. Use snapshot values (not live Config) for historical accuracy.
  - **Dependencies**: 1.2
  - **Lines**: ~25
  - **Acceptance**: Calendar event description includes "Piñata Neverland: 15€" when Piñata is selected; no catalog lines when array is empty

- [ ] **1.7** — `api/config/mailer.config.js`: Add HTML block for catalog items in confirmation email
  - **What**: In the email HTML template, after existing extras section, add a loop over `catalogoItemIds` rendering each item name + price from snapshot. Style consistent with existing email design. Skip block if array is empty.
  - **Dependencies**: 1.2
  - **Lines**: ~30
  - **Acceptance**: Email HTML includes catalog items with names and prices; empty catalog produces no extra HTML

---

## Work Unit 2: Booking/UI

**Commit**: `feat(web): client can select catalog extras in booking and budget flows`
**Estimated lines**: ~250–340

### Dependency Graph (WU2)

```
WU2.1 (bookingUtils) ──┐
                       ├── WU2.2 (BookingPage)
                       ├── WU2.3 (BudgetPage)
                       │     ├── WU2.4 (Step7Extras)
                       │     ├── WU2.5 (Step8Summary)
                       │     └── WU2.6 (StepBudgetSummary)
                       └── WU2.7 (PricingPage)
```

- [x] **2.1** — `web/src/utils/bookingUtils.js`: Add catalog filter + sum helpers
  - **What**: Add `filterActiveCatalog(items)` returning `items.filter(i => i.active && !i.suspended)`, `sumCatalogPrices(selectedIds, catalogItems)` returning total price of selected items, and `getCatalogItemById(id, catalogItems)` returning the item or null. Export all three.
  - **Dependencies**: None (pure utils)
  - **Lines**: ~25
  - **Acceptance**: `filterActiveCatalog` excludes suspended/inactive; `sumCatalogPrices` returns correct sum; unit tests pass

- [x] **2.2** — `web/src/pages/BookingPage.jsx`: Load `extrasCatalogo`, add `catalogoItemIds` to formData default
  - **What**: In the config fetch (around line 46–103), extract `extrasCatalogo` from config response. Initialize `catalogoItemIds: []` in formData defaults. Pass `extrasCatalogo` as prop to `Step7Extras`, `Step8Summary`.
  - **Dependencies**: 1.1 (config returns `extrasCatalogo`)
  - **Lines**: ~20
  - **Acceptance**: BookingPage loads catalog from config; formData includes `catalogoItemIds`; Step7Extras receives `extrasCatalogo` prop

- [x] **2.3** — `web/src/pages/BudgetPage.jsx`: Same as WU2.2 for budget flow
  - **What**: Mirror WU2.2 changes: extract `extrasCatalogo`, initialize `catalogoItemIds: []`, pass to `Step7Extras` and `StepBudgetSummary`.
  - **Dependencies**: 1.1
  - **Lines**: ~20
  - **Acceptance**: BudgetPage loads catalog; formData includes `catalogoItemIds`; child components receive prop

- [x] **2.4** — `web/src/components/booking/Step7Extras.jsx`: Piñata toggle + "Otros extras" checkboxes block
  - **What**: Keep existing Piñata toggle as-is (visual dedicated toggle). Below it, add a section "Otros extras" rendering `filterActiveCatalog(extrasCatalogo).filter(i => i.slug !== 'pinata')` as checkboxes. Each checkbox toggles its `id` in `catalogoItemIds` array. Piñata toggle adds/removes `'pinata'` from `catalogoItemIds` (in addition to existing `pinata` boolean). Show item name, description snippet, and price per checkbox. Handle empty catalog gracefully (no section rendered).
  - **Dependencies**: 2.1, 2.2 or 2.3
  - **Lines**: ~60
  - **Acceptance**: Piñata toggle still works; other catalog items appear as checkboxes; selecting updates `catalogoItemIds`; suspended/inactive items are hidden

- [x] **2.5** — `web/src/components/booking/Step8Summary.jsx`: Render catalog items + Piñata in summary
  - **What**: After existing extras summary lines, iterate `catalogoItemIds` and render each selected item's name + price. Show Piñata separately (existing behavior preserved). Show `precioCatalogoApplied` total. Handle empty array (no catalog section). Handle items not found in catalog (show ID as fallback).
  - **Dependencies**: 2.1, 2.2
  - **Lines**: ~40
  - **Acceptance**: Summary shows selected catalog items with prices; Piñata still shows in its dedicated section; total includes catalog

- [x] **2.6** — `web/src/components/booking/StepBudgetSummary.jsx`: Same as WU2.5 for budget summary
  - **What**: Mirror WU2.5 changes in the budget summary component. Render catalog items, prices, and total.
  - **Dependencies**: 2.1, 2.3
  - **Lines**: ~35
  - **Acceptance**: Budget summary shows catalog items and prices; total is correct

- [x] **2.7** — `web/src/pages/PricingPage.jsx`: New "Extras Adicionales" section
  - **What**: Fetch `extrasCatalogo` from config (already available via context or fetch). Add a public "Extras Adicionales" section showing `filterActiveCatalog(items)` with name, description, price, and image. Do not expose suspended/inactive items. Style consistent with existing pricing sections.
  - **Dependencies**: 1.1
  - **Lines**: ~50
  - **Acceptance**: PricingPage shows active catalog items with prices; suspended/inactive items are hidden; no internal/admin data exposed

---

## Work Unit 3: Admin + Scripts + Tests

**Commit**: `feat(admin+tests): catalog admin CRUD + views + scripts + test coverage`
**Estimated lines**: ~200–280

### Dependency Graph (WU3)

```
WU3.1 ── WU3.2 (ConfigurationPanel CRUD + image)
WU3.3 ── WU3.4 (ReservationDetailView + modal editor)
WU3.5 (ReservationDetailModal badge)
WU3.6 ── WU3.7 (Scripts)
WU3.8 (API tests: events)
WU3.9 (API tests: budget-flow)
WU3.10 (Web tests: bookingUtils)
WU3.11 (Web tests: Step8Summary)
```

- [ ] **3.1** — `web/src/components/admin/ConfigurationPanel.jsx`: New "Extras Adicionales" accordion + grid + modal editor
  - **What**: Add a new `AccordionSection` titled "Extras Adicionales" below existing sections. Render `extrasCatalogo` as a grid of cards (name, price, active/suspended badges). Add button opens modal with fields: nombre, slug (auto-generated from nombre on create, locked on edit), descripcion, precio, imageUrl, active toggle, suspended toggle. Use existing `updateListItem` pattern, `ToggleSwitch`, and validation (unique slug, non-negative price, required nombre). Save via existing config update endpoint.
  - **Dependencies**: 1.1, 1.3
  - **Lines**: ~80
  - **Acceptance**: Admin can create/edit/toggle active/suspend catalog items; slug is immutable on edit; duplicate slug rejected; grid shows all items

- [ ] **3.2** — `web/src/components/admin/ConfigurationPanel.jsx`: Cloudinary image upload + slug lock on edit
  - **What**: In the catalog item modal, add Cloudinary image upload using existing `handleImageUpload` utility. Show preview of uploaded image. On edit mode, disable/slug field (read-only). Generate slug from nombre on create (lowercase, hyphens, no special chars).
  - **Dependencies**: 3.1
  - **Lines**: ~30
  - **Acceptance**: Image upload works via Cloudinary; slug auto-generates on create; slug is locked on edit

- [ ] **3.3** — `web/src/components/admin/ReservationDetailView.jsx`: Catalog items cards + legacy badge
  - **What**: In the extras section of reservation detail, if `catalogoItemIds` exists and is non-empty, render each item as a card with name (from catalog or fallback to ID if deleted) and applied price from snapshot. If `catalogoItemIds` is missing/empty but legacy extras exist (`pinata: true`, etc.), show existing behavior with a `(legacy)` badge. Show `precioCatalogoApplied` total.
  - **Dependencies**: 1.2
  - **Lines**: ~40
  - **Acceptance**: Reservations with catalog show item cards; legacy reservations show badge; deleted items show ID fallback

- [ ] **3.4** — `web/src/components/admin/ReservationDetailView.jsx`: Catalog editor modal
  - **What**: Add an "Editar extras" button that opens a modal allowing admin to toggle catalog items on/off for the reservation. On save, PATCH the event with updated `catalogoItemIds`. Show price preview before saving. Recalculate happens server-side.
  - **Dependencies**: 3.3
  - **Lines**: ~45
  - **Acceptance**: Admin can add/remove catalog items from existing reservation; price recalculates after save

- [ ] **3.5** — `web/src/components/admin/ReservationDetailModal.jsx`: Catalog badge in modal view
  - **What**: In the modal's extras display, show catalog items (names + prices) if `catalogoItemIds` is present. Show `(legacy)` badge if missing. Keep existing Piñata display for legacy.
  - **Dependencies**: 1.2
  - **Lines**: ~25
  - **Acceptance**: Modal shows catalog items for new reservations; legacy badge appears for old ones

- [ ] **3.6** — `api/scripts/analyze-stale-snapshots.js`: Detect catalog discrepancies
  - **What**: Extend the analysis script to check: (a) events with `catalogoItemIds` where `precioCatalogoApplied` doesn't match the sum of current catalog prices, (b) events with `pinata: true` but no `'pinata'` in `catalogoItemIds` (legacy not migrated). Report discrepancies with event ID, expected vs actual. Skip events without `catalogoItemIds` (legacy-only).
  - **Dependencies**: 1.1, 1.2
  - **Lines**: ~35
  - **Acceptance**: Script reports catalog snapshot discrepancies; legacy events are skipped; output is verifiable

- [ ] **3.7** — `api/scripts/fix-stale-snapshots.js`: Fix catalog snapshots
  - **What**: Extend the fix script to recalculate `precioCatalogoApplied` for events with `catalogoItemIds` where snapshot is stale. Use current catalog prices from Config. Do NOT modify events without `catalogoItemIds` (legacy). Report fixed count and skipped count.
  - **Dependencies**: 3.6
  - **Lines**: ~30
  - **Acceptance**: Script fixes stale catalog snapshots; legacy events untouched; re-run is idempotent

- [ ] **3.8** — `api/tests/events.test.js`: Tests for `calculateEventPrice` + PATCH with catalog
  - **What**: Add test cases: (a) event with catalog items sums prices correctly, (b) Piñata dual-write sets `pinata: true` + `precioPinataApplied`, (c) no double-counting of Piñata, (d) PATCH changing `catalogoItemIds` recalculates snapshot, (e) PATCH changing base price recalculates catalog snapshot, (f) invalid/suspended catalog item ID returns 400, (g) empty `catalogoItemIds` produces 0 `precioCatalogoApplied`.
  - **Dependencies**: 1.4, 1.5
  - **Lines**: ~60
  - **Acceptance**: All new test cases pass; existing tests unaffected

- [ ] **3.9** — `api/tests/budget-flow.test.js`: Full flow with catalog + Piñata sync
  - **What**: Add integration test: (a) create event via budget flow with catalog items, (b) verify `catalogoItemIds` persisted, (c) verify `precioCatalogoApplied` snapshot, (d) verify Piñata dual-write, (e) PATCH event to change catalog selection, (f) verify snapshot recalculated, (g) legacy event without catalog still works.
  - **Dependencies**: 1.4, 1.5
  - **Lines**: ~50
  - **Acceptance**: Full budget flow test passes with catalog items; legacy flow unaffected

- [ ] **3.10** — `web/src/utils/bookingUtils.test.js`: Unit tests for catalog helpers
  - **What**: Test `filterActiveCatalog`: returns only `active && !suspended` items. Test `sumCatalogPrices`: sums correctly, handles empty selection, handles missing IDs. Test `getCatalogItemById`: finds item, returns null for missing.
  - **Dependencies**: 2.1
  - **Lines**: ~30
  - **Acceptance**: All helper tests pass

- [ ] **3.11** — `web/src/components/booking/Step8Summary.test.jsx`: Render with catalog items
  - **What**: Test: (a) renders catalog items with names and prices, (b) renders Piñata in dedicated section, (c) handles empty `catalogoItemIds` gracefully, (d) shows total including catalog, (e) handles deleted/missing catalog item (shows ID fallback), (f) legacy reservation without `catalogoItemIds` renders correctly.
  - **Dependencies**: 2.5
  - **Lines**: ~40
  - **Acceptance**: All render tests pass; edge cases covered

---

## Verification Checklist

- [ ] `cd web && npm run test:run` passes
- [ ] `cd api && npm test` passes
- [ ] Manual smoke: client selects Piñata XL + another extra in booking → Step8 shows both → email includes both → Calendar includes both
- [ ] Manual smoke: admin creates new extra → appears in booking checkboxes → client selects it → admin sees it in reservation detail
- [ ] Manual smoke: legacy reservation (no `catalogoItemIds`) shows Piñata with `(legacy)` badge in admin
- [ ] Manual smoke: PricingPage shows active catalog items, hides suspended

## Commit Strategy

| WU | Commit Message |
|----|---------------|
| 1 | `feat(api): extras catalog model + price calculation + Piñata backcompat` |
| 2 | `feat(web): client can select catalog extras in booking and budget flows` |
| 3 | `feat(admin+tests): catalog admin CRUD + views + scripts + test coverage` |
