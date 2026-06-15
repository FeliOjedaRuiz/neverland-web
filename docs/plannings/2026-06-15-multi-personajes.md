# Multi-Personajes: Permitir hasta 3 personajes por evento

> **Fecha**: 2026-06-15
> **Estado**: Aprobado — Pendiente de implementación SDD
> **Impacto**: ~18 archivos (backend + frontend)

Actualmente cada evento permite seleccionar **un solo personaje** (`String` con valor `'ninguno'` o el nombre del personaje). El objetivo es permitir la selección de **hasta 3 personajes** para un mismo evento, impactando creación (booking y budget) y edición (cliente y admin).

---

## Reglas de Negocio (Confirmadas)

| Regla | Valor |
|-------|-------|
| Máximo de personajes | **3** (hardcodeado) |
| Precio unitario | Desde `preciosExtras.personaje` (actualmente **40€**) |
| Precio 1 personaje | 40€ |
| Precio 2 personajes | 80€ (2 × 40€) |
| Precio 3 personajes | **100€** — precio pack desde nuevo campo `preciosExtras.precioPack3Personajes` |
| UX multi-selección | **Silenciosa** — NO se indica al usuario que puede seleccionar más de uno. La interfaz se comporta como selección simple hasta que el usuario intente seleccionar un segundo |
| Aviso de límite | Solo aparece cuando el usuario intenta seleccionar un **4° personaje**: "El máximo es 3 personajes" |

---

## Notas Importantes

- **Migración de datos**: Los eventos existentes en MongoDB tienen `detalles.extras.personaje` como `String`. La migración es compatible hacia atrás: un string `'Elsa'` se convierte en `['Elsa']` y `'ninguno'` en `[]`. Se propone un script de migración que corre una sola vez.

- **Nuevo campo en Config**: Se añade `preciosExtras.precioPack3Personajes` (default 100€). Esto requiere actualizar el documento Config en MongoDB y el panel de administración de precios.

---

## Estado Actual (Exploración)

### Backend

| Archivo | Campo/Lógica relevante |
|---------|----------------------|
| `api/models/event.model.js` (L60) | `detalles.extras.personaje: { type: String, default: 'ninguno' }` — campo singular |
| `api/models/event.model.js` (L61) | `detalles.extras.precioPersonajeApplied: Number` — snapshot de precio (un solo valor) |
| `api/models/config.model.js` (L40-48) | `characters: [{ id, name, imageUrl, suspended, active }]` — catálogo, sin precio individual |
| `api/models/config.model.js` (L52) | `preciosExtras.personaje: Number` — precio único para "un personaje" |
| `api/controllers/events.controllers.js` (L138-145) | `calculateEventPrice()` — suma 1x precio si `personaje !== 'ninguno'` |
| `api/controllers/events.controllers.js` (L471-473) | `update()` — invalidación de snapshot cuando cambia personaje |
| `api/services/google.service.js` (L118) | Google Calendar description — muestra nombre de 1 personaje |
| `api/config/mailer.config.js` (L210-213) | Email de confirmación — muestra 1 personaje |
| `api/tests/budget-flow.test.js` | Tests con `personaje: 'ninguno'` |

### Frontend

| Archivo | Responsabilidad |
|---------|----------------|
| `web/src/components/booking/Step6Characters.jsx` | **Selector de personaje** — selección simple (1 a la vez), grid de cards con modal de detalle |
| `web/src/pages/BookingPage.jsx` (L94) | `formData.extras.personaje: null` — estado singular |
| `web/src/pages/BudgetPage.jsx` (L94) | Mismo estado singular para presupuestos |
| `web/src/components/booking/Step8Summary.jsx` | Resumen — muestra 1 personaje y 1 precio |
| `web/src/components/booking/StepBudgetSummary.jsx` | Resumen budget — igual, 1 personaje |
| `web/src/components/admin/ReservationDetailView.jsx` | Admin: vista de detalle + editor `ExtrasEdit` — selección singular de personaje |
| `web/src/utils/bookingUtils.js` (L52-53) | `calculateBookingTotal()` — suma 1x precio personaje |
| `web/src/pages/PricingPage.jsx` (L390) | Muestra precio de personaje en la landing de precios |

