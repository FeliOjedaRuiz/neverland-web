# character-data-migration Specification

## Purpose

Define the one-shot, idempotent data migration from single-character String field (`detalles.extras.personaje`) to multi-character Array format (`detalles.extras.personajes`), with price recalculation and Config document update.

## Requirements

| ID | Requirement | Keyword |
|----|------------|---------|
| REQ-01 | Convert `personaje` String to `personajes` Array: `'Elsa'` → `['Elsa']`, `'ninguno'`/null → `[]` | MUST |
| REQ-02 | Idempotent: skip events that already have `personajes` field | MUST |
| REQ-03 | Add `preciosExtras.precioPack3Personajes: 100` to Config if absent | MUST |
| REQ-04 | Recalculate `precioPersonajeApplied` for every migrated event | MUST |
| REQ-05 | Application treats `personajes: []` as "no character" (backward compatible) | MUST |

### REQ-01: String to Array Conversion

The script MUST iterate all events and convert `detalles.extras.personaje` (String) to `detalles.extras.personajes` (Array of String). After conversion, the old `personaje` field SHALL be removed from the document.

| Old value | New value |
|-----------|-----------|
| `'Elsa'` | `['Elsa']` |
| `'ninguno'` | `[]` |
| `null` | `[]` |
| `undefined` (missing) | `[]` |
| `''` (empty string) | `[]` |
| `' '` (whitespace) | `[]` |

#### Scenario: Named character migration

- GIVEN event `detalles.extras.personaje: 'Elsa'`, no `personajes` field
- WHEN migration runs
- THEN `detalles.extras.personajes = ['Elsa']`, `detalles.extras.personaje` removed

#### Scenario: 'ninguno' migration

- GIVEN event `detalles.extras.personaje: 'ninguno'`
- WHEN migration runs
- THEN `detalles.extras.personajes = []`, `detalles.extras.personaje` removed

### REQ-02: Idempotency

The script MUST skip any event that already has `detalles.extras.personajes` (array). Running the migration twice SHALL produce identical results with no data corruption.

#### Scenario: Re-run safety

- GIVEN migration already completed, event has `personajes: ['Elsa']` and no `personaje`
- WHEN migration runs again
- THEN event is skipped. No changes. Logs "already migrated" at debug level.

### REQ-03: Config Document Update

The script MUST check the Config document for `preciosExtras.precioPack3Personajes`. If absent, it SHALL add it with default value 100. If present, it SHALL NOT modify it.

#### Scenario: Config without pack field

- GIVEN Config `preciosExtras: { personaje: 40 }`
- WHEN migration runs
- THEN Config updated: `preciosExtras.precioPack3Personajes = 100`

#### Scenario: Config already has pack field

- GIVEN Config `preciosExtras.precioPack3Personajes: 120`
- WHEN migration runs
- THEN Config NOT modified (preserves admin-set value)

### REQ-04: Price Recalculation

After converting characters, the script MUST recalculate `precioPersonajeApplied` for each event:

| Characters | Recalculated value |
|------------|-------------------|
| `[]` | 0 |
| `['X']` | unitPrice |
| `['X','Y']` | unitPrice × 2 |
| `['X','Y','Z']` | packPrice |

#### Scenario: Price recalculated for 2 characters

- GIVEN migrated event `personajes: ['Elsa', 'Anna']`, Config `personaje: 40`
- WHEN script recalculates
- THEN `precioPersonajeApplied = 80`

### REQ-05: Backward Compatibility

The application MUST treat `personajes: []` identically to the legacy `personaje: 'ninguno'` — no character surcharge, no character shown in views.

#### Scenario: Empty array in API

- GIVEN event with `personajes: []`
- WHEN `calculateEventPrice()` runs
- THEN no character surcharge added to total

## Edge Cases

| Case | Behavior |
|------|----------|
| Event has BOTH `personaje` and `personajes` | `personajes` takes precedence; `personaje` removed |
| Config document does not exist | Log error, skip Config update, continue event migration |
| Migration fails mid-run | Re-running processes remaining events (idempotent) |
| Concurrent writes during migration | Not safe — script designed for maintenance window |

## Acceptance Criteria

- [ ] All events: `personaje` field removed, `personajes` array present
- [ ] Named characters converted to single-element arrays
- [ ] 'ninguno'/null/empty → `[]`
- [ ] Re-running migration is safe (idempotent)
- [ ] Config gets `precioPack3Personajes: 100` if absent
- [ ] `precioPersonajeApplied` correctly recalculated for every event
- [ ] Application handles `personajes: []` as "no character"
