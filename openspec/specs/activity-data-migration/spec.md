# activity-data-migration Specification

## Purpose

Definir el script de migración one-shot idempotente `taller` → `talleres`, el helper de compat-read transitorio `obtenerTalleres`, y la adaptación de scripts de snapshots existentes para leer `talleres` en lugar de `taller`.

## Requirements

| ID | Requirement | Keyword |
|----|------------|---------|
| REQ-01 | Script `migrate-taller-to-array.js` idempotente con backup previo | MUST |
| REQ-02 | Lectura con `.lean()` para evitar defaults de Mongoose | MUST |
| REQ-03 | Reglas de transformación `taller` → `talleres` con preservación de snapshots | MUST |
| REQ-04 | `$unset taller` en todos los documentos procesados; sin dual-write | MUST |
| REQ-05 | `precioTotal` NEVER tocado por la migración | MUST NOT |
| REQ-06 | Modo dry-run con estadísticas | MUST |
| REQ-07 | Helper de compat-read `obtenerTalleres(extras)` transitorio | MUST |
| REQ-08 | Scripts de snapshots adaptados a leer `talleres` | MUST |

### REQ-01: Script de Migración Idempotente con Backup

El sistema MUST proveer un script `api/scripts/migrate-taller-to-array.js` que siga el precedente de `api/scripts/migrate-personaje-to-array.js`. Antes de ejecutar, MUST invocar el backup mediante `api/scripts/backup-before-migrate.js` guardando el resultado en `api/scripts/backups/`. El script MUST ser idempotente: ejecutarlo dos veces produce el mismo resultado sin errores ni efectos secundarios.

#### Scenario: Ejecución normal con documentos legacy

- GIVEN base de datos con eventos que tienen `detalles.extras.taller` (String)
- WHEN se ejecuta `node api/scripts/migrate-taller-to-array.js`
- THEN se genera backup previo en `api/scripts/backups/`, se transforman los documentos y se reportan estadísticas

#### Scenario: Ejecución idempotente (segunda vez)

- GIVEN todos los documentos ya tienen `detalles.extras.talleres` (array) y no tienen `taller`
- WHEN se ejecuta `node api/scripts/migrate-taller-to-array.js` por segunda vez
- THEN el script detecta que cada documento ya está migrado (skip), no modifica nada, y reporta 0 transformaciones

#### Scenario: Backup generado antes de cualquier escritura

- GIVEN base de datos con documentos por migrar
- WHEN se inicia la migración
- THEN el backup se completa ANTES de que se ejecute la primera operación de escritura

### REQ-02: Lectura con .lean()

El script MUST usar `Event.find({}).lean()` para leer los documentos. Esto es obligatorio para que los campos ausentes sean realmente `undefined` en vez de recibir los valores por defecto de Mongoose (que falsearían la detección de "ya migrado").

#### Scenario: Campo ausente detectado correctamente con lean

- GIVEN documento sin campo `detalles.extras.talleres` en la base de datos
- WHEN el script lee con `.lean()`
- THEN `doc.detalles.extras.talleres` es `undefined` (no un array vacío por default de Mongoose)

#### Scenario: Sin lean — comportamiento incorrecto (contraste)

- GIVEN documento sin campo `talleres` en la base de datos
- WHEN el script leyera SIN `.lean()` (caso erróneo)
- THEN Mongoose devolvería `talleres: []` por default, impidiendo detectar que el documento necesita migración

### REQ-03: Reglas de Transformación

El script MUST aplicar las siguientes reglas de transformación por documento:

| Condición | Acción `talleres` | Acción `precioTallerApplied` |
|-----------|-------------------|------------------------------|
| `extras.talleres !== undefined` | Skip (ya migrado) | Sin cambio |
| `extras` ausente | Skip | Sin cambio |
| `taller: 'X'` (X !== 'ninguno', no null, no undefined) | `$set talleres: ['X']` | Preservar existente; backfill ausente con fórmula actual |
| `taller: 'ninguno'` ó `null` ó `undefined` | `$set talleres: []` | `$unset precioTallerApplied` |

#### Scenario: Actividad válida — transformación a array

- GIVEN documento con `taller: 'Slime'` y `precioTallerApplied: 20`
- WHEN el script procesa el documento
- THEN `$set talleres: ['Slime']`, preserva `precioTallerApplied: 20`, `$unset taller`

