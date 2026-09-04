# Design: Catálogo Genérico de Extras

## Schema layer

### `api/models/config.model.js`

```
extrasCatalogo: [{
  nombre:      { type: String, required: true },
  descripcion: String,
  precio:      { type: Number, required: true, min: 0 },
  imageUrl:    String,
  orden:       { type: Number, default: 0 },
  active:      { type: Boolean, default: true }
}]
```

- `preciosExtras.pinata` se mantiene en schema pero el controller **NO** lo expone en `GET /config` ni en el form de ConfigurationPanel (se filtra en backend antes de responder).
- Sin `suspended` (decisión UX: solo `active`).
- Sin `slug` (el admin no lo ve; Piñata se identifica por `nombre === 'Piñata'` legacy).

### `api/models/event.model.js`

En `detalles.extras`:

```
catalogoItemIds:       { type: [String], default: [] }
precioCatalogoApplied: Number
```

Preservados: `pinata: Boolean`, `precioPinataApplied: Number`.

## Pricing service

`api/controllers/events.controllers.js` → `calculateEventPrice`:

```
1. base = paquete + menu
2. taller = taller?.precioAplicado ?? 0
3. personajes = sum personajes seleccionados (pack 3 = 100€)
4. catalogo = sum precios actuales de items en catalogoItemIds donde active=true
5. pinataDual = 0
   si 'pinata' en catalogoItemIds:
     piñataItem = catalogo.find(c => c.nombre === 'Piñata')
     pinataDual = piñataItem?.precio ?? preciosExtras.pinata ?? 15
     // dual-write a event: pinata=true, precioPinataApplied=pinataDual
6. otros = preciosExtras.otros (legacy menu items)
7. total = base + taller + personajes + catalogo + pinataDual + otros
8. event.precioCatalogoApplied = catalogo   // snapshot
```

**Importante**: `catalogo` (paso 4) **NO** incluye Piñata. La Piñata se cuenta aparte (paso 5) para evitar doble-conteo con el legacy `precioPinataApplied`.

## PATCH invalidation

Dos pasadas (patrón existente):

```
1ª pasada (delete-on-copy):
  - comparar catalogoItemIds sorted antes/después
  - si cambió: invalidar precioCatalogoApplied en la copia

2ª pasada (event.set):
  - si catalogoItemIds cambió: recalcular precioCatalogoApplied
  - sincronizar Piñata dual-write (pinata, precioPinataApplied)
  - recalcular precioTotal con calculateEventPrice
```

Reglas adicionales: si cambia `precioBase`, `menu`, `horario` o cualquier precio base → invalidar también `precioCatalogoApplied` (extiende regla existente).

## Google Calendar

`api/services/google.service.js`:

```
description +=
  ...existing extras...
  "\n🎁 Extras adicionales:\n"
  + catalogoItemIds.map(id => {
      const item = catalogo.find(c => c.slug === id) || legacyMap[id]
      return `  • ${item.nombre}: ${item.precio}€`
    }).join('\n')
```

Usa precios snapshot (no live Config) para accuracy histórica.

## Email HTML

`api/config/mailer.config.js`:

```html
<!-- después de extras existentes -->
${catalogoItems.length > 0 ? `
  <div class="extras-catalogo">
    <h4>🎁 Extras adicionales</h4>
    <ul>
      ${catalogoItems.map(i => `<li>${i.nombre} — ${i.precio}€</li>`).join('')}
    </ul>
  </div>
` : ''}
```

## Admin UI

### `ConfigurationPanel.jsx` — accordion "Extras Adicionales"

- Grid de cards con: imagen (o placeholder con inicial), nombre, descripción truncada, precio, badge active.
- Modal de alta/edición: nombre, descripción, precio (input numérico €), imageUrl (URL).
- Eliminar: confirm + delete (no toca reservas pasadas).
- Filtra `preciosExtras.pinata` de la sección "Precios & Otros Extras" — solo muestra `otros`.

### `ReservationDetailView.jsx` — read-only + editor

