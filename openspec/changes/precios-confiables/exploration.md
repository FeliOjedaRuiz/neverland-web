# Exploration: precios-confiables — Precios confiables: el servidor como única fuente de verdad del precio

> **Título decidido**: "Precios confiables — el servidor como única fuente de verdad del precio de las reservas".
> **ID del change**: se mantiene `precios-confiables` por contrato de artefactos (`openspec/changes/precios-confiables/` y topic_key `sdd/precios-confiables/explore`).
> **Naturaleza**: exploración. No se modifica código ni comportamiento. Todo lo documentado está verificado contra el código actual con fichero y línea.

## Contexto

Este change recoge la deuda preexistente de **mass assignment / confianza en el cliente** quedó pendiente al archivar `multi-actividades`:

- `openspec/changes/archive/2026-11-08-multi-actividades/apply-progress.md:1111` — "Deuda preexistente de mass assignment (`event.set(req.body)`): change aparte."
- `openspec/changes/archive/2026-11-08-multi-actividades/archive-report.md:172` — severidad Media: "Un cliente admin podría fijar campos no previstos, incluido `precioTotal` sin modificar `detalles`."
- `openspec/changes/archive/2026-11-08-multi-actividades/verify-report.md:264` (S-03) y `:277` — recomendación explícita: change independiente con whitelist de campos.

La verificación empírica previa (API local con el mismo código que producción) demostró que la deuda es un **agujero explotable hoy**, no una abstracción: CREATE con `precioTallerApplied: 0` guarda la actividad a 0 €; CREATE con `precioApplied: 0` y `menuId` real deja el menú a 0 €; `estado: 'cancelada'` y `publicId: 'HACKED1'` se aceptan en el alta. Esta exploración re-verifica esos hechos en el código y completa la superficie de ataque que el análisis previo no cubría por entero.

Cambios previos relacionados (referencia, no solapan este alcance): `openspec/changes/fix-snapshot-pricing-update/` (invalidación de snapshots al cambiar selección) y `openspec/changes/workshop-pricing-safety/` (fallback defensivo de `pricePlus`).

## Estado actual verificado

### 1. Superficie de ataque del CREATE

Ruta pública sin autenticación: `api/config/routes.config.js:38` (`router.post('/events', events.create)`). El alta construye el documento con spread del body: `api/controllers/events.controllers.js:348-350` (`const datosEvento = { ...req.body, precioTotal: totalCalculado }; await Event.create(datosEvento)`). La única exclusión forzada es `precioTotal`. Todo lo demás del schema es escribible por el cliente.

**Campos de integridad de precio (impacto directo en €):**

