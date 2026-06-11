# Design: Fix Snapshot Pricing Update

## Technical Approach

Two-layer defense: backend deletes stale snapshots from merged `event.detalles` (post-merge invalidation), and frontend strips snapshot fields before sending PATCH payloads. The root cause is a merge-order defect — `oldDetalles` snapshots are deleted before merge, but `newDetalles` (from client payload) still carries stale `precioTallerApplied` / `precioPersonajeApplied` / `precioPinataApplied` / `precioApplied` values that survive the spread merge and signal `calculateEventPrice` to skip recalculation.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Fix location: post-merge vs pre-merge | Post-merge invalidation on `event.detalles` | Pre-merge would mutate `newDetalles` (request body). Post-merge cleans the final merged object — cleaner, no side effects on `req.body`. |
| Frontend defense: strip snapshots | Delete fields from `formData` / `niñosExt` before `onSave()` | Defense-in-depth. Backend fix is sufficient, but frontend should never send server-authoritative snapshots. Minimal change: destructure-and-rest pattern. |
| Test: add workshop vs reuse existing | Add 'Pintura' workshop to test config | Need two workshops with different prices to prove recalculation. Adding to global `beforeEach` is safe — no existing test asserts workshop count. |

## Data Flow

```
Client (ExtrasEdit/MenusEdit)
  │  strips precio*Applied, menuNombre from payload
  ▼
PATCH /api/v1/events/:id
  │  oldDetalles = event.detalles.toObject()
  │  delete oldDetalles.*.snapshots if selection changed   ← existing pass
  ▼
  event.detalles = { ...stripIds(oldDetalles), ...newDetalles }
  │  newDetalles leaks stale snapshots → merged object has them
  │
  │  ◄── FIX: delete event.detalles.*.snapshots if selection changed
  ▼
calculateEventPrice(eventData)
  │  sees undefined → looks up config → populates fresh snapshot
  ▼
event.precioTotal = newPrice
```

## File Changes

| File | Action | Lines |
|------|--------|-------|
| `api/controllers/events.controllers.js` | Add 10 lines after line 489 | Post-merge invalidación: `delete mergedExtras.precioTallerApplied` etc. |
| `web/src/components/admin/ReservationDetailView.jsx` | Modify 2 handlers | `ExtrasEdit` (L2459): destructure `precioTallerApplied, precioPersonajeApplied, precioPinataApplied` from `formData`. `MenusEdit` (L2210): destructure `precioApplied, menuNombre` from `niñosExt`. |
| `api/tests/budget-flow.test.js` | Add ~30 lines | New describe block: create reservation → PATCH taller → assert recalculated price. |

## Implementation Detail

### Backend (after line 489)

```js
const mergedExtras = event.detalles.extras;
const mergedNiños = event.detalles.niños;

if (newDetalles.niños?.menuId && String(newDetalles.niños.menuId) !== String(oldDetalles.niños?.menuId)) {
  delete mergedNiños.precioApplied;
  delete mergedNiños.menuNombre;
}
if (newDetalles.extras?.taller && newDetalles.extras.taller !== oldDetalles.extras?.taller) {
  delete mergedExtras.precioTallerApplied;
}
if (newDetalles.extras?.personaje && newDetalles.extras.personaje !== oldDetalles.extras?.personaje) {
  delete mergedExtras.precioPersonajeApplied;
}
if (newDetalles.extras?.pinata !== undefined && newDetalles.extras.pinata !== oldDetalles.extras?.pinata) {
  delete mergedExtras.precioPinataApplied;
}
```

### Frontend ExtrasEdit (line 2459)

```js
onClick={() => {
  const { precioTallerApplied, precioPersonajeApplied, precioPinataApplied, ...cleanExtras } = formData;
  onSave(cleanExtras);
}}
```

### Frontend MenusEdit (line 2209)

```js
onClick={() => {
  const { precioApplied, menuNombre: _, ...cleanNiños } = niñosExt;
  onSave({
    ...current,
    niños: {
      ...cleanNiños,
      menuNombre: config?.menusNiños?.find(
        (m) => String(m.id || m._id) === String(niñosExt.menuId),
      )?.nombre,
    },
    adultos: { cantidad: adultosQty, comida: adultosList },
    extras: { ...current.extras, alergenos: alergenos },
  });
}}
```

### Test (budget-flow.test.js)

Add 'Pintura' workshop to global config: `{ name: 'Pintura', priceBase: 20, pricePlus: 25 }`. New describe block creates reservation with taller 'Magia' (priceBase 25), PATCH'es taller to 'Pintura' (priceBase 20), asserts `precioTotal` decreases by 5€ and `precioTallerApplied` equals 20.

## Interfaces / Contracts

No changes. PATCH endpoint contract unchanged. Snapshots remain internal implementation detail — clients receive but must not send them.

## Testing Strategy

| Layer | Test | Approach |
|-------|------|----------|
| Integration | Budget-flow regression | Supertest: POST reservation → PATCH taller → assert `precioTotal` recalculates, `precioTallerApplied` updated |
| Unit | Existing suite | All 6 existing test cases must pass unchanged |

## Migration / Rollout

No migration required. Git revert restores original behavior.

## Open Questions

None.
