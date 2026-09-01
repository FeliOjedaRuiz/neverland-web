# Proposal: Catálogo Genérico de Extras

## Intent

El admin necesita agregar extras personalizados (nombre, descripción, precio, foto) sin tocar código. Hoy la Piñata está hardcodeada — mañana podría ser un snack bar, decoración temática, o cualquier otro extra. El catálogo genérico permite que el admin expanda la oferta de extras desde el panel de configuración.

## Scope

### In Scope
- Modelo `extrasCatalogo[]` embebido en Config (patrón existente: `menusNiños[]`, `characters[]`)
- CRUD de catálogo desde ConfigurationPanel (admin)
- Item schema: `{ id, slug, nombre, descripcion, precio, imageUrl, suspended, active }`
- Seed inicial: Piñata Neverland (slug `pinata`, precio 15€)
- Selección múltiple en Step7Extras (checkboxes)
- Backcompat: `pinata: Boolean` + `precioPinataApplied` preservados en Event cuando slug `pinata` está seleccionado
- Campos nuevos en Event: `detalles.extras.catalogoItemIds[]` + `detalles.extras.precioCatalogoApplied`
- Piñata mantiene toggle visual dedicado en Step7 (no checkbox genérico)
- Reservas legacy muestran badge "(legacy)" en admin

### Out of Scope
- Migración de otros extras legacy (`extension30`, `extension60`, `tallerBase`, etc.) al catálogo
- Descuentos o promociones sobre extras
- Extras condicionales (ej: "solo disponible si contrata personaje")
- Inventario o límite de stock por extra

## Capabilities

### New Capabilities
- `extras-catalog`: CRUD genérico de extras desde admin, selección en booking, pricing dinámico

### Modified Capabilities
- `event-pricing`: `calculateEventPrice` suma precio de catálogo seleccionado
- `booking-flow`: Step7Extras renderiza catálogo dinámico + Piñata como caso especial
- `reservation-detail`: Admin ve catálogo seleccionado + badge legacy en reservas antiguas
- `config-panel`: Admin gestiona catálogo de extras

## Approach

Array embebido `extrasCatalogo[]` en Config document, siguiendo el patrón de `characters[]` y `workshops[]`. Cada item tiene `slug` único e inmutable. El server calcula `precioCatalogoApplied` como snapshot al crear/actualizar evento. Backcompat: si `pinata` está en `catalogoItemIds`, server también setea `pinata: true` + `precioPinataApplied`.

18 archivos afectados (mismos donde aparece "Piñata" hoy) — cada uno se extiende para manejar `catalogoItemIds` además de los campos legacy.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `api/models/config.model.js` | Modified | Agregar `extrasCatalogo[]` schema |
| `api/models/event.model.js` | Modified | Agregar `catalogoItemIds[]` + `precioCatalogoApplied` |
| `api/controllers/events.controllers.js` | Modified | `calculateEventPrice` suma catálogo; PATCH invalidation |
| `web/src/components/admin/ConfigurationPanel.jsx` | Modified | CRUD catálogo de extras |
| `web/src/components/booking/Step7Extras.jsx` | Modified | Checkboxes catálogo + Piñata toggle especial |
| `web/src/components/booking/Step8Summary.jsx` | Modified | Muestra extras del catálogo |
| `web/src/components/booking/StepBudgetSummary.jsx` | Modified | Precio catálogo en resumen |
| `web/src/components/admin/ReservationDetailView.jsx` | Modified | Catálogo seleccionado + badge legacy |
| `web/src/components/admin/ReservationDetailModal.jsx` | Modified | Catálogo en modal |
| `web/src/pages/PricingPage.jsx` | Modified | Muestra extras del catálogo |
| `web/src/utils/bookingUtils.js` | Modified | Helpers catálogo |
| `web/src/pages/BookingPage.jsx` | Modified | Estado catálogo |
| `web/src/pages/BudgetPage.jsx` | Modified | Estado catálogo |
| `api/services/google.service.js` | Modified | Calendar event incluye catálogo |
| `api/config/mailer.config.js` | Modified | Email incluye catálogo |
| `api/scripts/fix-stale-snapshots.js` | Modified | Maneja catálogo en snapshots |
| `api/scripts/analyze-stale-snapshots.js` | Modified | Analiza catálogo |
| Tests (2 files) | Modified | Cobertura catálogo |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| 18 archivos = PR grande (>400 líneas) | High | Chained PRs: PR1 backend (models+controllers), PR2 frontend (components+pages), PR3 tests |
| Backcompat rota en reservas legacy | Low | Test explícito: reserva sin `catalogoItemIds` sigue mostrando Piñata si `pinata: true` |
| Slug collision o rename | Low | Slug inmutable post-creación; validación unique en save |

## Rollback Plan

1. Revert rama `feat/catalogo-extras`
2. Los campos nuevos en Event (`catalogoItemIds`, `precioCatalogoApplied`) son ignorados por código viejo — no rompe reservas existentes
3. `extrasCatalogo[]` en Config es ignorado si no existe — fallback a campos legacy

## Dependencies

- Ninguna dependencia externa

## Success Criteria

- [ ] Admin puede crear/editar/eliminar extras desde ConfigurationPanel
- [ ] Cliente selecciona 1+ extras en Step7Extras
- [ ] Precio de catálogo se suma correctamente en `calculateEventPrice`
- [ ] Piñata legacy (`pinata: true`) funciona igual que antes
- [ ] Reservas sin `catalogoItemIds` se muestran con badge "(legacy)"
- [ ] Tests pasan: Vitest (web) + Jest (api)
