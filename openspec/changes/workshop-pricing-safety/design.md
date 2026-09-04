# Design: Workshop Pricing Safety and Admin Guardrails

## Architecture Overview

The system uses a shared configuration schema (`Config.workshops`) containing workshop definitions with `priceBase` and `pricePlus`.
The defensive architecture consists of two cooperative layers:

```
[ Admin UI: ConfigurationPanel ]
           |
           v (Validation on Save)
[ Modal Warning Guardrails (0€ / plus < base) ]
           |
           v (Persisted to Database)
[ Config: workshops: [{ priceBase, pricePlus }] ]
           |
           +--------------------------------+
           |                                |
           v                                v
[ Client Booking Wizard ]        [ Backend API (Events Controller) ]
           |                                |
           v                                v
[ Fallback: plus > 0 ? plus : base ] [ Fallback: plus > 0 ? plus : base ]
```

## Detailed Decisions

### 1. Fallback Logic Consistency
- Condition: `isPlus = kidsCount >= 15` (frontend step) or `kidsCount > 15` (backend / admin detail).
- Resolution rule: If `isPlus` is true, the applied workshop price is `(workshop.pricePlus > 0 ? workshop.pricePlus : workshop.priceBase) || 0`. If `isPlus` is false, it is `workshop.priceBase || 0`.
- Benefit: Prevents free activities when an admin mistakenly sets or leaves `pricePlus: 0`.

### 2. Admin UX Refinements
- Ambiguity Removal: `"Precio Plus"` is replaced with `"Precio más de 15 niños"`.
- Card Summary: Displays `{ws.priceBase}€ base / {ws.pricePlus}€ (+15 niños)` instead of ambiguous slash notation.

### 3. Interactive Save Interceptor in ConfigurationPanel
- Function `handleSaveWorkshop(ws, idx)` inspects sanitized numeric values `base = Number(ws.priceBase) || 0` and `plus = Number(ws.pricePlus) || 0`.
- If `base === 0`: Warns that standard group bookings will charge 0€.
- If `plus === 0`: Warns that large-group bookings will charge the base price automatically to avoid zero-euro charges.
- If `plus < base`: Warns that the large group rate is cheaper than the base rate.
- Interactive modal offers two distinct paths: "Revisar precios" (dismisses warning and allows editing) or "Continuar y guardar" (commits changes).

## Security & Reliability
- Avoids revenue loss from human configuration error.
- Ensures backend calculation does not trust client totals and reliably evaluates fallback.