| Campo | Schema | Punto de confianza | Estado | Impacto |
|---|---|---|---|---|
| `detalles.niños.precioApplied` | `event.model.js:45` | `events.controllers.js:129-141` — solo recalcula si `undefined`/`null` | EXPLOTABLE | Precio del menú por niño = lo que diga el cliente |
| `detalles.adultos.comida[].precioUnitario` | `event.model.js:53` | `events.controllers.js:160-162` — si no es `null`/`undefined` se usa tal cual | EXPLOTABLE (nuevo respecto al análisis previo) | Cada ración de adulto a 0 € |
| `detalles.extras.precioTallerApplied` | `event.model.js:83` | `events.controllers.js:223-247` — solo recalcula si `undefined`/`null` | EXPLOTABLE | Total de actividades = lo que diga el cliente |
| `detalles.extras.precioPersonajeApplied` | `event.model.js:92` | `events.controllers.js:257-263` — mismo patrón | EXPLOTABLE | Personajes = lo que diga el cliente |
| `detalles.extras.precioPinataApplied` | `event.model.js:94` | `events.controllers.js:270-278` (ruta legacy `pinata: true` + `catalogoItemIds` vacío/ausente) | EXPLOTABLE (solo ruta legacy) | Piñata = lo que diga el cliente |
| `detalles.extras.precioCatalogoApplied` | `event.model.js:96` | `events.controllers.js:178-206` | **NO explotable en €** — corrección al análisis previo: cuando `catalogoItemIds` es array, el total SIEMPRE se recalcula desde `extrasCatalogo` y se sobrescribe en la línea 205. Sin array, el valor del cliente se persiste pero no se suma al total (contaminación de display) | Inerte para € |
| `horario.costoExtension` | `event.model.js:108` (sin `min`) | `events.controllers.js:288-294` — si es truthy se usa tal cual (`!extCost` solo descarta `0`/`undefined`/`null`) | EXPLOTABLE (nuevo) | Extensión con importe negativo resta del total |
| `detalles.extras.costoExtra` | `event.model.js:99` (`max: 999`, sin `min`) | `events.controllers.js:281-283` — `total += costoExtra` crudo | EXPLOTABLE (nuevo) | **Descuento autoconcedido**: es un campo legítimo de admin (la UI lo etiqueta "Descuento" para negativos, `ReservationDetailView.jsx:1195`) pero la API lo acepta de cualquiera |
| `precioTotal` | `event.model.js:112` | `events.controllers.js:348` | PROTEGIDO en CREATE (se sobrescribe con el total del servidor) | — |

**Campos de negocio / identidad (sin impacto directo en € pero de integridad):**

| Campo | Punto | Estado | Impacto |
|---|---|---|---|
| `tipo` | `event.model.js:4-8`; `events.controllers.js:22` (validación salta), `:111` (precio 0) | EXPLOTABLE (nuevo) | `tipo: 'bloqueo'` cobra 0 €, se salta validaciones y **ocupa el turno** (consulta de disponibilidad `:339-342` e índice único `event.model.js:158-161` solo excluyen `cancelada`) → denegación de reserva de turnos. Ojo: el admin crea bloqueos legítimos por esta misma ruta (`BlockDateModal.jsx:53-54`, `DayDetailView.jsx:101-132`) |
| `estado` | `event.model.js:9-13` | EXPLOTABLE en CREATE (confirmado por verificación empírica); PROTEGIDO en PATCH para no-admin (`events.controllers.js:556-558`) | `estado: 'confirmado'` se salta la cola de pendientes; `cancelada` crea entradas muertas |
| `publicId` | `event.model.js:113`; pre-save solo genera si falta (`event.model.js:131`) | EXPLOTABLE | Elección/robo de identificador público (`unique` → colisión = error 500) |
| `invitationId` | `event.model.js:114`; pre-save `:143` | EXPLOTABLE | Elección de enlace de invitación |
| `googleEventId` | `event.model.js:115` | EXPLOTABLE | Rompe la sincronización con Google Calendar (`events.controllers.js:756` no crea evento real si ya viene relleno; `:780-782` intentaría borrar un id falso) |
| `notasAdmin` | `event.model.js:116` | EXPLOTABLE | Notas internas falsificables (se muestran como motivo del bloqueo, `events.controllers.js:841`) |
| `detalles.niños.menuId` | `event.model.js:43` | **Sin validar contra catálogo** (nuevo) | `events.controllers.js:132-136`: id desconocido → `childPrice = 0` sin error. Interactúa con el drift de ids (ver §4) |
| `cliente.*` (consentimientos) | `event.model.js:31-36` | Escribible (por diseño el cliente afirma su consentimiento, pero `fechaConsentimiento` es falsificable) | Riesgo de cumplimiento, menor |
| `fecha`, `turno`, `detalles.*` (selecciones) | — | Validados en su mayor parte (`validateEventData`, `events.controllers.js:20-105`) | Inocuos para precio cuando no van con snapshots |

Nota de precisión: el alta NO usa `event.set(req.body)` (esa es la ruta PATCH, `events.controllers.js:736`); usa `Event.create({ ...req.body, precioTotal })` (`:348-350`). Misma clase de defecto (mass assignment), distinto mecanismo.

