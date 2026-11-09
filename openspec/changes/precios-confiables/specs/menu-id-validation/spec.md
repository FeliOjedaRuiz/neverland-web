# Menu ID Validation Specification

## Purpose

Garantizar que el `menuId` enviado en el alta de una **reserva** sea válido y resoluble en el catálogo (`Config.menusNiños`), evitando la creación de reservas con precio de menú 0 € por referencia inválida.

## Requirements

| ID | Requirement | Strength |
|----|-------------|----------|
| REQ-01 | Validación de menuId en el alta de una reserva | MUST |
| REQ-02 | Respuesta 400 para menuId inválido | MUST |
| REQ-03 | menuId válido resuelve precio del catálogo | MUST |
| REQ-04 | La validación no aplica a los bloqueos de fecha | MUST |

### REQ-01: Validación de menuId en el alta de una reserva

En el alta de una reserva (`tipo: 'reserva'`), el servidor MUST verificar que el `menuId` proporcionado existe en `Config.menusNiños` antes de proceder con la creación.

#### Scenario: menuId válido

- GIVEN un `menuId` que existe en `Config.menusNiños`
- WHEN se envía el alta de una reserva con ese `menuId`
- THEN la reserva se crea y `precioApplied` refleja el precio del catálogo

#### Scenario: menuId inexistente

- GIVEN un `menuId` que no existe en `Config.menusNiños`
- WHEN se envía el alta de una reserva con ese `menuId`
- THEN el servidor responde 400 con mensaje descriptivo

#### Scenario: menuId vacío o ausente en una reserva

- GIVEN el alta de una reserva sin `menuId` o con `menuId` vacío
- WHEN se envía el alta
- THEN el servidor responde 400

### REQ-02: Respuesta 400 para menuId inválido

Cuando el `menuId` de una reserva no resuelve en el catálogo, el servidor MUST responder con HTTP 400 y un mensaje claro indicando que el menú no es válido. MUST NOT crear la reserva con precio 0 €.

#### Scenario: Prevención de reserva con precio 0

- GIVEN un `menuId: "inexistente"` que antes habría resultado en 0 €
- WHEN se envía el alta
- THEN se recibe 400 en lugar de crear una reserva con `precioApplied: 0`

### REQ-03: menuId válido resuelve precio del catálogo

Cuando `menuId` es válido, el servidor MUST usar el precio definido en `Config.menusNiños` para calcular `precioApplied` y el snapshot correspondiente.

#### Scenario: Resolución correcta de precio

- GIVEN `Config.menusNiños` contiene el menú `"M1"` con precio 180
- WHEN se envía el alta con `menuId: "M1"`
- THEN `precioApplied` se establece en 180

### REQ-04: La validación no aplica a los bloqueos de fecha

Un bloqueo de fecha (`tipo: 'bloqueo'`) no tiene menú: su precio es 0 € por diseño y su `menuId` puede estar ausente o ser un valor heredado. El servidor MUST NOT aplicar la validación de `menuId` a los bloqueos, de modo que el bloqueo de fechas del panel de admin MUST seguir funcionando.

#### Scenario: Bloqueo de fecha sin menuId

- GIVEN un usuario admin
- WHEN crea un bloqueo de fecha (`tipo: 'bloqueo'`) sin `menuId`
- THEN el bloqueo se crea correctamente y su precio es 0 €

#### Scenario: Bloqueo de fecha con menuId heredado que no resuelve

- GIVEN un bloqueo con `menuId: 1` (valor heredado que no existe en el catálogo actual)
- WHEN se crea el bloqueo
- THEN el bloqueo se crea correctamente, sin error 400

## Edge Cases

| Case | Expected |
|------|----------|
| `menuId` de menú retirado (no en config actual), alta de reserva | 400 — no se permite |
| `menuId` con typo / case sensitivity, alta de reserva | 400 si no hay match exacto |
| Alta de un bloqueo de fecha con `menuId` heredado | Se crea: el bloqueo no tiene menú y su precio es 0 € por diseño |
| Reservas existentes con menuId antiguo | No afectadas (la validación solo aplica al alta) |

## Acceptance Criteria

- [ ] Alta de reserva con `menuId` inválido → 400
- [ ] Alta de reserva con `menuId` válido → precio del catálogo
- [ ] No se crean reservas con `precioApplied: 0` por referencia inválida
- [ ] El alta de un bloqueo de fecha NO se ve afectada por la validación
- [ ] Reservas históricas no son afectadas por esta validación
- [ ] El mensaje de error 400 es descriptivo