**Read-only** (sección "Extras"):
```
┌─ Actividad ─────────────────────┐
│  [imagen] Nombre taller  +X€   │
└────────────────────────────────┘
┌─ Personajes ───────────────────┐
│  [img] Personaje 1    +X€      │
│  [img] Personaje 2    +X€      │
│  [img] Personaje 3    +X€      │
└────────────────────────────────┘
┌─ Extras adicionales ───────────┐
│  [img] Item 1        +X€       │
│  [img] Item 2        +X€       │
└────────────────────────────────┘
Subtotal actividades y extras: YYY €
```

**Editor** (modal "Editar extras"):
- Componente `ExtrasEdit` con prop `ninosCantidad`.
- Checkboxes catálogo (siempre visibles, sin importar selección actual).
- Pickers actividad/personajes con precio por item.
- Al guardar: preserva `precioPinataApplied` y `pinata` legacy.

### `ReservationDetailModal.jsx`
- Badge `Extras: N items` en header.

## Cliente UI

### `Step7Extras.jsx`

```
[imagen]  Piñata                    +20€   ⭕
          Piñata temática Neverland

[imagen]  Decoración extra          +30€   ⭕
          Globos y guirnaldas

[imagen]  Animación extra           +50€   ✅
          30 min extra de animación
```

- Precio en `text-pink-600` (no gris).
- Checkmark en círculo `bg-pink-500 border-pink-500` cuando seleccionado.
- Borde `border-pink-200 hover:border-pink-300` cuando no.

### `Step8Summary.jsx` + `StepBudgetSummary.jsx`

```
Subtotal actividades y extras:        XXX €
  Taller Y                           YYY €
  Personajes (N)                      ZZ €
  Extras adicionales:
    • Piñata                          20€
    • Decoración                      30€
Total reserva:                       TTT €
```

Una sola línea "Subtotal actividades y extras" **antes** del desglose (UX más clara).

## Utilidades

`web/src/utils/bookingUtils.js`:

```
filterActiveCatalog(items) → items.filter(i => i.active === true)
sumCatalogPrices(ids, items) → ids.reduce((acc, id) => acc + (items.find(i => i.slug === id)?.precio || 0), 0)
calculateBookingTotal(form, config) → {
  paquete, taller, personajes, catalogo, pinata, total
  // fallback chain para Piñata: form.precioPinataApplied ?? config.find('Piñata')?.precio ?? 15
}
```

## Scripts

- `cleanup-legacy-pinata-config.js`: `db.configs.updateMany({}, { $unset: { 'preciosExtras.pinata': '' } })`
- `restore-legacy-pinata-config.js`: `db.configs.updateMany({}, { $set: { 'preciosExtras.pinata': 20 } })`
- `analyze-stale-snapshots.js`: lee eventos, compara `precioCatalogoApplied` vs suma actual de catálogo.
- `fix-stale-snapshots.js`: reescribe snapshots stale sin tocar legacy.
- `find-legacy-pinata-reservations.js`: lista eventos con `pinata: true` legacy.

## Tests

**Backend** (`api/tests/events.test.js`):
- 79/79 passing — incluye casos de catálogo, dual-write, PATCH invalidation, backcompat legacy.

**Frontend** (`web/src/utils/bookingUtils.test.js` + `Step8Summary.test.jsx`):
- 64/64 passing — incluye filterActiveCatalog, sumCatalogPrices, calculateBookingTotal con fallback legacy, render de catálogo en summary.

## Decisiones de diseño

1. **Piñata como item normal de catálogo**, sin toggle especial. La complejidad del dual-write vive solo en backend. Front solo ve catálogo activo.
2. **Sin `slug` en UI admin**: simplifica el modal (4 campos en vez de 5). Piñata se identifica por `nombre === 'Piñata'` legacy.
3. **Sin `suspended`**: si querés "ocultar" un item, usá `active: false`. Más simple, menos estados.
4. **Precio actual en pricing, snapshot en histórico**: la fórmula usa precios live para reservas nuevas; los snapshots (`precioCatalogoApplied`, `precioPinataApplied`) preservan el histórico para email/Calendar/legales.
5. **`preciosExtras.pinata` se queda en schema** hasta confirmar deploy estable. Después se puede correr cleanup script sin romper nada.