### 2. Superficie de ataque del PATCH

Ruta con autenticación **opcional**: `api/config/routes.config.js:43-59` — intenta verificar el token pero continúa como anónimo si falta o es inválido. Protecciones reales para no-admin: estado (`events.controllers.js:556-558`) y ventana de 72 h (`:560-571`). No hay comprobación de propiedad del evento. Los `_id` son públicos: `events.controllers.js:470` (`publicDetail` expone `id`) y `:839` (disponibilidad expone `id`). Cualquiera con un id puede editar la reserva con >72 h de antelación.

| Comportamiento | Estado | Mecanismo |
|---|---|---|
| Snapshot manipulado **cuando la selección CAMBIA** | PROTEGIDO | Primera pasada borra el snapshot del documento previo (`events.controllers.js:609-659`), segunda pasada lo fuerza a `undefined` con `event.set` (`:677-724`) → `calculateEventPrice` recalcula desde catálogo |
| Snapshot manipulado **cuando la selección NO cambia** | EXPLOTABLE | El merge (`:668-672`) deja pasar el snapshot del cliente; los guards no se disparan; `calculateEventPrice` lo usa tal cual. El propio test lo codifica como comportamiento esperado: `api/tests/budget-flow.test.js:948-998` (REQ-06: PATCH sin la clave `talleres` que manda `precioTallerApplied: 99` → se persiste 99) |
| `precioTotal` aislado (sin tocar `detalles`/`fecha`/`turno`/`horario`) | EXPLOTABLE | `events.controllers.js:738-743` solo recalcula si `isModified('detalles' | 'fecha' | 'turno' | 'horario')`. Un `PATCH { precioTotal: 0 }` se persiste tal cual. Es exactamente la deuda S-03 del archive (`archive-report.md:172`) — **corrección al hallazgo previo**: `precioTotal` NO "siempre lo recalcula el servidor" |
| `adultos.comida[].precioUnitario` | EXPLOTABLE en PATCH | Sin invalidación en ninguna pasada; el merge reemplaza el array `comida` (`:668-670`) y `calculateEventPrice` vuelve a confiar (`:160-162`) |
| `costoExtra` | EXPLOTABLE en PATCH (incluso para anónimos) | No está en ninguna pasada de invalidación; la UI solo lo envía si es admin (`ReservationDetailView.jsx:1554`), pero la API no lo exige |
| `horario.costoExtension` | EXPLOTABLE en PATCH | Los guards de invalidación miran `newDetalles.horario` (`events.controllers.js:652-655` y `:717-720`), pero ningún cliente real envía `horario` dentro de `detalles` (el modelo ni lo define ahí, `event.model.js:104` es top-level): el front manda `horario` top-level (`BookingPage.jsx:364-373`, `ReservationDetailView.jsx:1596-1604`). Los guards son **código muerto** y el valor del cliente entra por `event.set(req.body)` (`:736`) |
| `publicId`, `invitationId`, `googleEventId`, `notasAdmin`, `tipo` | EXPLOTABLE en PATCH | Pasan por `event.set(req.body)` (`:736`) sin whitelist |
| `estado` | PROTEGIDO para no-admin (`:556-558`); escribible por admin (legítimo) | — |

### 3. El modelo de precios real (`api/controllers/events.controllers.js:109-299`)

