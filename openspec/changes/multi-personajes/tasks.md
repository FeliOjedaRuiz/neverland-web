# Tasks: Multi-Personajes — Hasta 3 personajes por evento

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~645 |
| 400-line budget risk | **High** |
| Chained PRs recommended | **Yes** |
| Suggested split | PR 1 → PR 2 → PR 3 (feature-branch-chain) |
| Delivery strategy | auto-forecast |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Base | Lines |
|------|------|------|-------|
| PR 1 | Backend: model, pricing, services | `feature/multi-personajes` | ~195 |
| PR 2 | Frontend: UX, state, summaries, selector | PR 1 branch | ~260 |
| PR 3 | Admin, pricing page, tests | PR 2 branch | ~190 |

---

## Phase 1: Backend Model & Migration (Foundation)

- [ ] 1.1 `api/models/event.model.js` — Replace `personaje: { type: String, default: 'ninguno' }` with `personajes: { type: [String], default: [], validate: { validator: v => v.length <= 3, message: 'Máximo 3 personajes' } }`. Keep `precioPersonajeApplied`.
- [ ] 1.2 `api/models/config.model.js` — Add `precioPack3Personajes: { type: Number, default: 100 }` inside `preciosExtras` schema.
- [ ] 1.3 `api/scripts/migrate-personaje-to-array.js` — Create idempotent migration script. Iterate events, skip if `personajes` exists. Convert `'Elsa'`→`['Elsa']`, `'ninguno'`/null/empty→`[]`. Recalculate `precioPersonajeApplied`. Add `precioPack3Personajes: 100` to Config if absent.
- [ ] 1.4 `api/controllers/events.controllers.js:validateEventData()` — Add: `if (detalles.extras?.personajes?.length > 3) throw createError(400, 'Máximo 3 personajes')`.

## Phase 2: Backend Pricing Logic

- [ ] 2.1 `api/controllers/events.controllers.js:calculateEventPrice()` — Replace `personaje !== 'ninguno'` check with array logic: 0→0, 1→unitPrice, 2→unitPrice×2, 3→packPrice. Snapshot `precioPersonajeApplied` as total cost. Add `validateEventData` call for personajes.
- [ ] 2.2 `api/controllers/events.controllers.js:update()` — Replace `personaje !== oldDetalles.extras?.personaje` string comparison with sorted array comparison: `[...(A||[])].sort().join(',') !== [...(B||[])].sort().join(',')`. Invalidate `precioPersonajeApplied` when arrays differ by content.

## Phase 3: Backend Service Integration

- [ ] 3.1 `api/services/google.service.js` — Change `personaje` string to `(personajes||[]).join(', ')` in description lines 118 and 141.
- [ ] 3.2 `api/config/mailer.config.js` — Change line 210-213: render `(detalles.extras.personajes||[]).join(', ')` instead of single `personaje` string. Show "Sin personaje" when array empty.

## Phase 4: Frontend State & Utilities

- [ ] 4.1 `web/src/pages/BookingPage.jsx` — Change state init `personaje: null` → `personajes: []`. Update DEFAULT_CONFIG to include `precioPack3Personajes: 100`.
- [ ] 4.2 `web/src/pages/BudgetPage.jsx` — Same change as 4.1.
- [ ] 4.3 `web/src/utils/bookingUtils.js` — Replace `personaje !== 'ninguno'` check with array logic: read `personajes`, calculate 1=unit, 2=unit×2, 3=packPrice, 0=0.

## Phase 5: Frontend Selector (Step6Characters)

- [ ] 5.1 `web/src/components/booking/Step6Characters.jsx` — Change `selectCharacter()` to toggle array: push if not present, filter if present. Check `personajes.length < 3` before adding; show toast "El máximo es 3 personajes" on 4th attempt (3s auto-dismiss). Replace `selectedCharName` checks with `includes()`.
- [ ] 5.2 Same file — Switch button: "Sin Visita" when empty, "Quitar todos" when >=2 selected. Clicking "Quitar todos" sets `personajes: []`.
- [ ] 5.3 Same file — Dynamic price display below grid: 0→none, 1→"40€", 2→"80€", 3→"Pack 3: 100€".
- [ ] 5.4 Same file — Card selection: apply checkmark to all selected (not just last). Remove single-select overlay replacement logic.
- [ ] 5.5 Same file — Modal button: show "Quitar" when already selected, "Añadir" when not. Clicking toggles accordingly.

## Phase 6: Frontend Summary Views

- [ ] 6.1 `web/src/components/booking/Step8Summary.jsx` — Replace single-character render (lines 111-137) with multi-char list: each selected character shows avatar+name stacked. For 3 characters, show "Pack 3" label. Price shows total.
- [ ] 6.2 `web/src/components/booking/StepBudgetSummary.jsx` — Same multi-char rendering as 6.1.

## Phase 7: Admin Views

- [ ] 7.1 `web/src/components/admin/ReservationDetailView.jsx` — Read view: replace single-char display (line ~956) with avatar chips for each character in `personajes` array. Show "Pack" badge for 3 chars.
- [ ] 7.2 Same file — Edit picker (line ~2251): convert single-select `formData.personaje` to multi-toggle `formData.personajes` array. Selected chars appear as removable chips above picker. Picker stays open on selection. Enforce max 3.
- [ ] 7.3 `web/src/components/admin/ConfigurationPanel.jsx` — Add editable input for `precioPack3Personajes` in extras section (near line ~1450). Number input, saves via existing Config API.

## Phase 8: Pricing Landing Page

- [ ] 8.1 `web/src/pages/PricingPage.jsx` — Below `extras.personaje` price (line ~390), add "Pack 3: 100€" subtitle text using `extras.precioPack3Personajes`.

## Phase 9: Tests (TDD — write alongside implementation)

- [ ] 9.1 `api/tests/budget-flow.test.js` — Add test cases: 0 chars→0€, 1→40€, 2→80€, 3→100€ (pack). Test snapshot invalidation on array change, NO invalidation on reorder.
- [ ] 9.2 `web/src/utils/bookingUtils.test.js` — Mirror backend: 0/1/2/3 char pricing assertions. Test pack price default 100€.
- [ ] 9.3 `web/src/components/booking/Step8Summary.test.jsx` — Update mocks: `personajes: ['Elsa']` instead of `personaje: 'Elsa'`. Test multi-char rendering and empty array "Sin personaje".
