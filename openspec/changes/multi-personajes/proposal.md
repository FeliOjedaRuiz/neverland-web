# Proposal: Multi-Personajes — Hasta 3 personajes por evento

## Intent

Actualmente cada evento permite un solo personaje. Los clientes quieren seleccionar hasta 3 personajes para una misma fiesta. Esto requiere migrar el modelo String→Array, añadir precio pack para 3 personajes (100€), y rediseñar sutilmente la UX del selector con multi-selección silenciosa.

## Scope

### In Scope
- Migración: `detalles.extras.personaje` (String) → `detalles.extras.personajes` (Array, máx 3)
- Nuevo campo Config: `preciosExtras.precioPack3Personajes` (default 100€)
- Pricing: 1=40€, 2=80€, 3=100€ (pack). Snapshot `precioPersonajeApplied` pasa a ser total
- Selector multi-personaje con UX silenciosa (sin indicador visible hasta 2° selección, aviso solo al intentar 4°)
- Vistas actualizadas: resumen booking/budget, admin edit, mailer, Google Calendar, pricing page
- Tests: backend budget-flow (1/2/3 personajes), frontend bookingUtils + Step8Summary
- Migración: script one-shot idempotente con backward compatibility

### Out of Scope
- Cambios al catálogo de personajes, precios de otros extras, rediseño visual del selector, paquetes de más de 3

## Capabilities

### New Capabilities
- `multi-character-selection`: UX silenciosa de hasta 3 personajes. Toggle sin cambiar apariencia visual. Primer click añade, segundo click en otro añade (no reemplaza), click en seleccionado quita. Aviso "Máximo 3 personajes" solo al intentar 4°. Precio dinámico debajo de cards.
- `character-pack-pricing`: Precio unitario 40€ desde Config, pack 100€ para 3 desde `precioPack3Personajes`. Snapshot `precioPersonajeApplied` almacena total calculado, no unitario. Invalidación por comparación ordenada de arrays.
- `character-data-migration`: Script one-shot. 'Elsa' → ['Elsa']. 'ninguno'/null → []. Recalcula `precioPersonajeApplied`. Añade `precioPack3Personajes: 100` al Config.

### Modified Capabilities
None — `openspec/specs/` está vacío, no hay specs existentes que modificar.

## Approach

Backend-first incremental: modelo → migración → pricing → servicios → frontend. Cada componente verificable en aislamiento. La UX del selector (Step6Characters.jsx) es el componente de mayor complejidad. Migración idempotente con backup previo, backward-compatible: array vacío equivale a "sin personaje". Snapshot por comparación ordenada evita invalidación innecesaria por orden de selección.

Referencia: `openspec/changes/fix-snapshot-pricing-update/` abordó invalidación de snapshots en update de eventos — este cambio extiende ese patrón al nuevo campo array.

## Affected Areas

| Area | Impact | Files |
|------|--------|-------|
| Modelos | Modified | `api/models/event.model.js`, `api/models/config.model.js` |
| Controladores | Modified | `api/controllers/events.controllers.js` |
| Servicios | Modified | `api/services/google.service.js`, `api/config/mailer.config.js` |
| Migración | New | `api/scripts/migrate-personaje-to-array.js` |
| Estado frontend | Modified | `web/src/pages/BookingPage.jsx`, `web/src/pages/BudgetPage.jsx` |
| Selector UX | Modified | `web/src/components/booking/Step6Characters.jsx` (alta complejidad) |
| Resúmenes | Modified | `web/src/components/booking/Step8Summary.jsx`, `web/src/components/booking/StepBudgetSummary.jsx` |
| Admin | Modified | `web/src/components/admin/ReservationDetailView.jsx`, `web/src/components/admin/ConfigurationPanel.jsx` |
| Pricing/Utils | Modified | `web/src/pages/PricingPage.jsx`, `web/src/utils/bookingUtils.js` |
| Tests | Modified | `api/tests/budget-flow.test.js`, `web/src/utils/bookingUtils.test.js`, `web/src/components/booking/Step8Summary.test.jsx` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Migración corrompe datos en producción | Low | Script idempotente, backup previo, validación en staging |
| UX silenciosa confunde usuarios (no descubren multi-selección) | Med | Validada con cliente; si feedback negativo, añadir indicador sutil en iteración futura |
| Safari/iOS: render en vistas multi-personaje (fechas, animaciones) | Low | safeParseDate obligatorio, CSS animations sobre framer-motion en vistas críticas |
| Snapshot pricing inconsistente con eventos antiguos migrados | Med | Script recalcula; auditoría post-migración de precios totales |

## Rollback Plan

1. Revertir commit de deploy
2. Ejecutar script reverso: `personajes: ['Elsa', 'Anna']` → `personaje: 'Elsa'`, `personajes: []` → `personaje: 'ninguno'`
3. Eliminar campo `preciosExtras.precioPack3Personajes` del documento Config
4. Auditoría de integridad de precios en eventos afectados

## Dependencies

None — sin cambios en APIs externas, paquetes npm ni infraestructura.

## Success Criteria

- [ ] Tests pasan: budget-flow (0/1/2/3 personajes con precios correctos), bookingUtils, Step8Summary
- [ ] Booking: crear con 0/1/2/3 personajes → precios 0/40/80/100€
- [ ] Booking: intentar 4° personaje → toast "Máximo 3 personajes" que desaparece
- [ ] Booking: sin indicador visual de multi-selección antes del 2° click
- [ ] Budget: crear con 3 personajes → precio pack 100€
- [ ] Admin edit: cambiar personajes recalcula snapshot y precioTotal
- [ ] Admin config: `precioPack3Personajes` se guarda y persiste correctamente
- [ ] Email confirmación y Google Calendar listan todos los personajes seleccionados
- [ ] PricingPage: muestra precio unitario (40€) + precio pack (100€)
- [ ] Migración: script corre sin errores sobre datos existentes, integridad verificada