| Componente | Cálculo | Papel del snapshot |
|---|---|---|
| Menú infantil | `precioApplied × cantidad` (`:129-143`); si el snapshot falta, se resuelve `menuId` en `Config.menusNiños` y se escribe (`:132-140`); id desconocido → 0 € sin error | `precioApplied` = precio histórico por niño |
| Plus fin de semana | Viernes/dom/sáb: `plusFinDeSemana × cantidad` (`:146-152`). Sin snapshot; siempre se recalcula | — |
| Comida de adultos | `Σ precioUnitario × cantidad` (`:159-172`); si falta `precioUnitario`, se resuelve por nombre/id en `preciosAdultos` y se escribe como snapshot (`:163-170`) | `precioUnitario` dobla como snapshot histórico |
| Actividades | `precioTallerApplied` = TOTAL de la selección (`:221-252`); si falta, `Σ obtenerPrecioTaller(workshop, niños)` (`api/utils/pricing.js:121-130`, plus si >15 niños, `:104`) con fallback 25/30 € + `console.warn` para nombres no resueltos (`:232-239`); 0 actividades → se elimina el snapshot (`:251`) | `precioTallerApplied` = precio histórico total |
| Personajes | `precioPersonajeApplied` (`:254-265`); si falta: 3 → `precioPack3Personajes`, si no `personaje × n` | `precioPersonajeApplied` |
| Extras de catálogo | **Siempre recalculado** desde `extrasCatalogo` por `slug` cuando `catalogoItemIds` es array (`:178-206`); ítem inválido/inactivo → 400 (`:195-197`); doble escritura de `pinata`/`precioPinataApplied` (`:208-213`) | `precioCatalogoApplied` se deriva del catálogo, no del cliente |
| Piñata legacy | `pinata: true` sin selección de catálogo: `precioPinataApplied` si existe, si no el ítem `pinata` del catálogo o 15 € (`:270-279`) | `precioPinataApplied` |
| Costo extra | Suma cruda de `costoExtra` (`:281-283`). Concepto legítimo de admin (descuento/re cargo) | — |
| Extensión | `costoExtension` si es truthy; si no, `extension30/60` del catálogo (`:287-295`) | `costoExtension` actúa como snapshot |
| Total | `precioTotal` = suma del servidor (CREATE `:345-348`; PATCH `:738-742` con la condición ya citada) | — |

**Semántica de snapshot (regla de negocio a preservar):** el snapshot es el **precio histórico congelado** en el momento de la selección. En PATCH, si la selección cambia, el snapshot se invalida y se recalcula con el catálogo **actual** (la selección nueva paga precio de hoy). Si la selección no cambia, el snapshot se conserva para que un cambio posterior de catálogo **no reprecie una reserva ya cobrada**. La regla complementaria es que **el precio de una reserva nueva debe salir siempre del catálogo del servidor**. El defecto actual es que la "conservación" preserva la **copia del cliente** en vez de la **copia del servidor**, y que el CREATE acepta snapshots del cliente en absoluto.

### 4. Fragilidad latente de ids de menú (drift del Config)

- `Config.menusNiños[].id` es `Schema.Types.Mixed` (`api/models/config.model.js:6`) y el `toJSON` del schema sobrescribe `ret.id = ret._id` (`config.model.js:70-77`), de modo que la API devuelve como `id` el `_id` del subdocumento, no el identificador estable.
- `config.update` reemplaza el array con `findOneAndUpdate({}, req.body, ...)` (`api/controllers/config.controllers.js:57-61`): cada guardado del admin regenera los `_id` de los subdocumentos. El valor que el front devuelve como `id` (el `_id` anterior) queda en el campo Mixed y se pisa en la siguiente serialización.
- Consecuencia verificada en producción (análisis previo): solo 2 de los 12 ids distintos usados por las reservas coinciden con el config actual. No es un bug vivo porque el snapshot `precioApplied` se conserva y el `menuId` solo fuerza recálculo cuando cambia; pero **cualquier recálculo con un `menuId` antiguo da precio 0** (`events.controllers.js:132-136`) y el CREATE actual ya permite 0 € con un `menuId` inexistente.
- Pista en el código de que la clase de problema es conocida: `stripIds` (`events.controllers.js:661-666`) elimina `_id` de subdocumentos antes del merge del PATCH.

## Superficie de impacto

