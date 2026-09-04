# Spec: Catálogo Genérico de Extras

## REQ-01 — Config schema

`api/models/config.model.js`:

```
extrasCatalogo: [{
  nombre:     { type: String, required: true },
  descripcion: String,
  precio:     { type: Number, required: true, min: 0 },
  imageUrl:   String,
  orden:      { type: Number, default: 0 },
  active:     { type: Boolean, default: true }
}]
```

- **Sin** `suspended` (eliminado en refactor UX — solo `active`).
- **Sin** `slug` visible en admin (Piñata se identifica por nombre legacy en `preciosExtras.pinata`).
- `preciosExtras.pinata` se mantiene en schema para backcompat pero **NO** se muestra en ConfigurationPanel.

## REQ-02 — Event schema

`api/models/event.model.js` en `detalles.extras`:

```
catalogoItemIds:      { type: [String], default: [] }
precioCatalogoApplied: Number
```

Campos legacy preservados:
```
pinata:              Boolean
precioPinataApplied: Number
```

## REQ-03 — Piñata seed idempotente

`api/controllers/config.controllers.js` en bootstrap:

```
si extrasCatalogo está vacío:
  push { nombre: 'Piñata', precio: 20, active: true, orden: 0 }
```

- Idempotente (no duplica en re-run).
- `preciosExtras.pinata: 20` se restaura manualmente antes de deploy (script `restore-legacy-pinata-config.js`).

## REQ-04 — Pricing

`api/controllers/events.controllers.js` → `calculateEventPrice`:

```
total = paquete + taller + personajes + sumCatalogo + otros
```

- `sumCatalogo` se calcula con precios **actuales** del catálogo (no snapshot).
- `precioCatalogoApplied` se escribe como snapshot al crear/actualizar.
- **Dual-write**: si `'pinata'` ∈ `catalogoItemIds`, también escribir `pinata: true` + `precioPinataApplied = catalogoPiñata.precio`.

## REQ-05 — PATCH invalidation

En PATCH (events.controllers):
- Si `catalogoItemIds` cambió → invalidar `precioCatalogoApplied` y recalcular.
- Si precios base / menú / horario cambiaron → invalidar snapshot de catálogo (regla extendida).
- Segunda pasada (event.set) sincroniza Piñata dual-write.

## REQ-06 — Backcompat cliente

`web/src/utils/bookingUtils.js`:

```
calculateBookingTotal(form, config):
  ...
  piñataPrice = form.precioPinataApplied
             ?? catalog.find(c => c.nombre === 'Piñata')?.precio
             ?? 15
```

`Step7Extras.jsx`:
- **NO** toggle especial de Piñata.
- Solo renderiza `filterActiveCatalog(extrasCatalogo)` como checkboxes.
- Precio en `text-pink-600`, checkmark en círculo rosa cuando seleccionado.

## REQ-07 — Admin CRUD

`web/src/components/admin/ConfigurationPanel.jsx`:

- Accordion **"Extras Adicionales"** con grid de cards (nombre, precio, badge active).
- Botón "+" abre modal con campos: nombre, descripción, precio (€), imageUrl (URL).
- Guardar/editar/eliminar vía endpoint existente de config.
- Slug NO se muestra en UI; Piñata se identifica por nombre legacy al filtrar.
- Sección **"Precios & Otros Extras"** filtra el campo `pinata` (no se muestra).

## REQ-08 — Admin reservation view

`web/src/components/admin/ReservationDetailView.jsx`:

**Read-only cards** (con badge rosa `+X€` en cada item):
- Card Actividad
- Card Personajes (hasta 3)
- Card Catálogo (todos los `catalogoItemIds`)

**Ingreso Previsto**:
- Una sola línea **"Subtotal actividades y extras"** que suma taller + personajes + catálogo.

**Editor** (`ExtrasEdit`):
- Recibe prop `ninosCantidad` (fix de ReferenceError).
- Checkboxes de catálogo siempre visibles; nombre en gris si no seleccionado, badge rosa si seleccionado.
- Pickers de actividad y personajes con precio por item visible.
- `rounded-2xl` (no `rounded-[32px]`) en cards seleccionadas.

**Save payload**:
- **Preserva** `precioPinataApplied` y `pinata` legacy al guardar (fix bug que los borraba).

`web/src/components/admin/ReservationDetailModal.jsx`:
- Badge **"Extras: N items"** junto al precio total.

## REQ-09 — Cliente booking

`web/src/components/booking/Step7Extras.jsx`:
- Lista de catálogo activo como checkboxes.
- Cada item: imagen (o inicial), nombre, descripción truncada, badge `+X€` rosa.
- Checkmark en círculo rosa cuando seleccionado, borde gris cuando no.
- Sin toggle separado de Piñata.

`Step8Summary.jsx` + `StepBudgetSummary.jsx`:
- Línea **"Subtotal actividades y extras"** (taller + personajes + catálogo), **NO** solo catálogo.

## REQ-10 — Pricing page

`web/src/pages/PricingPage.jsx`:
- Nueva sección **"Extras Adicionales"** que renderiza `filterActiveCatalog(items)`.
- Sección "Extras" ya no muestra Piñata hardcoded.

## REQ-11 — Email + Calendar

`api/config/mailer.config.js`:
- Bloque HTML **"Extras adicionales"** después de las líneas existentes, itera `catalogoItemIds` con nombre + precio snapshot.

`api/services/google.service.js`:
- Calendar description incluye catálogo seleccionado con precios snapshot.

## Scripts auxiliares

- `api/scripts/cleanup-legacy-pinata-config.js`: quitar `preciosExtras.pinata` de BD.
- `api/scripts/restore-legacy-pinata-config.js`: restaurar `preciosExtras.pinata: 20` en BD.
- `api/scripts/analyze-stale-snapshots.js`: detectar discrepancias catálogo vs snapshot.
- `api/scripts/fix-stale-snapshots.js`: reparar `precioCatalogoApplied` stale.
- `api/scripts/find-legacy-pinata-reservations.js`: encontrar reservas con Piñata legacy.

## Backcompat verificado

6 reservas legacy probadas en admin con `pinata: true` + `precioPinataApplied: 20`:
`7EXGX7`, `1MF328`, `37ABWV`, `E82EHM`, `KWK6MQ`, `TO24JE` (creada 2026-08-25, antes de la feature).
