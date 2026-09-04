# Proposal: Workshop Pricing Safety and Admin Guardrails

## Intent

Prevent zero-euro charges when an administrator erroneously configures the large-group workshop price (`pricePlus`) as 0€. Introduce domain-level defensive fallbacks, improve administrator terminology, and add interactive validation modals before persisting workshop pricing.

## Scope

### In Scope
- **Defensive Pricing Fallback**: If `pricePlus` is 0, empty, or undefined, the booking flow calculation (frontend and backend) automatically falls back to `priceBase`.
- **UI Clarification**: Rename ambiguous admin label `"Precio Plus"` to `"Precio más de 15 niños"` and clarify card price listings.
- **Admin Warning Guardrails**: Display interactive warning confirmation dialogs in `ConfigurationPanel` when saving:
  1. Base price is 0€.
  2. Large-group (+15 kids) price is 0€ while base price is > 0€.
  3. Large-group (+15 kids) price is strictly less than base price.
- **Automated Tests**: Unit tests in `bookingUtils.test.js` covering 0€ and undefined `pricePlus` fallbacks, and verification in backend flow tests.

### Out of Scope
- Altering overall event pricing structure (children menus, characters, adult food).
- Modifying database schema in MongoDB.

## Capabilities

### Modified Capabilities
- `reservation-pricing`: Added requirement for workshop large-group fallback to base price when `pricePlus <= 0`.
- `admin-configuration`: Added validation warning modals for workshop pricing thresholds.

## Approach

1. **Client Calculation**: In `web/src/utils/bookingUtils.js`, `Step5Workshops.jsx`, `Step8Summary.jsx`, `StepBudgetSummary.jsx`, and `ReservationDetailView.jsx`, resolve workshop price with `isPlus ? (workshop.pricePlus > 0 ? workshop.pricePlus : workshop.priceBase) : workshop.priceBase`.
2. **Server Calculation**: In `api/controllers/events.controllers.js`, compute `tallerPrice` with `isLargeGroup ? (workshop.pricePlus > 0 ? workshop.pricePlus : workshop.priceBase) : workshop.priceBase`.
3. **Admin Configuration UI**: In `web/src/components/admin/ConfigurationPanel.jsx`, update labels and gate the save action with `handleSaveWorkshop` which checks `priceBase === 0`, `pricePlus === 0`, and `pricePlus < priceBase`, prompting the user before calling `handleSave`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `web/src/utils/bookingUtils.js` | Modified | Workshop pricing calculation fallback |
| `web/src/components/booking/*` | Modified | Step 5, Step 8, and Budget Summary workshop price display |
| `web/src/components/admin/ReservationDetailView.jsx` | Modified | Admin detail view & workshop picker price calculation |
| `web/src/components/admin/ConfigurationPanel.jsx` | Modified | Workshop pricing inputs, labels, and warning modal |
| `api/controllers/events.controllers.js` | Modified | Backend `tallerPrice` calculation fallback |
| `web/src/utils/bookingUtils.test.js` | Modified | Unit test coverage for fallback scenarios |

## Rollback Plan

Revert the git commit. The changes do not introduce schema migrations or external API dependencies.
