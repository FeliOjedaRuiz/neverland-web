# activity-sum-pricing Specification

## Purpose

Definir las reglas de cálculo de precio para múltiples actividades: suma individual por elemento, umbral de grupo grande unificado en `> 15`, snapshot `precioTallerApplied` como total de la selección, e invalidación de snapshots por comparación de conjunto ordenado de nombres.

## Requirements

| ID | Requirement | Keyword |
|----|------------|---------|
| REQ-01 | Precio = suma de `obtenerPrecioTaller(actividad, niños)` por cada actividad seleccionada | MUST |
| REQ-02 | Umbral de grupo grande unificado: `> 15` niños en API y frontend | MUST |
| REQ-03 | Fallback de precio: `pricePlus > 0 ? pricePlus : priceBase` por actividad | MUST |
| REQ-04 | `precioTallerApplied` almacena el TOTAL de la selección | MUST |
| REQ-05 | Invalidación de snapshot por conjunto ordenado de nombres | MUST |
| REQ-06 | Guard de invalidación por presencia de campo (no truthiness) | MUST |
| REQ-07 | `precioTotal` incluye la suma de actividades en su recomputación | MUST |

### REQ-01: Precio por Suma de Actividades

El sistema MUST calcular el precio total de actividades como la suma del precio individual de cada actividad seleccionada. Para cada actividad, la función `obtenerPrecioTaller(actividad, niños)` determina el precio unitario consultando `Config.workshops[]`. Con 0 actividades seleccionadas, el precio de actividades es 0. Con 1 actividad, el resultado coincide con el valor legacy (compatibilidad directa).

#### Scenario: Suma con múltiples actividades (grupo normal)

- GIVEN `talleres: ['Slime', 'Tattoos']` y 10 niños
- WHEN el sistema calcula el precio de actividades
- THEN precio = `Slime.priceBase + Tattoos.priceBase`

#### Scenario: Suma con 3 actividades (grupo grande)

- GIVEN `talleres: ['Slime', 'Tattoos', 'Cocina']` y 18 niños
- WHEN el sistema calcula el precio de actividades
- THEN precio = `Slime.pricePlus + Tattoos.pricePlus + Cocina.pricePlus`

#### Scenario: Una sola actividad (compatibilidad legacy)

- GIVEN `talleres: ['Slime']` y 10 niños
- WHEN el sistema calcula el precio de actividades
- THEN precio = `Slime.priceBase` (idéntico al valor que producía el campo `taller` legacy)

#### Scenario: Sin actividades

- GIVEN `talleres: []`
- WHEN el sistema calcula el precio de actividades
- THEN precio = 0, no se aplica recargo por actividades

### REQ-02: Umbral de Grupo Grande Unificado

El sistema MUST usar el umbral `> 15` para determinar grupo grande, tanto en el backend (`events.controllers.js`) como en el frontend (`bookingUtils.js`, `Step5Workshops.jsx`). A exactamente 15 niños se aplica `priceBase`; a 16 niños se aplica `pricePlus`. Esta es una corrección de bug: el frontend usaba `>= 15` (incorrecto) mientras el servidor usaba `> 15` (correcto). El servidor es la fuente de verdad.

#### Scenario: Exactamente 15 niños — precio base

- GIVEN 15 niños y actividad con `priceBase: 20€`, `pricePlus: 30€`
- WHEN el sistema evalúa `esGrupoGrande`
- THEN `esGrupoGrande = false`, precio de la actividad = 20€ (base)

#### Scenario: 16 niños — precio plus

- GIVEN 16 niños y actividad con `priceBase: 20€`, `pricePlus: 30€`
- WHEN el sistema evalúa `esGrupoGrande`
- THEN `esGrupoGrande = true`, precio de la actividad = 30€ (plus)

#### Scenario: Frontend y backend consistentes a 15 niños

- GIVEN 15 niños en ambos entornos
- WHEN frontend calcula el precio para mostrar y backend calcula el precio para cobrar
- THEN ambos producen el mismo resultado usando `priceBase`

### REQ-03: Fallback de Precio por Actividad

El sistema MUST aplicar el fallback `pricePlus > 0 ? pricePlus : priceBase` cuando una actividad tenga `pricePlus` ausente, cero o falsy y el grupo sea grande. Este fallback se hereda de `workshop-pricing-safety` y se aplica individualmente por cada actividad en la suma.

#### Scenario: Actividad sin pricePlus en grupo grande

- GIVEN 18 niños y actividad con `priceBase: 20€`, `pricePlus: 0`
- WHEN el sistema calcula el precio de esa actividad
- THEN usa `priceBase: 20€` como fallback (no cobra 0)

#### Scenario: Actividad con pricePlus válido en grupo grande

- GIVEN 18 niños y actividad con `priceBase: 20€`, `pricePlus: 35€`
- WHEN el sistema calcula el precio de esa actividad
- THEN usa `pricePlus: 35€`

### REQ-04: Snapshot precioTallerApplied como Total

El sistema MUST almacenar en `precioTallerApplied` el importe TOTAL de la selección de actividades (suma de todos los precios individuales). Con 1 actividad, el valor coincide con el precio unitario (compatibilidad histórica). Con 0 actividades, `precioTallerApplied` MUST NOT estar presente (o ser `$unset`).

#### Scenario: Snapshot con 2 actividades

- GIVEN `talleres: ['Slime', 'Tattoos']` con precios 20€ y 30€
- WHEN el sistema persiste el evento
- THEN `precioTallerApplied = 50`