---

## Cambios Propuestos

### Componente 1 — Backend: Modelo y Migración

#### [MODIFY] `api/models/config.model.js`

Añadir campo de precio pack en `preciosExtras`:

```diff
 preciosExtras: {
   tallerBase: { type: Number, default: 25 },
   tallerPlus: { type: Number, default: 30 },
   personaje: { type: Number, default: 40 },
+  precioPack3Personajes: { type: Number, default: 100 },
   pinata: { type: Number, default: 15 },
   extension30: { type: Number, default: 30 },
   extension60: { type: Number, default: 50 }
 }
```

#### [MODIFY] `api/models/event.model.js`

Cambiar el campo `personaje` de `String` a array `personajes`:

```diff
 detalles: {
   extras: {
-    personaje: { type: String, default: 'ninguno' },
+    personajes: {
+      type: [String],
+      default: [],
+      validate: [arr => arr.length <= 3, 'Máximo 3 personajes permitidos']
+    },
     precioPersonajeApplied: { type: Number },
```

**Decisiones clave**:
- Array vacío `[]` equivale a "sin personaje" (reemplaza `'ninguno'`)
- `precioPersonajeApplied` se mantiene como snapshot del **coste total** de los personajes seleccionados (no unitario)

#### [NEW] `api/scripts/migrate-personaje-to-array.js`

Script de migración one-shot:
```js
// Para cada evento:
//   - 'Elsa' → personajes: ['Elsa'], borra campo personaje
//   - 'ninguno' / null / undefined → personajes: [], borra campo personaje
//   - Recalcula precioPersonajeApplied si necesario
// También actualiza Config para añadir precioPack3Personajes: 100
```

---

### Componente 2 — Backend: Lógica de Precios

#### [MODIFY] `api/controllers/events.controllers.js`

**`calculateEventPrice()`** (líneas 138-145) — nueva lógica de pricing:

```diff
-  if (detalles.extras.personaje && detalles.extras.personaje !== 'ninguno') {
-    let charPrice = detalles.extras.precioPersonajeApplied;
-    if (charPrice === undefined || charPrice === null) {
-      charPrice = safeConfig.preciosExtras?.personaje || 40;
-      detalles.extras.precioPersonajeApplied = charPrice;
-    }
-    total += charPrice;
-  }
+  const personajes = detalles.extras.personajes || [];
+  if (personajes.length > 0) {
+    let charTotal = detalles.extras.precioPersonajeApplied;
+    if (charTotal === undefined || charTotal === null) {
+      const precioUnitario = safeConfig.preciosExtras?.personaje || 40;
+      const precioPack3 = safeConfig.preciosExtras?.precioPack3Personajes || 100;
+      charTotal = personajes.length === 3
+        ? precioPack3
+        : precioUnitario * personajes.length;
+      detalles.extras.precioPersonajeApplied = charTotal;
+    }
+    total += charTotal;
+  }
```

**Tabla de precios resultante**:

| Personajes | Cálculo | Total |
|-----------|---------|-------|
| 0 | — | 0€ |
| 1 | 1 × 40€ | 40€ |
| 2 | 2 × 40€ | 80€ |
| 3 | pack `precioPack3Personajes` | **100€** |

**`validateEventData()`** — añadir validación:
```js
if (detalles.extras?.personajes?.length > 3) {
  throw createError(400, 'Máximo 3 personajes permitidos');
}
```

**`update()`** — invalidación de snapshot (líneas 471-473, 501-503):
```diff
-  if (newDetalles.extras?.personaje && newDetalles.extras.personaje !== oldDetalles.extras?.personaje) {
+  if (newDetalles.extras?.personajes &&
+      JSON.stringify(newDetalles.extras.personajes.slice().sort()) !==
+      JSON.stringify((oldDetalles.extras?.personajes || []).slice().sort())) {
     delete oldDetalles.extras.precioPersonajeApplied;
   }
```

> Se ordena antes de comparar para que el orden de selección no invalide snapshots innecesariamente.

#### [MODIFY] `api/services/google.service.js`

```diff
-  Personaje (${detalles.extras.personaje})
+  Personajes (${(detalles.extras.personajes || []).join(', ')})
```