#### Scenario: Actividad válida sin snapshot — backfill

- GIVEN documento con `taller: 'Slime'` y sin `precioTallerApplied`
- WHEN el script procesa el documento
- THEN `$set talleres: ['Slime']`, calcula `precioTallerApplied` con la fórmula actual y lo persiste, `$unset taller`

#### Scenario: Taller 'ninguno' — array vacío

- GIVEN documento con `taller: 'ninguno'`
- WHEN el script procesa el documento
- THEN `$set talleres: []`, `$unset precioTallerApplied`, `$unset taller`

#### Scenario: Taller null — array vacío

- GIVEN documento con `taller: null`
- WHEN el script procesa el documento
- THEN `$set talleres: []`, `$unset precioTallerApplied`, `$unset taller`

#### Scenario: Taller undefined (campo ausente) — array vacío

- GIVEN documento con campo `taller` ausente en `extras`
- WHEN el script procesa el documento
- THEN `$set talleres: []`, `$unset precioTallerApplied`, `$unset taller`

#### Scenario: Extras ausente — skip

- GIVEN documento sin campo `detalles.extras`
- WHEN el script procesa el documento
- THEN skip sin modificar el documento

#### Scenario: Ya migrado — skip idempotente

- GIVEN documento con `talleres: ['Slime']` ya presente
- WHEN el script procesa el documento
- THEN skip (ya migrado), sin modificar el documento

### REQ-04: $unset taller Sin Dual-Write

El script MUST ejecutar `$unset` del campo legacy `taller` en cada documento procesado (no skipped). Después de la migración, MUST NOT existir el campo `taller` en ningún documento migrado. No se realiza dual-write: el código nuevo solo lee/escribe `talleres`.

#### Scenario: Campo legacy eliminado

- GIVEN documento con `taller: 'Slime'` migrado a `talleres: ['Slime']`
- WHEN la migración completa
- THEN el campo `taller` no existe en el documento

#### Scenario: Sin escritura dual post-migración

- GIVEN código nuevo crea o actualiza un evento
- WHEN persiste actividades
- THEN solo escribe `talleres`, nunca `taller`

### REQ-05: precioTotal Intocado

La migración MUST NOT modificar el campo `precioTotal` de ningún documento. El `precioTotal` refleja el precio facturado históricamente y su integridad es crítica.

#### Scenario: precioTotal preservado tras migración

- GIVEN documento con `precioTotal: 350`
- WHEN el script migra `taller` → `talleres`
- THEN `precioTotal` sigue siendo 350, sin recálculo

### REQ-06: Modo Dry-Run

El script MUST soportar un modo dry-run que analiza los documentos y reporta estadísticas sin ejecutar ninguna operación de escritura. Las estadísticas SHALL incluir: total de documentos, a migrar, ya migrados (skip), con `'ninguno'`/null/undefined, con valor válido, con snapshot existente, con snapshot a backfill.

#### Scenario: Dry-run reporta estadísticas

- GIVEN base de datos con 100 eventos: 60 con `taller` válido, 30 con `'ninguno'`, 10 ya migrados
- WHEN se ejecuta `node api/scripts/migrate-taller-to-array.js --dry-run`
- THEN reporta: total=100, a migrar=90, skip=10, válidos=60, vacíos=30, sin escribir nada

#### Scenario: Dry-run no modifica base de datos

- GIVEN base de datos en cualquier estado
- WHEN se ejecuta el script con `--dry-run`
- THEN 0 documentos son modificados en la base de datos

### REQ-07: Helper de Compat-Read obtenerTalleres

El sistema MUST proveer una función transitoria `obtenerTalleres(extras)` que retorne siempre un `string[]` con fallback para la ventana deploy↔migración. La lógica es de **PRESENCIA**: si `extras.talleres` está presente y es un array se devuelve tal cual (un array vacío explícito gana al legacy); en otro caso se evalúa `extras.taller`, se normaliza con `trim().toLowerCase()` y, si no es `'ninguno'` ni vacío, se devuelve `[valorLimpio]`. En cualquier otro caso retorna `[]`. Esta función es de solo lectura, no escribe en la base de datos, y es retirable tras completar la migración. Para que la semántica de presencia funcione, el schema de `event.model.js` NO debe definir `default: []` sobre `talleres`; de lo contrario Mongoose inyectaría siempre la clave y el fallback legacy nunca se activaría.

