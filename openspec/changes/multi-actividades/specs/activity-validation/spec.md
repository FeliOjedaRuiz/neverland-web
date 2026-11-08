# activity-validation Specification

## Purpose

Definir las reglas de validación para el array de actividades: límite de 3 elementos (schema + check explícito), deduplicación de `talleres` y `personajes`, validación de existencia y estado `active` en el catálogo, corrección del bug de lookup `w.nombre` → `w.name`, y comportamiento diferenciado entre selección nueva/modificada y recálculo sin cambio.

## Requirements

| ID | Requirement | Keyword |
|----|------------|---------|
| REQ-01 | Límite de 3 actividades en schema Mongoose y check explícito | MUST |
| REQ-02 | Duplicados en `talleres` → 400 con mensaje específico | MUST |
| REQ-03 | Duplicados en `personajes` → 400 con mensaje específico | MUST |
| REQ-04 | Actividad inexistente o inactiva en selección nueva/modificada → 400 | MUST |
| REQ-05 | Recálculo sin cambio de selección: fallback + warning (no bloquear) | MUST |
| REQ-06 | Corrección del bug de lookup `w.nombre` → `w.name` | MUST |
| REQ-07 | Check explícito obligatorio (update validators de Mongoose no cubren operadores de array) | MUST |

### REQ-01: Límite de 3 Actividades

El sistema MUST validar que `talleres.length <= 3` en dos niveles:
1. **Schema Mongoose**: validador en la ruta del array que corre en `pre('save')`. El PATCH actual usa `set()+save()`, por lo que este validador se dispara.
2. **Check explícito en `validateEventData`**: `talleres.length > 3` → respuesta 400 con mensaje descriptivo.

Ambos niveles son necesarios porque los update validators de Mongoose 7.8.8 no cubren `$push`/`$addToSet`/`$pull` sobre arrays.

#### Scenario: Exactamente 3 actividades — válido

- GIVEN payload con `talleres: ['Slime', 'Tattoos', 'Cocina']`
- WHEN el sistema valida el evento
- THEN la validación pasa sin error

#### Scenario: 4 actividades — rechazo 400

- GIVEN payload con `talleres: ['Slime', 'Tattoos', 'Cocina', 'Magia']`
- WHEN el sistema valida el evento
- THEN responde 400 con mensaje indicando que el máximo es 3 actividades

#### Scenario: Array vacío — válido

- GIVEN payload con `talleres: []`
- WHEN el sistema valida el evento
- THEN la validación pasa sin error (0 actividades es válido)

### REQ-02: Deduplicación de talleres

El sistema MUST rechazar con 400 cualquier payload que contenga nombres duplicados en el array `talleres`. El mensaje de error SHALL ser "Actividad duplicada: {nombre}".

#### Scenario: Actividad duplicada en talleres

- GIVEN payload con `talleres: ['Slime', 'Tattoos', 'Slime']`
- WHEN el sistema valida el evento
- THEN responde 400 "Actividad duplicada: Slime"

#### Scenario: Sin duplicados — válido

- GIVEN payload con `talleres: ['Slime', 'Tattoos']`
- WHEN el sistema valida el evento
- THEN la validación de duplicados pasa sin error

### REQ-03: Deduplicación de personajes

El sistema MUST rechazar con 400 cualquier payload que contenga nombres duplicados en el array `personajes`. El mensaje de error SHALL ser "Personaje duplicado: {nombre}". Esta validación se añade al flujo existente de `validateEventData`.

#### Scenario: Personaje duplicado en personajes

- GIVEN payload con `personajes: ['Elsa', 'Anna', 'Elsa']`
- WHEN el sistema valida el evento
- THEN responde 400 "Personaje duplicado: Elsa"

#### Scenario: Sin duplicados en personajes — válido

- GIVEN payload con `personajes: ['Elsa', 'Anna']`
- WHEN el sistema valida el evento
- THEN la validación de duplicados de personajes pasa sin error

### REQ-04: Validación de Catálogo en Selección Nueva/Modificada

Cuando la selección de actividades es NUEVA o ha sido MODIFICADA respecto al snapshot previo, el sistema MUST validar que cada nombre en `talleres` exista en `Config.workshops[]` Y tenga `active: true`. Si algún nombre no cumple → 400 "Actividad no válida o inactiva: {nombre}".

#### Scenario: Nombre inexistente en catálogo

- GIVEN payload con `talleres: ['Slime', 'ActividadFantasma']`
- WHEN el sistema valida el evento y la selección es nueva o modificada
- THEN responde 400 "Actividad no válida o inactiva: ActividadFantasma"

#### Scenario: Nombre existente pero inactivo

- GIVEN actividad 'Cocina' existe en `Config.workshops` pero con `active: false`
- GIVEN payload con `talleres: ['Slime', 'Cocina']` y la selección es nueva o modificada
- WHEN el sistema valida el evento
- THEN responde 400 "Actividad no válida o inactiva: Cocina"