- `api/controllers/events.controllers.js` — `calculateEventPrice` (`:109-299`), `create` (`:301-386`), `update` (`:530-769`). Núcleo del cambio.
- `api/models/event.model.js` — límites de `costoExtra` (`:99`) y `costoExtension` (`:108`); posibles defaults/validaciones.
- `api/config/routes.config.js:38, 43-59` — POST público y PATCH con auth opcional: contexto de amenaza (no necesariamente se tocan).
- `web/src/pages/BookingPage.jsx:335-385` y `web/src/pages/BudgetPage.jsx:403-456` — construyen el payload con `precioTotal` del navegador (`:353` / `:421`), `extras` spread (`:360-362`) y `horario.costoExtension` calculado en el cliente (`:365-372` / `:433-440`).
- `web/src/components/booking/Step4Adults.jsx:110-125` — envía `precioUnitario: item.precio` en cada ración.
- `web/src/components/booking/Step3Kids.jsx:318` — solo escribe `menuId` (no snapshots): el flujo público NO envía `precioApplied`/`precioTallerApplied`/`precioPersonajeApplied` por sí mismo; `Step5Workshops.test.jsx:166-176` lo garantiza para actividades.
- `web/src/utils/bookingUtils.js:89-147` — total de espejo en el navegador (`calculateBookingTotal`); usa `precioUnitario` (`:111-113`) y resuelve menú por id (`:93-97`).
- `web/src/components/admin/ReservationDetailView.jsx` — edición admin: ya **strippea** snapshots (`:2388`, `:2906-2912`), fuerza recálculo de extensión (`:1603`), envía `costoExtra` solo si admin (`:1554`) y conserva `precioPinataApplied` al mantener piñata (`:2856`).
- `web/src/components/booking/Step8Summary.jsx:205-207` y `StepBudgetSummary.jsx:196-198` — leen snapshots para display (hidratación desde reserva existente): las respuestas deben seguir devolviéndolos aunque se strippeen en la entrada.
- `api/tests/budget-flow.test.js` — REQ-06 (`:948-998`) codifica la confianza en el cliente a corregir; `:1013-1051` sí debe seguir en verde.
- `api/models/config.model.js`, `api/controllers/config.controllers.js` — drift de ids (opción d).
- `web/src/components/admin/BlockDateModal.jsx:53-54`, `DayDetailView.jsx:101-132` — creación admin de `tipo: 'bloqueo'` por la ruta pública: cualquier restricción de `tipo` debe distinguir rol.

## Puntos de diseño clave

1. **Fuente única de verdad**: los importes (`precioApplied`, `precioUnitario`, `precioTallerApplied`, `precioPersonajeApplied`, `precioPinataApplied`, `costoExtension`, `costoExtra`) son campos **server-owned**. El cliente puede expresar SELECCIONES (`menuId`, `talleres`, `personajes`, `catalogoItemIds`, `pinata`, `extensionMinutos`, cantidades), nunca PRECIOS.
2. **Preservación histórica en PATCH**: cuando la selección no cambia, se debe conservar el snapshot **almacenado en el servidor**, ignorando cualquier snapshot que traiga el payload. Cuando cambia, recálculo desde catálogo (comportamiento actual ya correcto).
3. **`costoExtra` es asimétrico**: legítimo para admin (descuento), nocivo para el cliente. La regla es por rol, no por valor.
4. **400 vs. silencio**: si el servidor recalcula y el total difiere del mostrado por el navegador (config cacheada en la PWA), ¿se rechaza o se cobra el del servidor? La regla de negocio ya resuelve el fondo ("debe salir del catálogo del servidor"); queda la decisión de UX.
5. **Drift de ids**: resolver el menú por id estable o por nombre elimina la clase de "recálculo a 0 €", pero requiere migración de datos y toca el admin de config.

## Opciones evaluadas

### a) Ignorar los snapshots del cliente y recalcular desde catálogo (CREATE) + preservar snapshot del servidor (PATCH sin cambio de selección)