#### [MODIFY] `api/config/mailer.config.js`

```diff
-  Visita de ${detalles.extras.personaje}
+  Visita de ${(detalles.extras.personajes || []).join(', ')}
```

---

### Componente 3 — Frontend: Estado y Utilidades

#### [MODIFY] `web/src/pages/BookingPage.jsx`

```diff
 extras: {
   taller: null,
-  personaje: null,
+  personajes: [],
   pinata: false,
```

#### [MODIFY] `web/src/pages/BudgetPage.jsx`

Mismo cambio en el estado inicial del form.

#### [MODIFY] `web/src/utils/bookingUtils.js`

```diff
-  if (formData.extras?.personaje && formData.extras.personaje !== 'ninguno') {
-    total += prices.preciosExtras?.personaje || 40;
-  }
+  const personajes = formData.extras?.personajes || [];
+  if (personajes.length > 0) {
+    const precioUnitario = prices.preciosExtras?.personaje || 40;
+    const precioPack3 = prices.preciosExtras?.precioPack3Personajes || 100;
+    total += personajes.length === 3 ? precioPack3 : precioUnitario * personajes.length;
+  }
```

---

### Componente 4 — Frontend: Selector de Personajes (UX)

#### [MODIFY] `web/src/components/booking/Step6Characters.jsx`

**Cambio más significativo del proyecto.** Pasar de selección simple a multi-selección silenciosa.

**Principio UX clave**: La interfaz NO cambia visualmente. Sigue pareciendo un selector simple. El usuario descubre orgánicamente que puede seleccionar más de uno cuando clica otro personaje y el anterior NO se deselecciona.

**Comportamiento detallado**:

1. **Estado**: `formData.extras.personajes` es `[]` (array)
2. **Primer click**: Selecciona el personaje → se añade al array. Visualmente se marca con check (igual que ahora)
3. **Segundo click en OTRO personaje**: Se añade al array (no reemplaza). Ahora hay 2 seleccionados. Ambos muestran check
4. **Click en personaje YA seleccionado**: Lo quita del array (toggle)
5. **Tercer click en OTRO personaje**: Se añade. 3 seleccionados
6. **Cuarto click en OTRO personaje**: **No se añade**. Aparece un toast/feedback sutil: _"El máximo es 3 personajes"_ que desaparece en 3 segundos
7. **"Sin Visita"**: Limpia el array completo → `[]`
8. **Precio dinámico**: Se muestra discretamente debajo de las cards SOLO si hay ≥1 seleccionado:
   - 1 personaje: `40€`
   - 2 personajes: `80€`
   - 3 personajes: `100€` (pack)

**Lo que NO cambia**:
- El título sigue siendo "Visita Especial"
- El subtítulo sigue igual
- La grid de cards no cambia
- El modal de detalle sigue funcionando
- No hay badge de "2/3" ni contador visible para no incentivar
- No hay texto "puedes seleccionar hasta 3"

**Lo que cambia sutilmente**:
- Cuando hay >1 seleccionado, el botón "Sin Visita" muestra "Quitar todos"
- El precio en la parte inferior se actualiza dinámicamente
- Si hay 3 seleccionados: los 3 muestran check. El precio muestra "Pack 3: 100€"
- En el modal de detalle: el botón cambia entre "Añadir" y "Quitar" según si ya está seleccionado

---

### Componente 5 — Frontend: Vistas de Resumen y Detalle

#### [MODIFY] `web/src/components/booking/Step8Summary.jsx`

Mostrar lista de personajes seleccionados:
- Si hay 1: mostrar nombre + imagen + precio como ahora
- Si hay 2-3: mostrar una fila con las imágenes/nombres apiladas y el precio total
- Si pack 3: mostrar `"Pack 3 personajes — 100€"`

#### [MODIFY] `web/src/components/booking/StepBudgetSummary.jsx`

Mismos cambios que Step8Summary.

---

### Componente 6 — Frontend: Admin (Edición)

#### [MODIFY] `web/src/components/admin/ReservationDetailView.jsx`

**Vista de solo lectura** (~líneas 956-985):
- Mostrar avatares apilados de los personajes seleccionados
- Si son 3, indicar "Pack" junto al precio