#### Scenario: Documento ya migrado

- GIVEN `extras = { talleres: ['Slime', 'Tattoos'] }`
- WHEN se invoca `obtenerTalleres(extras)`
- THEN retorna `['Slime', 'Tattoos']`

#### Scenario: Documento legacy con taller válido

- GIVEN `extras = { taller: 'Slime' }` (sin campo `talleres`)
- WHEN se invoca `obtenerTalleres(extras)`
- THEN retorna `['Slime']`

#### Scenario: Documento legacy con 'ninguno'

- GIVEN `extras = { taller: 'ninguno' }` (sin campo `talleres`)
- WHEN se invoca `obtenerTalleres(extras)`
- THEN retorna `[]`

#### Scenario: Documento legacy sin taller

- GIVEN `extras = {}` (sin `talleres` ni `taller`)
- WHEN se invoca `obtenerTalleres(extras)`
- THEN retorna `[]`

#### Scenario: talleres vacío explícito gana al legacy

- GIVEN `extras = { talleres: [], taller: 'Cocina' }`
- WHEN se invoca `obtenerTalleres(extras)`
- THEN retorna `[]` (la selección vacía explícita tiene prioridad; el `$unset` de `taller` es responsabilidad de la migración)

#### Scenario: talleres existe y taller también (post-parcial)

- GIVEN `extras = { talleres: ['Slime'], taller: 'Cocina' }`
- WHEN se invoca `obtenerTalleres(extras)`
- THEN retorna `['Slime']` (`talleres` array válido tiene prioridad sobre el legacy `taller`)

### REQ-08: Scripts de Snapshots Adaptados

Los scripts de análisis y corrección de snapshots (`analyze-stale-snapshots.js`, `fix-stale-snapshots.js`) MUST ser adaptados para leer `talleres` (array) en lugar de `taller` (string). La lógica de detección de snapshots stale MUST comparar el conjunto actual de actividades contra el snapshot almacenado.

#### Scenario: Análisis de snapshots con talleres

- GIVEN evento con `talleres: ['Slime']` y `precioTallerApplied: 30` (incorrecto, debería ser 20)
- WHEN se ejecuta `analyze-stale-snapshots.js`
- THEN detecta el snapshot stale y lo reporta

#### Scenario: Fix de snapshots con talleres

- GIVEN evento con snapshot stale detectado en `precioTallerApplied`
- WHEN se ejecuta `fix-stale-snapshots.js`
- THEN recalcula `precioTallerApplied` usando `talleres` (array) y la fórmula de suma actual

## Edge Cases

| Case | Behavior |
|------|----------|
| Documento con `taller: ''` (string vacío) | Tratar como 'ninguno' → `talleres: []`, `$unset precioTallerApplied` |
| Documento con `extras: null` | Skip — sin extras que migrar |
| Actividad en `taller` ya no existe en catálogo actual | Migrar igualmente (preservar nombre histórico); la validación de catálogo aplica solo en selección nueva |
| Base de datos vacía | Script completa sin error, reporta 0 documentos |
| Interrupción a mitad de migración | Re-ejecución idempotente: documentos ya migrados se skipean, los pendientes se procesan |
| `obtenerTalleres` llamado con `extras: undefined` | SHOULD retornar `[]` (defensivo) |

## Acceptance Criteria

- [ ] Script `migrate-taller-to-array.js` sigue el precedente de `migrate-personaje-to-array.js`
- [ ] Backup generado en `api/scripts/backups/` antes de cualquier escritura
- [ ] `.lean()` usado para lectura — campos ausentes son realmente `undefined`
- [ ] `taller: 'X'` → `talleres: ['X']` con preservación/backfill de snapshot
- [ ] `taller: 'ninguno'/null/undefined` → `talleres: []` + `$unset precioTallerApplied`
- [ ] `$unset taller` en cada documento procesado; sin dual-write
- [ ] `precioTotal` jamás modificado
- [ ] Dry-run con estadísticas, sin escrituras
- [ ] Idempotencia: segunda ejecución = 0 transformaciones
- [ ] `obtenerTalleres(extras)` retorna array correcto para documentos migrados y legacy
- [ ] Scripts de snapshots adaptados a leer `talleres` (array)
