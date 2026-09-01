# Diseño: Catálogo genérico de extras

## Enfoque técnico

Extender el documento único de configuración y el subdocumento `Event.detalles.extras`, manteniendo Piñata como compatibilidad dual. El servidor es la autoridad de selección, disponibilidad y precio; el cliente solo presenta el catálogo activo y calcula una previsualización.

## Decisiones de arquitectura

| Decisión | Elección y alternativas | Razonamiento / trade-off |
|---|---|---|
| Almacenamiento | Array embebido `Config.extrasCatalogo[]`; no colección separada | Sigue `menusNiños[]`, `characters[]` y `workshops[]`, evita joins y mantiene CRUD atómico. Trade-off: el catálogo no escala a millones de items, fuera de alcance razonable. |
| Sincronización | Dual-write al seleccionar `pinata`: `catalogoItemIds:['pinata']` + `pinata:true` y `precioPinataApplied` | Preserva lectores legacy y evita una migración masiva. No se suma Piñata dos veces: el cálculo genérico excluye `pinata` y el bloque legacy lo factura. |
| Snapshots | `precioCatalogoApplied` es la suma congelada de los IDs seleccionados | Las reservas conservan el precio contratado aunque cambie Config. Recalcular solo cuando cambia la selección o se solicita explícitamente un recálculo de evento. |
| Validación | Backend resuelve IDs contra catálogo `active && !suspended`, sin confiar en precio/nombre del cliente | Rechaza IDs duplicados, desconocidos, inactivos o suspendidos con 400. Evita manipulación de precios; reduce disponibilidad retroactiva de un item. |
| Slug | Único dentro del array y obligatorio; inmutable después de crear | Se rechaza cualquier cambio de slug (alternativa: renombrado con alias, descartada por complejidad y enlaces históricos). Índice Mongo no puede garantizar unicidad dentro de un array, por eso se valida en controlador/modelo. |
| Eliminación | Soft delete: `active:false` (y conservar objeto/nombre) | Items usados siguen identificables en reservas; borrado físico solo se permite si nunca fue usado, o se rechaza. |
| UX Piñata | Toggle visual dedicado; otros items como checkboxes | Mantiene el flujo existente y reconocimiento de marca; un checkbox genérico sería más uniforme pero rompería la expectativa visual y la dual-write legacy. |

## Modelo y flujo

```js
Config.extrasCatalogo: [{ id: String, slug: { type: String, required: true },
  nombre: String, descripcion: String, precio: { type: Number, min: 0 },
  imageUrl: String, suspended: { type: Boolean, default: false },
  active: { type: Boolean, default: true } }]
Event.detalles.extras: { catalogoItemIds: { type: [String], default: [] },
  precioCatalogoApplied: Number }
```

Seed idempotente: Piñata `{id:'pinata', slug:'pinata', nombre:'Piñata Neverland', precio:15, ...}`; añadir solo si no existe por slug. Catálogo vacío sigue siendo válido. No hay índice útil de `slug` dentro del array; imponer unicidad antes de guardar.

`POST /events` y `PATCH /events/:id` validan IDs y recalculan `precioCatalogoApplied`. `calculateEventPrice` (`events.controllers.js:54-179`) resuelve cada item, suma precios una vez, sincroniza Piñata y muta snapshots como los existentes. En PATCH (`events.controllers.js:468-521`), conservar las dos pasadas actuales de invalidación (`delete` sobre copia y `event.set` después del merge): añadir comparación de arrays ordenados para `catalogoItemIds`; invalidar `precioCatalogoApplied` si cambia selección, y también invalidar todos los snapshots cuando cambian precio base/menú/horario según la regla existente. Respuesta sin cambios estructurales para consumidores legacy.

## Frontend y patrones

`BookingPage.jsx` y `BudgetPage.jsx` (estado/config actual en líneas 46-103) inicializan `catalogoItemIds:[]`, cargan `extrasCatalogo` y lo pasan a `Step7Extras`, `Step8Summary`/`StepBudgetSummary`; `bookingUtils.js:7-69` añade helpers de filtrado y suma. Step7 mantiene extensión, toggle Piñata y una grid de checkboxes activos/no suspendidos. `ConfigurationPanel.jsx:46-291` añade accordion + grid + modal editor, usando `AccordionSection`, `updateListItem`, `ToggleSwitch` y `handleImageUpload` (Cloudinary); slug se bloquea al editar. Pricing público filtra igual.

Admin: `ReservationDetailView` y `ReservationDetailModal` muestran cards con nombre/precio aplicado, fallback por ID y badge `(legacy)` si falta el array; `active:false` conserva nombres. Google Calendar y mailer agregan nombres y snapshot sin cambiar legacy. Scripts de análisis/corrección reutilizan la misma resolución y omiten eventos legacy.

## Archivos por Work Unit

1. **Backend:** `api/models/config.model.js`, `event.model.js`, `controllers/config.controllers.js`, `events.controllers.js`, `services/google.service.js`, `config/mailer.config.js`.
2. **Booking/UI:** `web/src/utils/bookingUtils.js`, `components/booking/Step7Extras.jsx`, `Step8Summary.jsx`, `StepBudgetSummary.jsx`, `pages/BookingPage.jsx`, `BudgetPage.jsx`, `PricingPage.jsx`.
3. **Admin/scripts/tests:** `ConfigurationPanel.jsx`, `ReservationDetailView.jsx`, `ReservationDetailModal.jsx`, `api/scripts/{analyze-stale-snapshots,fix-stale-snapshots}.js`, `api/tests/{events,budget-flow}.test.js`, `web/src/components/booking/Step8Summary.test.jsx`.

## Migración, contratos y pruebas

El bootstrap añade Piñata una sola vez. Eventos existentes reciben defaults de Mongoose (`[]`, snapshot ausente) sin migrar; campos legacy siguen calculándose. Rollback: revertir código; código anterior ignora campos nuevos y Config conserva datos sin efectos.

GET `/config` devuelve `extrasCatalogo[]`; POST/PATCH de eventos acepta solo IDs válidos; PATCH recalcula snapshots. Unit: `bookingUtils.js`; integración Jest: CRUD, cálculo y ambas pasadas PATCH en `events.test.js`; flujo completo catálogo en `budget-flow.test.js`; Vitest `Step8Summary.test.jsx` para selección, total, vacío y legacy. Threat matrix: **N/A**, no cambia routing, shell, procesos ni VCS.

## Riesgos y preguntas abiertas

- **CRITICAL:** cambiar precios durante una reserva exige que el servidor prevalezca sobre el cliente; cubrir concurrencia con test de selección inválida.
- **WARNING:** el alcance puede superar 400 líneas; ejecutar como tres work units/chained PRs (backend, UI, tests).
- **SUGGESTION:** confirmar si “eliminar” debe ser siempre soft delete; este diseño lo fija así para proteger historial.
