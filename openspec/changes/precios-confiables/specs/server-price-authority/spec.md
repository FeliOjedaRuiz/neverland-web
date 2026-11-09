# Server Price Authority Specification

## Purpose

Garantizar que todos los importes de una reserva sean calculados y controlados exclusivamente por el servidor, usando el catálogo vigente. Los clientes envían selecciones; el servidor resuelve precios.

## Requirements

| ID | Requirement | Strength |
|----|-------------|----------|
| REQ-01 | Whitelist de campos escribibles | MUST |
| REQ-02 | Cálculo de snapshots en CREATE | MUST |
| REQ-03 | Recálculo de precioTotal en CREATE | MUST |
| REQ-04 | Preservación de snapshot en PATCH sin cambio | MUST |
| REQ-05 | Recálculo de snapshot en PATCH con cambio | MUST |
| REQ-06 | Recálculo aislado de precioTotal en PATCH | MUST |
| REQ-07 | Integridad de reservas históricas | MUST |
| REQ-08 | Respuestas con snapshots para display | SHOULD |
| REQ-09 | Precio de la comida de adultos resuelto por catálogo | MUST |

### REQ-01: Whitelist de campos escribibles

El servidor MUST aplicar una whitelist de campos de entrada. Los campos de precio (`precioApplied`, `precioUnitario`, `precioTallerApplied`, `precioPersonajeApplied`, `precioPinataApplied`, `costoExtension`, `precioTotal`) enviados por el cliente MUST ser ignorados en el cálculo **y MUST descartarse del documento persistido**: un valor de precio enviado por el cliente no puede quedar almacenado ni mostrarse en el panel.

#### Scenario: Cliente envía precio manipulado

- GIVEN un payload de CREATE con `precioApplied: 0` y un `menuId` válido
- WHEN el servidor procesa la petición
- THEN `precioApplied` se calcula desde el catálogo, ignorando el valor del cliente

#### Scenario: El precio enviado por el cliente no queda almacenado

- GIVEN un payload de CREATE o PATCH con `precioTallerApplied: 0`
- WHEN el servidor procesa la petición
- THEN el documento persistido no contiene el `precioTallerApplied` enviado por el cliente

### REQ-02: Cálculo de snapshots en CREATE

El servidor MUST resolver cada snapshot de precio (`precioApplied`, `precioTallerApplied`, `precioPersonajeApplied`, `precioPinataApplied`, `costoExtension`) desde el catálogo vigente al crear una reserva, y MUST resolver el precio unitario de cada ítem de comida de adultos (`precioUnitario`) desde `Config.preciosAdultos` por `id` o `nombre` del ítem.

#### Scenario: CREATE con actividades válidas

- GIVEN un payload con `menuId` válido y selecciones de taller, personaje y piñata
- WHEN se crea la reserva
- THEN cada snapshot refleja el precio del catálogo, no del payload

#### Scenario: CREATE con costoExtension negativo en payload

- GIVEN un payload con `costoExtension: -50`
- WHEN se crea la reserva
- THEN `costoExtension` se calcula desde el catálogo según `extensionMinutos`

#### Scenario: CREATE con comida de adultos y precioUnitario falseado

- GIVEN un payload con comida de adultos cuyo `precioUnitario` no coincide con `Config.preciosAdultos`
- WHEN se crea la reserva
- THEN el `precioUnitario` de cada ítem se resuelve desde el catálogo

### REQ-03: Recálculo de precioTotal en CREATE

`precioTotal` MUST ser recalculado por el servidor como suma de los snapshots resueltos, ignorando cualquier `precioTotal` del cliente.

#### Scenario: Cliente envía precioTotal falso

- GIVEN un payload con `precioTotal: 1` y selecciones válidas
- WHEN se crea la reserva
- THEN `precioTotal` es la suma correcta de los snapshots del catálogo

### REQ-04: Preservación de snapshot en PATCH sin cambio de selección

Cuando un PATCH no modifica la selección subyacente, el servidor MUST preservar el snapshot almacenado, ignorando snapshots enviados en el payload.

#### Scenario: PATCH con snapshot falsificado sin cambio de selección

- GIVEN una reserva existente con `precioApplied: 200`
- WHEN se envía PATCH con `precioApplied: 0` sin cambiar `menuId`
- THEN `precioApplied` permanece en 200

