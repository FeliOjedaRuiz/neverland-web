# character-pack-pricing Specification

## Purpose

Define pricing calculation, snapshot storage, and invalidation for multi-character selections. Unit price from `preciosExtras.personaje` (default 40€), pack price from new field `preciosExtras.precioPack3Personajes` (default 100€). Snapshot `precioPersonajeApplied` stores total cost, not unit.

## Requirements

| ID | Requirement | Keyword |
|----|------------|---------|
| REQ-01 | Unit price from Config: 1 char = unitPrice, 2 chars = unitPrice × 2 | MUST |
| REQ-02 | Pack price for exactly 3 chars from `precioPack3Personajes` (default 100€) | MUST |
| REQ-03 | `precioPersonajeApplied` snapshot stores total cost, calculated once at creation | MUST |
| REQ-04 | Snapshot invalidation by sorted array comparison (order-independent) | MUST |
| REQ-05 | Correct price displayed in all views: resumen, admin, pricing page, email, calendar | MUST |
| REQ-06 | Config panel exposes editable `precioPack3Personajes` field | MUST |

### REQ-01: Unit Price Calculation

The system MUST read unit price from `preciosExtras.personaje` (default 40€). For 1 or 2 characters, total = unitPrice × count. 0 characters = 0€ surcharge.

#### Scenario: 1 character

- GIVEN Config `preciosExtras.personaje: 40`, event `personajes: ['Elsa']`
- WHEN price is calculated
- THEN `precioPersonajeApplied = 40`, `precioTotal` includes 40€

#### Scenario: 2 characters

- GIVEN Config `preciosExtras.personaje: 40`, event `personajes: ['Elsa', 'Anna']`
- WHEN price is calculated
- THEN `precioPersonajeApplied = 80`, `precioTotal` includes 80€

#### Scenario: 0 characters

- GIVEN event `personajes: []`
- WHEN price is calculated
- THEN `precioPersonajeApplied = 0`, no surcharge added

### REQ-02: Pack Price for 3 Characters

When exactly 3 characters are selected, the system SHALL apply `preciosExtras.precioPack3Personajes` (default 100€) instead of unitPrice × 3.

#### Scenario: Pack price applied

- GIVEN Config `precioPack3Personajes: 100`, event `personajes: ['Elsa', 'Anna', 'Mickey']`
- WHEN price is calculated
- THEN `precioPersonajeApplied = 100` (NOT 120)

### REQ-03: Snapshot Stores Total

`precioPersonajeApplied` MUST store the total character cost. It is set once at event creation and recalculated when characters change on update.

#### Scenario: Snapshot on creation

- GIVEN new event with `personajes: ['Elsa', 'Anna']`
- THEN `detalles.extras.precioPersonajeApplied = 80`

### REQ-04: Sorted Array Invalidation

When updating an event, the system MUST compare sorted `personajes` arrays. If content differs, `precioPersonajeApplied` is deleted and recalculated. Order changes alone SHALL NOT invalidate.

#### Scenario: Order change — no invalidation

- GIVEN event `personajes: ['Elsa', 'Anna']`, snapshot = 80
- WHEN updated to `personajes: ['Anna', 'Elsa']`
- THEN snapshot is NOT invalidated, `precioPersonajeApplied` remains 80

#### Scenario: Content change — invalidates

- GIVEN event `personajes: ['Elsa']`, snapshot = 40
- WHEN updated to `personajes: ['Elsa', 'Anna']`
- THEN `precioPersonajeApplied` deleted, recalculated to 80

### REQ-05: Price Display Across Views

All views MUST show correct price. 3-character selections SHALL include "Pack 3" label.

| View | Display |
|------|---------|
| Step8Summary / StepBudgetSummary | Character names + total price + "Pack 3" for 3 |
| Admin ReservationDetailView | Avatar chips + "Pack" badge + price |
| PricingPage | "40€ / personaje" + "Pack 3: 100€" |
| Email confirmation | All character names joined by comma |
| Google Calendar | All character names joined by comma |

### REQ-06: Config Panel Field

The admin ConfigurationPanel MUST expose an editable input for `preciosExtras.precioPack3Personajes` (default 100€). SHALL persist via existing Config update API.

#### Scenario: Admin changes pack price

- GIVEN admin opens ConfigurationPanel
- WHEN admin sets `precioPack3Personajes` to 90 and saves
- THEN Config document is updated. New events with 3 characters use 90€.

## Edge Cases

| Case | Behavior |
|------|----------|
| Config missing `precioPack3Personajes` | Fallback default 100€ — no crash |
| Config updated mid-session | Price recalculated on next event update |
| 0 characters | `precioPersonajeApplied = 0` (not null/undefined) |
| Frontend `bookingUtils` calculation | Must mirror backend logic exactly |

## Acceptance Criteria

- [ ] 1 char = 40€, 2 = 80€, 3 = 100€ (pack, NOT 120€)
- [ ] Snapshot stores total, not unit price
- [ ] Sorted comparison prevents unnecessary invalidation
- [ ] Config panel saves `precioPack3Personajes`
- [ ] All views display correct price with "Pack 3" label
- [ ] Missing Config field gracefully falls back to default 100€