| | |
|---|---|
| Pros | Fuente única de verdad; no rompe clientes legítimos (el servidor simplemente recalcula y devuelve el evento con el precio real); preserva el histórico; elimina toda la clase de spoofing de importes en una decisión |
| Contras | El precio cobrado puede diferir del mostrado en el wizard si la config cacheada en el navegador está desactualizada (regla de negocio lo autoriza, pero hay que comunicarlo); no protege campos de identidad (`publicId`, `tipo`, ...) ni `costoExtra` por sí sola |
| Complejidad | Media |
| Riesgo de negocio | **Bajo** — es el que mejor encaja con la regla "reserva cobrada no cambia de precio; reserva nueva sale del catálogo del servidor" |

### b) Recalcular siempre y rechazar con 400 si el snapshot del cliente no coincide

| | |
|---|---|
| Pros | Detección explícita de manipulación; sin silencios |
| Contras | El front legítimo **sí** envía importes calculados en el navegador (`precioTotal`, `precioUnitario`, `costoExtension`) desde un bundle que puede estar cacheado (PWA `registerType: 'prompt'`) → falsos 400 en reservas legítimas = pérdida de clientes en el paso de submit; además entra en conflicto con la preservación histórica (un edit inocuo con catálogo cambiado dispararía el 400) |
| Complejidad | Media-Alta |
| Riesgo de negocio | **Alto** si se aplica a clientes; aceptable como modo estricto solo para admin |

### c) Whitelist de campos escribibles en `event.set(...)` / `Event.create(...)` (mass assignment clásico)

| | |
|---|---|
| Pros | Es la recomendación literal del archive (`verify-report.md:264`); protege de una sola vez identidad y sincronización (`publicId`, `invitationId`, `googleEventId`, `notasAdmin`, `estado`, `tipo`, `precioTotal`) y da el sitio natural donde aplicar la regla de rol de `costoExtra`; cambio quirúrgico, sin cambiar el algoritmo de precios |
| Contras | Por sí sola NO corrige el spoofing de snapshots ni `precioUnitario`/`costoExtension` dentro de `detalles` (requiere filtrado profundo o sanitizador); hay que mantenerla cuando se añadan campos al schema |
| Complejidad | Baja-Media |
| Riesgo de negocio | **Bajo** |

### d) Corregir el drift de ids del Config (menú resoluble por id estable o por nombre)

| | |
|---|---|
| Pros | Elimina la fragilidad latente "recálculo con `menuId` antiguo → 0 €"; hace fiable el recálculo que (a) instaura; aprovecha para validar `menuId` en CREATE (hoy desconocido = 0 €) |
| Contras | Migración de datos (reservas con `menuId` que ya no resuelve); toca `config.update` y el `toJSON` del modelo de config; alcance mayor y distinto problema de fondo |
| Complejidad | Alta |
| Riesgo de negocio | Medio (migración), pero alto valor preventivo |

### Combinación recomendada: **c + a** (núcleo), **b** solo como modo estricto admin (opcional), **d** como fase posterior o tarea acotada de resolución por nombre

- `c` cierra identidad/estado/tipo/`precioTotal` y aísla `costoExtra` por rol.
- `a` cierra la manipulación de importes preservando el histórico con la copia del servidor.
- `d` no es requisito para cerrar el agujero, pero sin él el recálculo forzado sigue siendo frágil ante ids antiguos; como mínimo, el CREATE debe **validar** `menuId` (400 si no resuelve y no hay snapshot) para que "recalcular desde catálogo" no signifique "precio 0 silencioso".

## Enfoque recomendado

**Whitelist de campos (c) + recálculo desde catálogo con preservación del snapshot del servidor (a).**

