# Tasks: Fix Snapshot Pricing Update

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~47 (10 backend + 12 frontend + 30 test - 5 boilerplate) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Backend Fix (Primary Defense)

- [ ] 1.1 `api/controllers/events.controllers.js` — After line 489 (post-merge), add invalidation pass that deletes stale snapshot fields from merged `event.detalles` when selections changed between old and new. Cover five fields: `precioApplied`, `menuNombre`, `precioTallerApplied`, `precioPersonajeApplied`, `precioPinataApplied`. Match existing invalidation guard conditions (lines 464-476).

## Phase 2: Frontend Fix (Secondary Defense)

- [ ] 2.1 `web/src/components/admin/ReservationDetailView.jsx` — ExtrasEdit onSave (line 2459): destructure `precioTallerApplied`, `precioPersonajeApplied`, `precioPinataApplied` from `formData` before calling `onSave(cleanExtras)`.

- [ ] 2.2 `web/src/components/admin/ReservationDetailView.jsx` — MenusEdit onSave (line 2210): destructure `precioApplied` and `menuNombre` from `niñosExt`, reconstruct with correct `menuNombre` from config lookup, and pass cleaned object to `onSave`.

## Phase 3: Regression Test

- [ ] 3.1 `api/tests/budget-flow.test.js` — Add 'Pintura' workshop (`{ name: 'Pintura', priceBase: 20, pricePlus: 25 }`) to global config `beforeEach`. Add describe block: create reservation with taller 'Magia' → PATCH taller to 'Pintura' → assert `precioTotal` decreased by 5€ and `precioTallerApplied` equals 20.

- [ ] 3.2 Run full test suite: `cd api && npm test && cd ../web && npm run test:run`. All 6 existing budget-flow tests must pass unchanged.