#### Scenario: Todas las actividades válidas y activas

- GIVEN payload con `talleres: ['Slime', 'Tattoos']`, ambas en catálogo y `active: true`
- WHEN el sistema valida el evento
- THEN la validación pasa sin error

### REQ-05: Recálculo Sin Cambio de Selección — Fallback

Cuando el sistema recalcula precios pero la selección de actividades NO ha cambiado respecto al snapshot previo, si una actividad ya no existe o está inactiva en el catálogo, el sistema MUST NOT rechazar con 400. En su lugar, SHALL aplicar un precio fallback y emitir `console.warn`. Esto evita bloquear reservas legacy con nombres de actividades que fueron renombradas o desactivadas después de la reserva original.

#### Scenario: Recálculo con actividad legacy inexistente

- GIVEN reserva con `talleres: ['ActividadAntigua']` (nombre ya no existe en catálogo)
- WHEN el sistema recalcula precios sin que el usuario haya modificado la selección
- THEN el sistema aplica precio fallback, emite `console.warn`, y NO devuelve 400

#### Scenario: Recálculo con selección modificada y actividad inválida

- GIVEN reserva previa con `talleres: ['Slime']`
- WHEN el usuario modifica la selección a `talleres: ['ActividadAntigua']` (nombre inexistente)
- THEN el sistema responde 400 "Actividad no válida o inactiva: ActividadAntigua"

### REQ-06: Corrección del Bug de Lookup

El sistema MUST usar `w.name` (no `w.nombre`) para buscar actividades del catálogo en `ReservationDetailView.jsx` (línea ~1229). El modelo `Config.workshops[]` usa el campo `name`. El bug actual (`w.nombre`) causa que el fallback de recálculo nunca encuentre la actividad en el catálogo.

#### Scenario: Lookup correcto con campo name

- GIVEN catálogo contiene `{ name: 'Slime', priceBase: 20, pricePlus: 30 }`
- WHEN el frontend busca la actividad 'Slime' en el catálogo
- THEN la encuentra correctamente usando `w.name === 'Slime'`

#### Scenario: Bug corregido — antes no encontraba

- GIVEN catálogo contiene `{ name: 'Slime' }` (sin campo `nombre`)
- WHEN el frontend busca usando `w.name` (corregido)
- THEN encuentra la actividad (antes con `w.nombre` devolvía `undefined`)

### REQ-07: Check Explícito Obligatorio

El check explícito de `talleres.length > 3` en `validateEventData` MUST existir además del validador de schema. No es redundante: Mongoose 7.8.8 no ejecuta update validators en operadores `$push`, `$addToSet` o `$pull` sobre arrays. El check explícito es la única garantía en esos paths de escritura.

#### Scenario: Validador explícito cubre caso no cubierto por schema

- GIVEN una operación que usa `$push` para añadir una actividad resultando en 4 elementos
- WHEN el sistema ejecuta `validateEventData`
- THEN el check explícito detecta `talleres.length > 3` y responde 400

## Edge Cases

| Case | Behavior |
|------|----------|
| `talleres: undefined` en payload | El validador trata ausencia como "sin cambio de selección" — no valida catálogo |
| `talleres: null` | Schema Mongoose rechaza (tipo array esperado) |
| Nombre con espacios extra o case distinto | Comparación normalizada (trim + minúsculas) en ambos lados: `'Slime'` = `'slime'` = `' Slime '`. Se aplica a la deduplicación, a la detección de selección modificada y a la resolución contra el catálogo. Motivo: el catálogo de producción tiene nombres con espacio final y la migración recorta el valor legacy (fix D-01, PR #16) |
| Catálogo vacío (`Config.workshops: []`) | Cualquier nombre es inválido → 400 si es selección nueva |
| Duplicados entre `talleres` y `personajes` | Permitido — son arrays independientes; solo se deduplica dentro de cada array |
| Payload con ambos `talleres` y `personajes` duplicados | Ambas validaciones aplican; primer error encontrado retorna 400 |

## Acceptance Criteria

- [ ] `talleres.length > 3` → 400 (schema + check explícito)
- [ ] Duplicados en `talleres` → 400 "Actividad duplicada: {nombre}"
- [ ] Duplicados en `personajes` → 400 "Personaje duplicado: {nombre}"
- [ ] Nombre inexistente o `active: false` en selección nueva/modificada → 400 "Actividad no válida o inactiva: {nombre}"
- [ ] Recálculo sin cambio de selección con nombre legacy → fallback + `console.warn`, sin 400
- [ ] Lookup corregido a `w.name` en `ReservationDetailView.jsx`
- [ ] Check explícito presente en `validateEventData` (no solo schema)