Trade-off principal: se acepta que el importe definitivo es el del servidor (puede diferir del preview del navegador si su config está cacheada), a cambio de eliminar la manipulación de precios sin romper el flujo legítimo ni la preservación histórica. Se descarta (b) como comportamiento por defecto porque convierte deriva de cache del cliente en errores 400 en el momento más sensible del embudo (submit de reserva). Criterio de contención: las respuestas siguen devolviendo los snapshots (para display admin y `publicDetail`), solo se ignora lo que entra.

**Criterios de aceptación derivados (para proposal/spec):**

1. Ningún importe enviado por el cliente afecta al `precioTotal` persistido ni a los snapshots almacenados; el precio de una reserva nueva sale siempre del catálogo del servidor.
2. PATCH sin cambio de selección conserva el snapshot **del servidor** (el payload no puede sobrescribirlo).
3. PATCH con cambio de selección recalcula desde el catálogo actual (comportamiento actual preservado).
4. `precioTotal` nunca persiste desde el cliente, ni en CREATE ni en PATCH (incluido el PATCH aislado que hoy explota S-03).
5. `costoExtra` solo es escribible por admin; el resto ignora (o 403, decisión abierta).
6. `estado`, `tipo`, `publicId`, `invitationId`, `googleEventId`, `notasAdmin` no son escribibles por clientes anónimos; `tipo: 'bloqueo'` sigue funcionando para admin.
7. Una reserva legacy con snapshot histórico no cambia de precio por un edit ajeno a su selección.
8. El CREATE rechaza (400) un `menuId` que no resuelve en catálogo, en lugar de cobrar 0 €.

## Riesgos y mitigaciones

- **El preview del wizard puede diferir del precio cobrado** si la PWA tiene config cacheada (el navegador calcula con `calculateBookingTotal`, `bookingUtils.js:89-147`). Mitigación: la respuesta 201 devuelve el evento con `precioTotal` real; valorar un aviso suave (log/métrica) cuando difiera, sin bloquear.
- **Flujo admin de `costoExtra` (descuento)**: si la whitelist no distingue rol, se rompe la función legítima de descuento (`ReservationDetailView.jsx:1195`, `:1554`). Mitigación: regla por rol, test específico.
- **Creación admin de bloqueos** por la ruta pública (`BlockDateModal.jsx:53-54`, `DayDetailView.jsx:101-132`): una restricción ingenua de `tipo` rompería el bloqueo de fechas. Mitigación: permitir `tipo: 'bloqueo'` con JWT admin.
- **Test REQ-06 codifica el comportamiento a corregir** (`budget-flow.test.js:948-998`: persistir el snapshot 99 del cliente). Debe reescribirse: con la nueva semántica, el PATCH debe conservar el snapshot **almacenado** (el fixture con 99 también obliga a decidir qué hacer con snapshots corruptos ya persistidos: respetarlos como históricos o repararlos con script — ver decisión abierta).
- **Reservas legacy y las 12 con actividad retirada** (fallback 25/30 € + `console.warn`, `events.controllers.js:232-239`): se protegen con "preservar cuando la selección no cambia"; un recálculo indiscriminado las repreciría. Mitigación: el fix NO debe forzar recálculo en PATCH sin cambio de selección.
- **Displays que leen snapshots** (`ReservationDetailView.jsx:1001, 1080, 1218-1229`, `Step8Summary.jsx:205-207`): las respuestas deben seguir incluyéndolos; solo se filtra la entrada.
- **La ventana de 72 h y la autoría** no se tocan, pero conviene saber que el PATCH sigue abierto a anónimos con id conocido (`routes.config.js:43-59`): este change reduce el daño de precio, no la superficie de edición.
- **Regresión de precisión numérica** si (b) se aplicara estrictamente: totales con redondeos distintos entre front y back dispararían 400. Mitigación: no aplicar (b) por defecto.

## Qué NO entra en este change

