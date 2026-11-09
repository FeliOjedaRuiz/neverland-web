# Role-Based Event Fields Specification

## Purpose

Restringir la escritura de campos sensibles de evento según el rol del JWT. Los clientes anónimos/no-admin no pueden escribir campos administrativos; el admin conserva control total.

## Requirements

| ID | Requirement | Strength |
|----|-------------|----------|
| REQ-01 | costoExtra solo escribible por admin | MUST |
| REQ-02 | Campos administrativos no escribibles por clientes | MUST |
| REQ-03 | tipo bloqueo solo para admin | MUST |
| REQ-04 | Admin conserva capacidades completas | MUST |
| REQ-05 | estado en CREATE para clientes | MUST |

### REQ-01: costoExtra solo escribible por admin

`costoExtra` MUST ser escribible únicamente por usuarios con JWT de rol admin. Si un cliente anónimo o no-admin envía `costoExtra`, el campo MUST ser ignorado silenciosamente, sin error: el descarte silencioso se elige para no convertir un envío válido en un fallo, y porque el front legítimo puede enviar campos extra desde una PWA cacheada.

#### Scenario: Anónimo envía costoExtra

- GIVEN un usuario sin JWT admin
- WHEN envía CREATE o PATCH con `costoExtra: 50`
- THEN `costoExtra` es ignorado y no se persiste

#### Scenario: Admin envía costoExtra

- GIVEN un usuario con JWT admin
- WHEN envía PATCH con `costoExtra: 50`
- THEN `costoExtra` se persiste con valor 50

### REQ-02: Campos administrativos no escribibles por clientes

Los campos `estado`, `tipo`, `publicId`, `invitationId`, `googleEventId` y `notasAdmin` MUST NOT ser escribibles por clientes no-admin. Si se envían, MUST ser ignorados silenciosamente.

#### Scenario: Cliente envía campo administrativo

- GIVEN un usuario no-admin
- WHEN envía CREATE con `notasAdmin: "texto"` y `googleEventId: "abc"`
- THEN ambos campos son ignorados y no se persisten

#### Scenario: Admin envía campos administrativos

- GIVEN un usuario con JWT admin
- WHEN envía PATCH con `notasAdmin: "nota"` y `estado: "confirmada"`
- THEN ambos campos se persisten correctamente

### REQ-03: tipo bloqueo solo para admin

Crear un evento con `tipo: 'bloqueo'` MUST requerir JWT admin. Un cliente no-admin que envíe `tipo: 'bloqueo'` MUST recibir respuesta 400.

#### Scenario: Anónimo intenta crear bloqueo

- GIVEN un usuario sin JWT admin
- WHEN envía CREATE con `tipo: 'bloqueo'`
- THEN recibe respuesta 400

#### Scenario: Admin crea bloqueo

- GIVEN un usuario con JWT admin
- WHEN envía CREATE con `tipo: 'bloqueo'`
- THEN el evento se crea correctamente con `tipo: 'bloqueo'`

### REQ-04: Admin conserva capacidades completas

Los usuarios admin MUST poder: editar `costoExtra`, crear bloqueos, fijar `estado`, y escribir todos los campos administrativos.

#### Scenario: Admin fija estado en PATCH

- GIVEN un usuario admin y una reserva existente
- WHEN envía PATCH con `estado: 'confirmada'`
- THEN `estado` se actualiza a `confirmada`

### REQ-05: estado en CREATE para clientes

En el alta, si el cliente no es admin, el servidor MUST establecer `estado` con el valor por defecto (`pendiente`), ignorando cualquier valor enviado por el cliente. El admin MAY fijar el estado en el alta.

#### Scenario: Cliente envía estado en CREATE

- GIVEN un usuario no-admin
- WHEN envía CREATE con `estado: 'confirmada'`
- THEN la reserva se crea con `estado: 'pendiente'` (valor por defecto)

#### Scenario: Admin fija estado en CREATE

- GIVEN un usuario admin
- WHEN envía CREATE con `estado: 'confirmada'`
- THEN la reserva se crea con `estado: 'confirmada'`

## Edge Cases

| Case | Expected |
|------|----------|
| PATCH `costoExtra` por no-admin + cambio de campo legítimo | `costoExtra` ignorado, campo legítimo aplicado |
| Admin envía `costoExtra` con `costoExtension` falsificado | `costoExtra` se aplica, `costoExtension` sigue las reglas de precio del servidor |
| No-admin envía `tipo: 'bloqueo'` y `estado` a la vez | 400 por el tipo; el estado se ignora |

## Decisiones tomadas

- Campos prohibidos a clientes no-admin: se **ignoran en silencio** (no 400/403), para no romper envíos legítimos del front cuando la PWA sirve un bundle cacheado.
- `estado` en el alta: se fuerza `pendiente` **solo para clientes**; el admin puede fijarlo.

## Acceptance Criteria

- [ ] `costoExtra` ignorado cuando lo envía un no-admin
- [ ] `costoExtra` persiste cuando lo envía admin
- [ ] Campos administrativos ignorados para no-admin
- [ ] `tipo: 'bloqueo'` → 400 para no-admin
- [ ] Admin conserva escritura completa de todos los campos
- [ ] `estado` en CREATE forzado a `pendiente` para clientes no-admin
- [ ] El admin puede fijar el `estado` en el alta
