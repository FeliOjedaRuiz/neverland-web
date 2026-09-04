# Tasks: Workshop Pricing Safety and Admin Guardrails

- [x] 1.0 Booking Flows Defensive Pricing Fallback
  - [x] 1.1 `web/src/utils/bookingUtils.js` — Implement fallback to `priceBase` when `pricePlus <= 0` in `calculateBookingTotal`.
  - [x] 1.2 `web/src/components/booking/Step5Workshops.jsx` — Update workshop card price and modal price to fallback to base price when `pricePlus` is 0; condition supplement message on `pricePlus > priceBase`.
  - [x] 1.3 `web/src/components/booking/Step8Summary.jsx` & `StepBudgetSummary.jsx` — Update summary price breakdown to use fallback.
  - [x] 1.4 `web/src/components/admin/ReservationDetailView.jsx` — Update admin detail view and workshop picker with defensive fallback.
  - [x] 1.5 `api/controllers/events.controllers.js` — Ensure backend recalculation applies defensive fallback for large groups.

- [x] 2.0 Admin Configuration UI & Warnings
  - [x] 2.1 `web/src/components/admin/ConfigurationPanel.jsx` — Rename "Precio Plus" label to "Precio más de 15 niños" and clarify workshop card display.
  - [x] 2.2 `web/src/components/admin/ConfigurationPanel.jsx` — Implement `handleSaveWorkshop` with validation for `priceBase === 0`, `pricePlus === 0`, and `pricePlus < priceBase`.
  - [x] 2.3 `web/src/components/admin/ConfigurationPanel.jsx` — Render interactive confirmation modal for pricing warnings.

- [x] 3.0 Testing & Verification
  - [x] 3.1 `web/src/utils/bookingUtils.test.js` — Add unit tests for 0€ and undefined `pricePlus` fallback.
  - [x] 3.2 Run frontend Vitest suite (23/23 passed).
  - [x] 3.3 Run backend Jest suite (22/22 passed).
