# multi-character-selection Specification

## Purpose

Define UX behavior for selecting up to 3 characters per event with silent multi-select — the interface shows no indication of multi-selection until the user organically discovers it by clicking a second character.

## Requirements

| ID | Requirement | Keyword |
|----|------------|---------|
| REQ-01 | Silent multi-select toggle — click adds, click again removes; first selection looks identical to current single-select UX | MUST |
| REQ-02 | Maximum 3 characters enforced; 4th attempt shows auto-dismissing message | MUST |
| REQ-03 | Dynamic price display below cards: 1=40€, 2=80€, 3="Pack 3: 100€" | MUST |
| REQ-04 | "Quitar todos" button when >=2 selected; clears entire array | MUST |
| REQ-05 | Admin edit picker supports same multi-toggle with removable chips, stays open on selection | MUST |

### REQ-01: Silent Multi-Select Toggle

The system MUST support toggle-based multi-selection of up to 3 characters without visual indicators of multi-selection capability. No instructional text, badges, or counters SHALL appear. The UX discovery is organic.

#### Scenario: First character selection (no visual change from current UX)

- GIVEN `personajes: []`
- WHEN user clicks a character card
- THEN character is added and shows a check mark — visually identical to current single-select behavior

#### Scenario: Second character added (organic discovery)

- GIVEN character A is selected
- WHEN user clicks character B
- THEN both A and B show check marks. No "2/3" counter, no instructional text appears. User discovers multi-select organically.

#### Scenario: Toggle to deselect

- GIVEN character A is selected
- WHEN user clicks character A again
- THEN character A is removed from the array. If array becomes empty, UI reverts to "Sin Visita" state.

#### Scenario: Modal detail toggle

- GIVEN character A is in the selection array
- WHEN user opens character A's detail modal
- THEN action button shows "Quitar". When clicked, character is removed and array updates.

### REQ-02: Maximum 3 Characters Enforcement

The system MUST prevent selecting a 4th character. On attempt, a toast SHALL display "El máximo es 3 personajes" and auto-dismiss after 3 seconds. The 4th character is NOT added to the array.

#### Scenario: Block 4th character

- GIVEN `personajes: ['Elsa', 'Anna', 'Mickey']`
- WHEN user clicks an unselected character
- THEN character is NOT added. Toast "El máximo es 3 personajes" appears and auto-dismisses after 3 seconds.

### REQ-03: Dynamic Price Display

The system MUST update the displayed character price dynamically below the card grid.

| Characters | Display |
|------------|---------|
| 0 | (no price shown) |
| 1 | "40€" |
| 2 | "80€" |
| 3 | "Pack 3: 100€" |

#### Scenario: Price transitions with selection

- GIVEN 1 character selected, price shows "40€"
- WHEN user adds a 2nd character
- THEN price updates to "80€"
- WHEN user adds a 3rd character
- THEN price updates to "Pack 3: 100€"

### REQ-04: "Quitar Todos" / "Sin Visita" Label Switch

When >=2 characters are selected, the "Sin Visita" button text MUST change to "Quitar todos". Clicking it SHALL clear the array to `[]` and revert the button to "Sin Visita". Price returns to not shown.

#### Scenario: Clear all with multiple selected

- GIVEN `personajes: ['Elsa', 'Anna']`, button shows "Quitar todos"
- WHEN user clicks "Quitar todos"
- THEN `personajes: []`, button reverts to "Sin Visita", price disappears

### REQ-05: Admin Edit Multi-Select

The admin reservation editor MUST support the same multi-toggle behavior. Selected characters SHALL appear as removable chips above the collapsed picker. The picker SHALL NOT close on character selection.

#### Scenario: Admin adds and removes via chips

- GIVEN admin editing a reservation with `personajes: ['Elsa']`
- WHEN admin opens picker and clicks 'Anna'
- THEN both appear as chips above picker, picker stays open, price updates
- WHEN admin clicks "x" on 'Elsa' chip
- THEN 'Elsa' is removed, chip disappears, price recalculates to 40€

## Edge Cases

| Case | Behavior |
|------|----------|
| Rapid consecutive clicks | No duplicate entries, no phantom selections |
| iOS Safari touch | `onClick` handlers only (no hover-dependent logic) |
| All deselected via toggles | Price shows 0€, button reverts to "Sin Visita" |
| Empty array rendered in summary | Shows "Sin visita" text, no surcharge |

## Acceptance Criteria

- [ ] Select 1, 2, or 3 characters via toggle — no instructional UI
- [ ] 4th character attempt shows auto-dismissing "El máximo es 3 personajes"
- [ ] "Quitar todos" appears when >=2 selected
- [ ] Price dynamic: 40€ → 80€ → "Pack 3: 100€"
- [ ] Admin edit picker: multi-select with chips, stays open
- [ ] Works correctly on Safari iOS
