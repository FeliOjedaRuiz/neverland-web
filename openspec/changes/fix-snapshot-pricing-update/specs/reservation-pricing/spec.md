# Delta for Reservation Pricing

## ADDED Requirements

| REQ | Name | Strength | Summary |
|-----|------|----------|---------|
| 1 | Backend Snapshot Invalidation | MUST | Delete stale snapshots from merged `event.detalles` on selection change |
| 2 | Frontend Snapshot Stripping | MUST NOT | Send snapshot fields in PATCH payload |
| 3 | All Snapshot Fields Covered | MUST | Cover all five vulnerable fields (price + name snapshots) |
| 4 | Admin and Client Parity | MUST | Fix works identically for admin and client flows |
| 5 | Non-Regression | MUST | Preserve snapshots when no pricing selection changes |
| 6 | Regression Test | MUST | Test in `api/tests/budget-flow.test.js`: create, PATCH workshop, assert price |

### REQ-1: Backend Snapshot Invalidation After Merge

The backend SHALL delete stale snapshot fields from merged `event.detalles` when a PATCH changes pricing selections, not only from the pre-merge `oldDetalles` copy.

#### Scenario: Workshop changed — price recalculates

- GIVEN a reservation with `detalles.extras.taller: 'Ciencia'` and `detalles.extras.precioTallerApplied: 150`
- WHEN the PATCH payload sets `detalles.extras.taller: 'Arte'`
- THEN the response SHALL contain `precioTotal` recalculated for 'Arte' and `precioTallerApplied` matching the 'Arte' price

#### Scenario: Selection unchanged — snapshot preserved

- GIVEN a reservation with `detalles.extras.taller: 'Ciencia'` and `detalles.extras.precioTallerApplied: 150`
- WHEN the PATCH payload does NOT change `detalles.extras.taller`
- THEN `precioTallerApplied` SHALL remain `150` and `precioTotal` SHALL NOT change

### REQ-2: Frontend Snapshot Stripping

Edit components SHALL NOT include snapshot fields in the PATCH payload. Clients MUST NOT override server-authoritative pricing data.

#### Scenario: ExtrasEdit omits snapshot fields

- GIVEN the ExtrasEdit form holds `precioTallerApplied: 150` from a prior load
- WHEN the user saves changed extras
- THEN the network request payload SHALL NOT contain `precioTallerApplied`, `precioPersonajeApplied`, or `precioPinataApplied`

#### Scenario: MenusEdit omits `precioApplied`

- GIVEN the MenusEdit form holds `precioApplied: 200` from a prior load
- WHEN the user saves changed menu
- THEN the network request payload SHALL NOT contain `precioApplied`

### REQ-3: All Snapshot Fields Covered

| Field | Trigger | Deleted on change |
|---|---|---|
| `detalles.niños.precioApplied` | `menuId` | Yes |
| `detalles.niños.menuNombre` | `menuId` | Yes |
| `detalles.extras.precioTallerApplied` | `taller` | Yes |
| `detalles.extras.precioPersonajeApplied` | `personaje` | Yes |
| `detalles.extras.precioPinataApplied` | `pinata` | Yes |

#### Scenario: Piñata toggled on — price added

- GIVEN a reservation with `detalles.extras.pinata: false` and no `precioPinataApplied`
- WHEN `detalles.extras.pinata` is set to `true`
- THEN `precioTotal` SHALL increase by the piñata price

#### Scenario: Menu changed independently

- GIVEN a reservation with menu A (`menuId: 'menu-a'`, `precioApplied: 180`)
- WHEN `menuId` is changed to 'menu-b'
- THEN `precioApplied` SHALL reflect menu-b and `menuNombre` SHALL update accordingly

### REQ-4: Admin and Client Parity

Admin update (AdminDashboard) and client edit (ReservationDetailView, 72h window) SHALL produce correct `precioTotal` after any pricing selection change.

#### Scenario: Workshop changed by admin

- GIVEN an admin edits a reservation in AdminDashboard
- WHEN `taller` changes from 'Ciencia' to 'Arte' and saves
- THEN `precioTotal` SHALL reflect 'Arte' pricing

#### Scenario: Workshop changed by client

- GIVEN a client edits their reservation via public link within 72h
- WHEN `taller` changes from 'Ciencia' to 'Arte' and saves
- THEN `precioTotal` SHALL reflect 'Arte' pricing

### REQ-5: Non-Regression for Unchanged Fields

#### Scenario: Only observaciones updated

- GIVEN a reservation with snapshot fields `precioTallerApplied: 150`, `precioTotal: 2500`
- WHEN the PATCH payload changes only `observaciones`
- THEN all snapshot fields SHALL be preserved and `precioTotal` SHALL remain `2500`

### REQ-6: Regression Test

A test SHALL exist in `api/tests/budget-flow.test.js` that creates a reservation, patches the workshop, and asserts `precioTotal` matches the new workshop price.

#### Scenario: Create, patch, verify

- GIVEN a reservation with workshop A
- WHEN PATCH changes `taller` to workshop B
- THEN `precioTotal` SHALL reflect B's price and `precioTallerApplied` SHALL equal B's price