- La deuda de la ruta legacy `taller` (String) — ya resuelta con la normalización de escritura (`api/utils/pricing.js:81-97`).
- La regla de las 72 h (`events.controllers.js:560-571`).
- Las 12 reservas con actividades retiradas del catálogo (fallback histórico; solo se protege su comportamiento, no se reparan aquí).
- El mass assignment de otros endpoints (`config.update` con `findOneAndUpdate({}, req.body)`, `api/controllers/config.controllers.js:57-58`, admin-only; talleres, inscripciones, usuarios). El drift de ids del Config (opción d) se evalúa aquí pero puede ir en change propio si proposal decide desacoplarlo.

## Estrategia de pruebas (TDD: test ROJO primero)

Suite: `cd api && npm test && cd ../web && npm run test:run` (`openspec/config.yaml`, `apply.tdd: true`).

1. **CREATE ignora snapshots**: `precioApplied: 0` + `menuId` real → snapshot y total del catálogo; ídem `precioTallerApplied: 0`, `precioPersonajeApplied: 0`, `precioPinataApplied` (ruta legacy), `precioUnitario: 0`, `costoExtension` negativa, `precioTotal` del cliente.
2. **CREATE valida `menuId`**: id inexistente → 400 (hoy: 0 € silencioso, `events.controllers.js:132-136`).
3. **CREATE rol/identidad**: `costoExtra` anónimo → ignorado; `estado`/`publicId`/`invitationId`/`googleEventId`/`notasAdmin` no persisten desde el cliente; `tipo: 'bloqueo'` anónimo → 400 y admin → OK.
4. **PATCH preserva snapshot del servidor**: selección sin cambio + snapshot spoofed en el payload → se conserva el almacenado (reescribe el REQ-06 de `budget-flow.test.js:948-998`).
5. **PATCH con cambio de selección** → recálculo desde catálogo (los tests actuales `:1013-1051`, `:474-510` deben seguir en verde).
6. **PATCH `precioTotal` aislado** → el servidor lo recalcula desde `detalles` almacenados (cierra S-03).
7. **PATCH `costoExtra` admin-only** y **`costoExtension` spoofed** con `extensionMinutos` sin cambio → se recalcula desde catálogo (cierra los guards muertos de `detalles.horario`).
8. **Legacy**: PATCH de campo inocuo sobre reserva con snapshot histórico (incluida actividad retirada) → precio intacto.
9. **Front** (`npm run test:run`): `Step5Workshops.test.jsx`, `bookingUtils.test.js`, `Step8Summary.test.js` en verde; añadir aserción de que el payload puede seguir llevando `precioTotal`/`precioUnitario` sin efecto (o strippearse, según decida proposal).
10. **Roles**: admin sigue pudiendo editar `costoExtra`, crear bloqueos y forzar estados.

## Decisiones abiertas (para proposal/spec)

1. Snapshot/precio enviado por el cliente que no coincide: **ignorar silenciosamente** (recomendado) vs 400 vs 400 solo para admin.
2. `costoExtra`/`tipo`/identidad para clientes: **ignorar** vs **403/400 explícito**.
3. Snapshots corruptos ya persistidos (fixture 99 del test, datos reales si los hay): respetar como históricos vs reparación por script (existe base: `api/scripts/fix-stale-snapshots.js`, `analyze-stale-snapshots.js`).
4. Alcance de (d): incluir resolución de menú por nombre/id estable en este change o desacoplarlo (migración aparte).
5. Si el CREATE debe forzar `estado: 'pendiente'` siempre o permitir al admin fijarlo.

## Ready for Proposal

**Sí.** El agujero está acotado con evidencia de código y reproducción local; las opciones están evaluadas con trade-offs; la recomendación (c+a, d opcional) es ejecutable sin tocar la regla de negocio del precio histórico. Lo que el orquestador debe comunicar al usuario: el alcance real es **precio 0 € y descuentos autoconcedidos hoy, en reservas nuevas y en ediciones**, y el fix recomendado no cambia el precio de ninguna reserva ya cobrada.
