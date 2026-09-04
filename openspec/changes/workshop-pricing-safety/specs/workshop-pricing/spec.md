# Delta for Workshop Pricing

## ADDED Requirements

| REQ | Name | Strength | Summary |
|-----|------|----------|---------|
| 1 | Large Group Price Fallback | MUST | Apply `priceBase` if `pricePlus` is 0, empty, or undefined when calculating workshop cost |
| 2 | Admin UI Clear Terminology | MUST | Label large group workshop price as "Precio más de 15 niños" |
| 3 | Admin Price Validation Warnings | MUST | Warn admin when saving workshop with base 0€, plus 0€, or plus < base |
| 4 | Client and Server Parity | MUST | Guarantee identical pricing resolution in frontend wizard and backend API |

### REQ-1: Large Group Price Fallback

When a reservation has >= 15 children (or > 15 in backend calculation) and an activity/workshop is selected, the system SHALL evaluate `workshop.pricePlus`. If `workshop.pricePlus > 0`, that price is applied; otherwise, `workshop.priceBase || 0` SHALL be applied.

#### Scenario: Workshop with pricePlus = 0
- GIVEN an activity "Magia" configured with `priceBase: 30` and `pricePlus: 0`
- WHEN a booking is created for 16 children with "Magia"
- THEN the activity cost SHALL be evaluated as 30€ (not 0€)

#### Scenario: Workshop with undefined pricePlus
- GIVEN an activity "Pintura" configured with `priceBase: 22` and no `pricePlus` property
- WHEN a booking is created for 18 children with "Pintura"
- THEN the activity cost SHALL be evaluated as 22€

### REQ-2: Admin UI Clear Terminology

In the configuration panel where workshop prices are edited, the field for large group pricing SHALL be labeled "Precio más de 15 niños" to prevent confusion.

#### Scenario: Admin views workshop edit form
- GIVEN an administrator opens an activity for editing
- THEN the field for groups of more than 15 children is labeled "Precio más de 15 niños"

### REQ-3: Admin Price Validation Warnings

Before persisting changes to an activity, the configuration panel SHALL validate pricing and display a confirmation modal if:
1. `priceBase` is 0.
2. `pricePlus` is 0 while `priceBase` is greater than 0.
3. `pricePlus` is strictly less than `priceBase`.

#### Scenario: Admin leaves pricePlus at 0
- GIVEN an admin sets `priceBase: 25` and `pricePlus: 0`
- WHEN the admin clicks "Guardar Cambios"
- THEN an interactive warning modal is displayed indicating that 0€ will default to base price, offering "Revisar precios" and "Continuar y guardar"
