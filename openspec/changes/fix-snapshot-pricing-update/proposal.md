# Proposal: Fix Snapshot Pricing Update

## Intent

When a user edits a reservation and changes a pricing-affecting selection (workshop, character, piñata, children's menu), the budget keeps the OLD snapshot price instead of recalculating. The bug exists at two layers: backend merge-order error (primary) and frontend leaking stale snapshots (secondary).

## Scope

### In Scope
- Fix backend invalidation: delete stale snapshots from merged `event.detalles` after the merge, not just from `oldDetalles` before it
- Fix frontend: strip snapshot pricing fields (`precioTallerApplied`, `precioPersonajeApplied`, `precioPinataApplied`, `precioApplied`, `menuNombre`) from form data before sending to API
- Add regression test: create → update workshop → assert `precioTotal` recalculates correctly

### Out of Scope
- Changing `calculateEventPrice` algorithm
- Schema changes or new API endpoints
- Client-side reservation edit flow (the 72h window) — handled by the same fix
- Frontend test suite expansion beyond the existing testing pattern

## Capabilities

### New Capabilities
None — this is a bugfix within existing capabilities.

### Modified Capabilities
None — spec-level behavior does not change. Price recalculation on selection change is already the documented contract; the implementation is what is broken.

## Approach

### Backend (Primary Defense)
In `events.controllers.js` `update` function, lines 486-489: after the merge, re-apply snapshot invalidation on `event.detalles` itself. The same invalidation conditions used on `oldDetalles` (lines 464-476) MUST also clean the final merged result so snapshots from `newDetalles` do not survive.

```js
// After merge (post line 489), re-clean:
if (newDetalles.niños?.menuId && String(newDetalles.niños.menuId) !== String(oldDetalles.niños?.menuId)) {
  delete event.detalles.niños.precioApplied;
  delete event.detalles.niños.menuNombre;
}
if (newDetalles.extras?.taller && newDetalles.extras.taller !== oldDetalles.extras?.taller) {
  delete event.detalles.extras.precioTallerApplied;
}
if (newDetalles.extras?.personaje && newDetalles.extras.personaje !== oldDetalles.extras?.personaje) {
  delete event.detalles.extras.precioPersonajeApplied;
}
if (newDetalles.extras?.pinata !== undefined && newDetalles.extras.pinata !== oldDetalles.extras?.pinata) {
  delete event.detalles.extras.precioPinataApplied;
}
```

### Frontend (Secondary Defense)
In `ExtrasEdit` onSave handler (line 2459) and `MenusEdit` onSave handler (line 2210): delete snapshot fields from the payload before calling `onSave`. These are server-authoritative values that clients MUST NOT send during updates.

```js
// In ExtrasEdit onSave:
const clean = { ...formData };
delete clean.precioTallerApplied;
delete clean.precioPersonajeApplied;
delete clean.precioPinataApplied;
onSave(clean);
```

```js
// In MenusEdit onSave:
const cleanNiños = { ...niñosExt };
delete cleanNiños.precioApplied;
// menuNombre is set from config lookup — keep it, but let backend recalculate
onSave({ ...current, niños: cleanNiños, ... });
```

### Test
Add to `api/tests/budget-flow.test.js`: create reservation with workshop A, PATCH to workshop B, assert `precioTotal` recalculates and `precioTallerApplied` matches workshop B price.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `api/controllers/events.controllers.js:485-490` | Modified | Add post-merge invalidation of snapshots |
| `web/src/components/admin/ReservationDetailView.jsx` | Modified | Strip snapshot fields in `ExtrasEdit` and `MenusEdit` onSave |
| `api/tests/budget-flow.test.js` | Modified | Add regression test for update + recalculate |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Frontend stripping removes `precioApplied` when menu selection did NOT change, causing unnecessary recalculation | Low | Backend will recalculate anyway — no functional harm, minimal perf cost |
| Post-merge invalidation could interfere with other update flows (client info, observations) | Low | Invalidation is conditional on selection changes; non-detalles updates skip the block entirely |

## Rollback Plan

Revert the commit. No schema or API contract changes. The fix is purely defensive deletion of fields at lines 485-490 and in two onSave handlers. Git revert restores original behavior.

## Dependencies

None — no external API, schema, or package changes.

## Success Criteria

- [ ] Updating workshop on an existing reservation recalculates `precioTotal` with the new workshop price
- [ ] Updating character, piñata, or children's menu also recalculates correctly
- [ ] Regression test passes: create → PATCH → assert new price
- [ ] Existing test suite passes unchanged