### REQ-05: Recálculo en PATCH con cambio de selección

Cuando un PATCH modifica una selección (e.g., `menuId`, `taller`, `personaje`), el servidor MUST recalcular el snapshot correspondiente desde el catálogo.

#### Scenario: PATCH cambia menuId

- GIVEN una reserva con `menuId: "A"` y `precioApplied: 200`
- WHEN se envía PATCH con `menuId: "B"`
- THEN `precioApplied` se recalcula desde el catálogo para menú B

### REQ-06: Recálculo aislado de precioTotal en PATCH

Un PATCH que solo envía `precioTotal` MUST recalcular el total desde los `detalles` almacenados en el servidor.

#### Scenario: PATCH aislado de precioTotal

- GIVEN una reserva con snapshots almacenados que suman 350
- WHEN se envía PATCH con `precioTotal: 1`
- THEN `precioTotal` se recalcula a 350

### REQ-07: Integridad de reservas históricas

Un PATCH de campo inocuo sobre una reserva con snapshot histórico (incluyendo actividades retiradas) MUST NOT alterar los precios almacenados.

#### Scenario: PATCH inocuo en reserva histórica

- GIVEN una reserva antigua con actividad retirada y `precioApplied: 150`
- WHEN se envía PATCH cambiando solo `comentarios`
- THEN todos los snapshots de precio permanecen intactos

### REQ-08: Respuestas con snapshots

Las respuestas de la API SHOULD incluir los snapshots almacenados para uso de display en el frontend.

#### Scenario: GET de reserva

- GIVEN una reserva creada con snapshots calculados
- WHEN el cliente solicita GET de la reserva
- THEN la respuesta incluye `precioApplied`, `precioTotal` y demás snapshots

### REQ-09: Precio de la comida de adultos resuelto por catálogo

El `precioUnitario` de cada ítem de comida de adultos MUST resolverse siempre desde `Config.preciosAdultos` por `id` o `nombre` del ítem, tanto en CREATE como en PATCH. Cuando un PATCH **cambia** la lista de comida, el servidor MUST recalcular los `precioUnitario` afectados; cuando **no** la cambia, MUST preservar el valor almacenado (precio histórico de esa reserva).

#### Scenario: PATCH cambia la comida de adultos

- GIVEN una reserva con comida `{ item: "Pasteles", cantidad: 2, precioUnitario: 16 }`
- WHEN se envía PATCH con comida `{ item: "Pasteles", cantidad: 3 }` y sin `precioUnitario`
- THEN `precioUnitario` se resuelve desde el catálogo y `precioTotal` se recalcula con la cantidad nueva

#### Scenario: PATCH no cambia la comida de adultos

- GIVEN una reserva con comida `{ item: "Pasteles", cantidad: 2, precioUnitario: 16 }`
- WHEN se envía PATCH que no toca `detalles.adultos.comida`
- THEN `precioUnitario` permanece en 16 y el total no cambia

## Edge Cases

| Case | Expected |
|------|----------|
| `costoExtension` falso + `extensionMinutos` sin cambio en PATCH | Preservar `costoExtension` almacenado |
| `precioUnitario: 0` en CREATE | Calcular desde catálogo |
| Ítem de comida que ya no está en `Config.preciosAdultos` | Conservar el `precioUnitario` almacenado (precio histórico) y no sumar importe |
| Payload front con `precioTotal` (PWA cache) | Ignorado sin error |

## Open Questions

1. Si el preview del front difiere del cargo por config cacheada: ¿solo log (recomendado) o warning visible en confirmación?
2. ¿Se aprueban reparaciones puntuales de las 5 reservas antiguas cuya línea de actividad quedó a 0 €? (decisión de datos, fuera del alcance de la implementación de estas specs)

## Acceptance Criteria

- [ ] CREATE ignora todos los campos de precio del payload
- [ ] Los campos de precio ignorados no quedan almacenados en el documento
- [ ] CREATE calcula snapshots desde catálogo
- [ ] CREATE y PATCH resuelven el precio unitario de la comida de adultos desde el catálogo
- [ ] PATCH sin cambio preserva snapshot almacenado
- [ ] PATCH con cambio recalcula desde catálogo
- [ ] precioTotal siempre recalculado server-side
- [ ] Reservas históricas intactas ante PATCH inocuo
- [ ] Tests existentes del front (`npm run test:run`) siguen verdes
