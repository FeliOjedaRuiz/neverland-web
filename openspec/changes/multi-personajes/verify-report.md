# Verify Report: multi-personajes

**Date**: 2026-06-15
**Status**: PARTIAL

## Executive Summary

The multi-personajes feature is **functionally complete** with all tests passing (122/122) and build succeeding. The core pricing logic, snapshot invalidation, migration script, multi-character selection UX, admin read/edit views, and pricing page are all implemented and verified.

**However**, 3 regression issues and 1 minor spec deviation were identified that lower the status to PARTIAL. The regressions affect admin views after data migration removes the old `personaje` field.

## Test Results

| Suite | Passed | Failed | Total |
|-------|--------|--------|-------|
| API (budget-flow, etc.) | 68 | 0 | 68 |
| Web (bookingUtils, Step8Summary, safariGuardian, etc.) | 54 | 0 | 54 |
| **Total** | **122** | **0** | **122** |

## Build Result

**PASS** — `cd web && npm run build` completed successfully. 2287 modules transformed, no errors.

## Spec Compliance

| Spec | Compliant | Partial | Non-Compliant |
|------|-----------|---------|--------------|
| character-data-migration | 5 | 0 | 0 |
| character-pack-pricing | 5 | 1 (REQ-05) | 0 |
| multi-character-selection | 4 | 1 (REQ-04) | 0 |
| **Total** | **14** | **2** | **0** |

### character-data-migration — FULL COMPLIANCE ✅

| Req | Status | Evidence |
|-----|--------|----------|
| REQ-01: String→Array conversion | ✅ | Migration script handles all cases: `'Elsa'`→`['Elsa']`, `'ninguno'`/null/undefined→`[]` |
| REQ-02: Idempotent | ✅ | Skips events with existing `personajes` field |
| REQ-03: Config pack price | ✅ | Adds `precioPack3Personajes: 100` if absent, preserves existing |
| REQ-04: Price recalculation | ✅ | Recalculates `precioPersonajeApplied` per count |
| REQ-05: Backward compatibility | ✅ | `[]` = no surcharge, "Sin personaje" in views |

### character-pack-pricing — PARTIAL COMPLIANCE ⚠️

| Req | Status | Evidence |
|-----|--------|----------|
| REQ-01: 1=40, 2=80 | ✅ | Backend `calculateEventPrice()` and frontend `calculateBookingTotal()` both correct |
| REQ-02: Pack 3=100 | ✅ | Both use `precioPack3Personajes \|\| 100` |
| REQ-03: Snapshot total cost | ✅ | `precioPersonajeApplied` stores total (40/80/100), not unit |
| REQ-04: Sorted array invalidation | ✅ | Two-pass invalidation with `JSON.stringify(sorted)` comparison |
| REQ-05: Price display in all views | ⚠️ | **ReservationDetailModal.jsx** (not in scope) and **ReservationDetailView.jsx line 1201** (in scope, but missed) still use old `personaje` field → broken after migration |
| REQ-06: Config panel field | ✅ | Dynamic iteration over `config.preciosExtras` includes `precioPack3Personajes` with label "Pack 3 personajes" |

### multi-character-selection — PARTIAL COMPLIANCE ⚠️

| Req | Status | Evidence |
|-----|--------|----------|
| REQ-01: Silent multi-select toggle | ✅ | Toggle array logic, no badges/counters, checkmark on all selected |
| REQ-02: Max 3 with toast | ✅ | `if (current.length >= 3)` blocks, toast "El máximo es 3 personajes" auto-dismiss 3s |
| REQ-03: Dynamic price display | ✅ | 0→none, 1→"40€", 2→"80€", 3→"Pack 3: 100€" |
| REQ-04: "Quitar todos" / "Sin Visita" | ⚠️ | Shows at >=1 (implementation), spec says >=2. Minor UX deviation. |
| REQ-05: Admin edit multi-select | ✅ | Chips with removable X, picker stays open, max 3 enforced with toast |

## Design Compliance

| ADR | Status | Evidence |
|-----|--------|----------|
| `personaje`→`personajes` | ✅ | Model replaced, migration drops old field |
| `precioPersonajeApplied` = total | ✅ | Snapshot stores total cost |
| Sorted array invalidation | ✅ | `sort().join(',')` comparison |
| Pack pricing from Config | ✅ | Uses `precioPack3Personajes` from Config |
| Silent multi-select | ⚠️ | Minor: "Quitar todos" threshold = 1 (design says 2) |
| Migration idempotency | ✅ | Checks for `personajes` existence |

## Critical Issues

None — all tests pass, core functionality works correctly.

## Warnings

1. **⚠️ ReservationDetailView.jsx:1201 — Price breakdown uses old `personaje` field**
   - **File in scope?** YES (file #13 in design)
   - **Issue**: After migration, `personaje` is deleted. The price breakdown section at line 1201 checks `reservation.detalles?.extras?.personaje` which will be `undefined`, so the character cost line will NOT appear in the admin price breakdown for migrated events.
   - **Fix**: Replace with `personajes.length > 0` check and display multi-char format.

2. **⚠️ ReservationDetailModal.jsx:226-235 — Character display uses old `personaje` field**
   - **File in scope?** NO (not in the 18-file change list)
   - **Issue**: After migration, `personaje` is deleted. The modal will show a purple (active-style) character box but with an empty name string.
   - **Fix**: Update to use `personajes` array: show first character name or chips.

3. **⚠️ DayDetailView.jsx:110,138 — Blocking defaults use legacy `personaje: 'ninguno'`**
   - **File in scope?** NO
   - **Issue**: Creates new blocking events with old field name. Mongoose `strict: true` strips it, so `personajes` defaults to `[]`. Works but inconsistent.
   - **Fix**: Replace `personaje: 'ninguno'` with `personajes: []`.

## Suggestions

1. **"Quitar todos" threshold** — The spec says "Quitar todos" should appear when >=2 characters selected. Currently appears at >=1. Consider updating `showQuitarTodos` to `selectedPersonajes.length >= 2` to match spec exactly.

2. **Admin price breakdown** — Consider adding multi-character pricing display in the price breakdown section (around line 1201) to show character cost line items correctly after migration.

3. **DayDetailView defaults** — Update blocking event defaults for consistency even though Mongoose handles it.

## Artifacts

- Report file: `openspec/changes/multi-personajes/verify-report.md`
- Engram topic key: `sdd/multi-personajes/verify-report` (capture_prompt: false)

## Skill Resolution

- `paths-injected`: `mern_testing_specialist` (from `.agents/skills/mern_testing_specialist/SKILL.md`)
- `paths-injected`: `mobile_ux_expert` (from `.agents/skills/mobile_ux_expert/SKILL.md`)