**ExtrasEdit** (~líneas 2244-2420):
- `formData.personaje` (string) → `formData.personajes` (array)
- El picker colapsable permite toggle de cada personaje SIN cerrar al seleccionar
- Al intentar un 4° personaje: toast con "Máximo 3 personajes"
- Mostrar los seleccionados como chips removibles arriba del picker
- Mostrar precio total dinámico

---

### Componente 7 — Frontend: Panel de Config (Admin)

#### [MODIFY] `web/src/components/admin/ConfigurationPanel.jsx`

Añadir input para el nuevo campo `precioPack3Personajes` en la sección de precios extras:

```
Precio por personaje: [40] €
Pack 3 personajes:    [100] €
```

---

### Componente 8 — Landing de Precios

#### [MODIFY] `web/src/pages/PricingPage.jsx`

Actualizar la tarjeta de personajes:
```
40€ / personaje
Pack 3: 100€
```

---

### Componente 9 — Tests

#### [MODIFY] `api/tests/budget-flow.test.js`
- Cambiar `personaje: 'ninguno'` → `personajes: []`
- Tests con 1, 2, 3 personajes y verificación de precios
- Test específico para pack de 3 = 100€

#### [MODIFY] `web/src/utils/bookingUtils.test.js`
- 0 personajes → 0€
- 1 personaje → 40€
- 2 personajes → 80€
- 3 personajes → 100€ (pack)

#### [MODIFY] `web/src/components/booking/Step8Summary.test.jsx`
- Actualizar mocks de `personaje` → `personajes`

---

## Resumen de Impacto

| Capa | Archivos afectados | Complejidad |
|------|-------------------|-------------|
| **Modelos** | 2 (event.model, config.model) | Baja |
| **Migración** | 1 (script nuevo) | Baja |
| **Controladores** | 1 (events.controllers.js) | Media |
| **Servicios** | 2 (google.service, mailer) | Baja |
| **Frontend - Selector** | 1 (Step6Characters.jsx) | **Alta** |
| **Frontend - Estado** | 2 (BookingPage, BudgetPage) | Baja |
| **Frontend - Utils** | 1 (bookingUtils.js) | Baja |
| **Frontend - Resumen** | 2 (Step8Summary, StepBudgetSummary) | Media |
| **Frontend - Admin** | 2 (ReservationDetailView, ConfigurationPanel) | **Alta** |
| **Frontend - Pricing** | 1 (PricingPage.jsx) | Baja |
| **Tests** | 3 | Media |
| **Total** | **~18 archivos** | |

---

## Plan de Verificación

### Tests Automatizados
```bash
cd api && npm test                    # Tests de backend (budget-flow, etc.)
cd web && npm run test:run            # Tests de frontend (bookingUtils, Step8Summary)
```

### Verificación Manual
1. **Booking flow**: Crear reserva con 0, 1, 2, 3 personajes → verificar precio correcto (0, 40, 80, 100)
2. **Booking flow**: Intentar seleccionar 4° → verificar mensaje "El máximo es 3 personajes"
3. **Booking flow**: Verificar que NO hay indicador de multi-selección antes de seleccionar el 2°
4. **Budget flow**: Crear presupuesto con 3 personajes → verificar precio pack 100€
5. **Admin edit**: Editar evento existente, cambiar personajes → verificar recálculo de precio
6. **Admin config**: Verificar que el campo `precioPack3Personajes` se guarda correctamente
7. **Email**: Verificar que el email de confirmación lista todos los personajes
8. **Google Calendar**: Verificar que la descripción del evento lista todos los personajes
9. **Migración**: Correr script sobre datos existentes → verificar integridad
10. **PricingPage**: Verificar que muestra precio unitario + pack

---

## Workflow SDD

Este plan se implementará con el workflow `/feature`:
1. `sdd-explore` → ✅ completado (investigación del codebase)
2. `sdd-propose` → propuesta formal
3. `sdd-spec` → requisitos con escenarios Given/When/Then
4. `sdd-design` → decisiones de arquitectura
5. `sdd-tasks` → desglose en tareas implementables
6. `sdd-apply` → implementación por batches
7. `sdd-verify` → validación contra specs