#### Scenario: Snapshot con 1 actividad (compatibilidad)

- GIVEN `talleres: ['Slime']` con precio 20€
- WHEN el sistema persiste el evento
- THEN `precioTallerApplied = 20` (mismo valor que el sistema legacy produciría)

#### Scenario: Sin actividades — sin snapshot

- GIVEN `talleres: []`
- WHEN el sistema persiste el evento
- THEN `precioTallerApplied` no está presente en el documento

### REQ-05: Invalidación de Snapshot por Conjunto Ordenado

El sistema MUST comparar el conjunto de actividades actuales contra el snapshot previo usando `JSON.stringify` sobre los arrays ordenados alfabéticamente. Si el conjunto cambia → recalcular `precioTallerApplied` y `precioTotal`. Si es el mismo conjunto reordenado → NO invalidar. Esta lógica MUST aplicarse en los dos pases PATCH del controlador (líneas ~523-535 y ~581-593, patrón personajes).

#### Scenario: Cambio de conjunto — invalidación

- GIVEN snapshot previo con `talleres: ['Slime']`
- WHEN PATCH envía `talleres: ['Slime', 'Tattoos']`
- THEN el sistema detecta cambio (conjuntos distintos), recalcula `precioTallerApplied` y `precioTotal`

#### Scenario: Mismo conjunto reordenado — sin invalidación

- GIVEN snapshot previo con `talleres: ['Slime', 'Tattoos']`
- WHEN PATCH envía `talleres: ['Tattoos', 'Slime']`
- THEN el sistema detecta que el conjunto ordenado es idéntico, NO invalida snapshots

#### Scenario: Snapshot stale en payload — sobreescritura

- GIVEN payload contiene `precioTallerApplied: 20` pero el conjunto de actividades cambió
- WHEN el sistema procesa el PATCH
- THEN recalcula `precioTallerApplied` con el conjunto actual, ignorando el valor stale del payload

### REQ-06: Guard de Invalidación por Presencia de Campo

El guard que decide si invalidar el snapshot de actividades MUST usar presencia de campo (e.g., `'talleres' in payload.extras`), NO truthiness del valor. Esto corrige un defecto preexistente donde valores falsy (array vacío `[]`) no dispararían la invalidación. MUST seguir el mismo patrón que personajes.

#### Scenario: Array vacío dispara invalidación

- GIVEN snapshot previo con `talleres: ['Slime']`
- WHEN PATCH envía `talleres: []` (valor falsy)
- THEN el guard detecta presencia del campo, compara conjuntos, detecta cambio, invalida y recalcula

#### Scenario: Campo ausente no dispara invalidación

- GIVEN snapshot previo con `talleres: ['Slime']`
- WHEN PATCH envía un payload sin el campo `talleres`
- THEN el guard NO dispara invalidación, snapshot permanece intacto

### REQ-07: Recomputación de precioTotal

El sistema MUST incluir el valor de `precioTallerApplied` (suma de actividades) en la recomputación de `precioTotal`. La fórmula de `precioTotal` es la suma de todos los componentes de precio (base, personajes, actividades, extras, etc.). Cuando `precioTallerApplied` cambia, `precioTotal` MUST recalcularse.

#### Scenario: precioTotal incluye suma de actividades

- GIVEN `precioBase: 200€`, `precioPersonajeApplied: 80€`, `precioTallerApplied: 50€`
- WHEN el sistema recomputa `precioTotal`
- THEN `precioTotal` incluye los 50€ de actividades en la suma total

#### Scenario: Cambio de actividades recalcula precioTotal

- GIVEN `precioTallerApplied` cambia de 20€ a 50€ por añadir una actividad
- WHEN el sistema procesa el cambio
- THEN `precioTotal` se recalcula reflejando el nuevo total de actividades

## Edge Cases

| Case | Behavior |
|------|----------|
| Actividad con `priceBase: 0` y `pricePlus: 0` | Precio de esa actividad = 0; suma total no se ve afectada (caso válido si el catálogo lo permite). El fallback legacy 25/30 € NO se aplica porque la actividad SÍ está resuelta. |
| Todas las actividades tienen mismo precio | Suma = precio × cantidad; sin descuentos ni agrupación |
| Cambio de número de niños sin cambio de actividades | Recalcular precios individuales con nuevo umbral; actualizar `precioTallerApplied` y `precioTotal` |
| Dos pases PATCH procesan `talleres` | Ambos pases aplican la misma lógica de invalidación; el segundo pase no re-invalida si el primero ya actualizó |
| `pricePlus` negativo (dato corrupto) | El fallback `pricePlus > 0` lo descarta y usa `priceBase` |

## Acceptance Criteria

- [ ] Precio = suma de `obtenerPrecioTaller` por cada actividad seleccionada
- [ ] 15 niños → `priceBase`; 16 niños → `pricePlus` (API y frontend unificados)
- [ ] Fallback `pricePlus > 0 ? pricePlus : priceBase` aplicado por actividad
- [ ] `precioTallerApplied` = total de la selección; con 1 actividad = valor legacy
- [ ] Invalidación por conjunto ordenado: cambio → recalcula; reorden → no invalida
- [ ] Guard por presencia de campo: `[]` sí dispara; campo ausente no dispara
- [ ] `precioTotal` recalculado al cambiar actividades
- [ ] `obtenerPrecioTaller` definida una sola vez por capa (API: `api/utils/pricing.js`; web: `web/src/utils/bookingUtils.js`)
