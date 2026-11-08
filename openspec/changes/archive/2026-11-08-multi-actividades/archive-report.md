# Archive Report: Multi-Actividades — Hasta 3 actividades por evento

## Metadatos del archivo

| Campo | Valor |
|-------|-------|
| Change | `multi-actividades` |
| Fase SDD | `sdd-archive` |
| Fecha de archivo | 2026-11-08 (ISO) |
| Repo HEAD al archivar | `main` = `894fecc` |
| Veredicto de verificación | **PASS WITH WARNINGS** (0 CRITICAL, 0 bloqueantes) |
| Tareas | 10/10 completas |
| Requisitos / escenarios | 30/30 requisitos · 78/78 escenarios conformes |
| `artifact_store.mode` | `both` (sistema de archivos + Engram) |
| Destino en archivo | `openspec/changes/archive/2026-11-08-multi-actividades/` |
| Topic de este informe en Engram | `sdd/multi-actividades/archive-report` |
| Estado del ciclo | **Completo y archivado** |

## 1. Resumen ejecutivo

`multi-actividades` sustituye la selección de una única actividad por reserva (`detalles.extras.taller`, String) por una selección de hasta 3 actividades persistida como array de nombres (`detalles.extras.talleres`). El precio se calcula como la suma del precio de cada actividad (`priceBase` / `pricePlus` según tamaño de grupo) y el snapshot `precioTallerApplied` pasa a representar el **total** de la selección, sin renombrar el campo ni migrar importes históricos. La funcionalidad se extendió a ambos wizards (reserva y presupuesto), a la edición admin, a la vista pública `/mi-reserva/:id`, al correo de confirmación y al evento de Google Calendar.

El change se entregó en una cadena de 11 PRs encadenadas, más tres PRs de cierre (#17 reparación de nombres corruptos, #18 precios por actividad en el modal de extras, #19 estado "reserva no encontrada"). La cadena está mergeada en `main` (`894fecc`), con Render en estado `live` y Vercel en `success`. La migración de datos se ejecutó en producción sobre 398 eventos, en tres operaciones idempotentes y con backup previo obligatorio en cada una: reparación de 10 nombres de actividad corruptos, migración `taller` → `talleres` (397 escrituras; 1 documento ya migrado) y normalización de 8 nombres del catálogo. El resultado verificado es 398/398 eventos con `talleres`, 0 documentos con el campo legacy `taller` y **0 diferencias de `precioTotal`** contra el backup pre-migración.

La verificación final emitió **PASS WITH WARNINGS**: 30/30 requisitos y 78/78 escenarios conformes, 0 hallazgos CRITICAL, 5 WARNING no bloqueantes (W-03, W-04, W-05, W-06, W-08) y 7 SUGGESTION. API 159/159 tests, web 138/138 tests, build de Vite correcto. Los dos defectos encontrados por la verificación y el ensayo (D-01: comparación de catálogo sin normalización; D-02: nombres de actividad corruptos) fueron corregidos y desplegados antes de este archivo.

## 2. Autoridad de la información y fuentes

Este informe describe el estado **al cierre**, no el estado de las instantáneas intermedias. Las fuentes consultadas, por orden de autoridad efectiva:

| Fuente | Estado | Uso en este informe |
|--------|--------|---------------------|
| Hechos finales indicados por el orquestador (cadena de PRs mergeada, `main` = `894fecc`, operaciones de datos, veredicto) | Vigente | Estado de despliegue y cierre |
| `openspec/changes/multi-actividades/tasks.md` en `894fecc` | Vigente; 10/10 tareas marcadas | Puerta de completitud de tareas |
| `openspec/changes/multi-actividades/verify-report.md` en `894fecc` (Engram #984) | Instantánea de la re-verificación sobre `main` = `e82f0be` | Veredicto, matriz de conformidad, warnings |
| `openspec/changes/multi-actividades/apply-progress.md` en `894fecc` | Instantánea de implementación + cierre de TASK-08 | Evidencia de ejecución de la migración |
| `proposal.md`, `design.md`, 4 delta specs en `894fecc` | Vigentes | Alcance, decisiones y contenido canonizado |

Notas de trazabilidad:

- El `verify-report` se emitió sobre `main` = `e82f0be`. El HEAD final `894fecc` es un commit exclusivamente documental (`docs(sdd): add verify report and sync specs with shipped behaviour`), sin cambios de código de aplicación. Por tanto, la evidencia de verificación sigue siendo válida para el árbol final.
- Las observaciones de Engram `sdd/multi-actividades/spec` (#907) y `sdd/multi-actividades/tasks` (#912) son instantáneas antiguas (30 requisitos / 62 escenarios; previsión de líneas previa al corte real en slices). **No se usaron como fuente**: el artefacto autoritativo de specs y tareas es el del repositorio en `894fecc`, que refleja 30 requisitos / 78 escenarios y las 10 tareas completas. Se registra la discrepancia para que una futura lectura de Engram no tome esos datos como estado final.
- La observación `sdd/multi-actividades/verify-report` (#984) coincide con el archivo del repositorio (mismo `evidence_revision`, hashes de test y build, y veredicto).

## 3. Alcance entregado: las 10 tareas

| Task | Entrega | Evidencia principal |
|------|---------|---------------------|
| TASK-01 | Helpers puros de precio y compat-read en `api/utils/pricing.js` (`obtenerTalleres`, `obtenerPrecioTaller`, `esGrupoGrande`) + suite propia | `api/utils/pricing.js`, `api/tests/pricing.test.js` |
| TASK-02 | Modelo `talleres: [String]` (máx. 3) y validaciones: límite, dedupe de actividades y personajes, catálogo activo en selección nueva/modificada | `api/models/event.model.js`, `api/controllers/events.controllers.js`, `api/tests/events.test.js` |
| TASK-03 | Pricing por suma, snapshot `precioTallerApplied` como total, recálculo de `precioTotal` e invalidación de snapshot en los dos pases del PATCH (guard por presencia + conjunto ordenado) | `api/controllers/events.controllers.js`, `api/tests/budget-flow.test.js` |
| TASK-04 | Script de migración one-shot idempotente `taller` → `talleres`, con backup previo, `.lean()`, dry-run y `precioTotal` intocado | `api/scripts/migrate-taller-to-array.js` |
| TASK-05a | Helpers y precio web en espejo del servidor | `web/src/utils/bookingUtils.js`, `bookingUtils.test.js` |
| TASK-05b | Selector multi-actividad (toggle AÑADIR/QUITAR, límite 3 con aviso, chips, "Quitar actividad"/"Quitar todas"/"Sin actividad"), estado y payload de ambos wizards, resúmenes con N actividades | `Step5Workshops.jsx`, `BookingPage.jsx`, `BudgetPage.jsx`, `Step8Summary.jsx`, `StepBudgetSummary.jsx` |
| TASK-05c | Cobertura de ambos resúmenes y consistencia entre ellos | `Step8Summary.test.jsx`, `StepBudgetSummary.test.jsx`, `CrossSummaryConsistency.test.jsx` |
| TASK-06 | Admin y colaterales: edición multi con shim legacy, vista resumida, creadores de eventos, `PricingPage`, mailer, Google Calendar y scripts de snapshots | `ReservationDetailView.jsx`, `ReservationDetailModal.jsx`, `DayDetailView.jsx`, `BlockDateModal.jsx`, `PricingPage.jsx`, `mailer.config.js`, `google.service.js`, scripts de snapshots |
| TASK-07 | Suites transversales (contrato cross-layer del umbral 15/16, componente compartido por ambos wizards, consistencia de resúmenes) y gate de verificación final | `crossLayerPricing.test.js`, `CrossWizardWorkshops.test.jsx`, `CrossSummaryConsistency.test.jsx` |
| TASK-08 | Despliegue controlado y ejecución de las operaciones de datos en producción (manual) | Backups `backup-2026-11-06T13-01-19.json`, `13-01-44.json`, `13-02-27.json`; evidencias de apply-progress |

TASK-05 se subdividió en 5a/5b/5c porque el candidato real superó el presupuesto de revisión de 800 líneas; cada slice quedó por debajo del límite (308, 760 y 124 líneas respectivamente). El total acumulado del change fue de ~3.268 líneas revisables.

## 4. Capacidades publicadas

Las 4 capacidades son nuevas y quedan como fuente de verdad en `openspec/specs/`:

| Capacidad | Requisitos | Escenarios | Foco |
|-----------|-----------:|-----------:|------|
| `multi-activity-selection` | 8 | 19 | UX de selección múltiple, límite 3, chips, limpieza, admin, inicialización y colaterales visibles al usuario |
| `activity-sum-pricing` | 7 | 19 | Precio como suma, umbral `> 15` unificado, fallback de `pricePlus`, snapshot total, invalidación por conjunto e inclusión en `precioTotal` |
| `activity-validation` | 7 | 15 | Límite 3 (schema + check explícito), dedupe, catálogo activo y comportamiento de recálculo legacy |
| `activity-data-migration` | 8 | 25 | Script idempotente con backup, reglas de transformación, eliminación del campo legacy, dry-run y compat-read |
| **Total** | **30** | **78** | |

## 5. Evidencia de verificación

| Puerta | Resultado |
|--------|-----------|
| Veredicto | **PASS WITH WARNINGS** (`pass_with_warnings`) |
| Bloqueantes | 0 |
| Hallazgos CRITICAL | 0 |
| Requisitos | 30/30 |
| Escenarios | 78/78 conformes al texto literal de las specs |
| API | 5 suites / 159 tests en verde (Jest + Supertest + mongodb-memory-server) |
| Web | 14 archivos / 138 tests en verde (Vitest + Testing Library + jsdom) |
| Build | `cd web && npm run build` → exit 0 (Vite 7.3.1; PWA `injectManifest`, 9 entradas precacheadas) |
| Cobertura | No exigida (`coverage_threshold: 0`) |
| Desglose de escenarios | 50 con test automatizado pasado; 28 con evidencia runtime manual documentada (19 de migración, designadas `[MANUAL]` en `tasks.md`) o cobertura indirecta; 0 sin verificar |

Evidencia de los hashes de la ejecución (idénticos en el archivo y en Engram #984):

- `evidence_revision`: `sha256:01bcc0a91a9925bb2fa7d4dc9c74e0b5592aed1037772a8dfe0bb0eae1dbbdc3`
- `test_output_hash`: `sha256:59eddfe60d18172f4c08f4763d807509e7b0d38d5ac89ee2cab914296a9e6b83`
- `build_output_hash`: `sha256:45c6143eb2757640a0cfb448bee10a09fa62ff50a20f8a9d8ec76bf554a73e8e`

## 6. Despliegue y operaciones de datos

### Cadena de entrega

- Rama tracker `feat/multi-actividades` con estrategia `feature-branch-chain`; cada slice apuntó a la rama del slice anterior.
- Cadena de 11 PRs mergeada: **#6, #12, #13, #14, #7, #8, #15, #9, #10, #16, #11**.
- PRs de cierre: **#17** (script de reparación de nombres corruptos), **#18** (precios por actividad en el modal de extras), **#19** (estado "reserva no encontrada" en `/mi-reserva/:id`).
- `main` final = **`894fecc`** (commit documental sobre `e82f0be`, merge de #19).
- Estado de plataformas: Render **`live`**; Vercel **`success`**.

### Operaciones de datos en producción (2026-11-06)

Cada operación se ejecutó con backup previo obligatorio y verificación de idempotencia (segunda ejecución = 0).

| # | Operación | Resultado | Idempotencia |
|---|-----------|-----------|--------------|
| A | `fix-corrupt-workshop-names.js` (PR #17) | 10 nombres de actividad corruptos reparados (7 triplicados + 3 truncados) | 2.ª ejecución: 0 |
| B | `migrate-taller-to-array.js` | 398 leídos · 170 con actividad · 227 con selección vacía · 1 ya migrado · 0 backfills · **397 escrituras** | 2.ª ejecución: 0 transformaciones |
| C | `normalize-workshop-names.js` | 8 nombres del catálogo normalizados | 2.ª ejecución: 0 |

Backups generados antes de cada operación: `backup-2026-11-06T13-01-19.json` (antes de A), `backup-2026-11-06T13-01-44.json` (antes de B) y `backup-2026-11-06T13-02-27.json` (antes de C).

### Invariantes verificados contra el backup pre-migración

| Invariante | Resultado |
|------------|-----------|
| Eventos del backup ausentes en la base | 0 |
| Diferencias de `precioTotal` | **0** |
| Eventos con array `talleres` | 398/398, ninguno con más de 3 elementos |
| Eventos que conservan el campo legacy `taller` | 0 |
| Diferencias de `precioTallerApplied` | 4, todas en reservas sin actividad y eliminadas por diseño (residuos históricos de 25/30 €); `precioTotal` no cambió |
| Coherencia final con el catálogo | 161 de 173 valores resuelven; 12 corresponden a actividades retiradas ("Show de Magia" ×9, "Spa de Princesas" ×3), que conservan el fallback histórico por diseño |

## 7. Incidencias encontradas y resueltas antes de archivar

| ID | Incidencia | Resolución | Estado |
|----|-----------|-----------|--------|
| D-01 | Comparación de catálogo sin normalización de espacios: el catálogo tenía 8 nombres con espacio final y la migración recortaba el valor legacy, provocando 52 de 169 reservas sin resolver, 37 falsos negativos y 400 al editar | Helpers `normalizarNombreActividad` / `resolverWorkshop` (trim + minúsculas en ambos lados), espejo web, script de normalización del catálogo y regresiones en API y web (PR #16) | Corregido y desplegado |
| D-02 | Dos actividades del catálogo tenían saltos de línea reales en el nombre y se propagaban a selector, resumen, admin, email y Calendar | Script de reparación de nombres corruptos con backup y dry-run (PR #17); 10 valores reparados en producción | Corregido y desplegado |
| W-01 | Escenario "Con una sola actividad seleccionada" de `multi-activity-selection/REQ-04` no coincidía con el comportamiento implementado (bloqueante del archivo en la verificación anterior) | THEN del escenario alineado con el comportamiento deliberado ("Quitar actividad" con 1 selección; el botón limpia el array) y verificado contra código y tests | Resuelto |
| W-02 | Edge case de `activity-validation` describía la comparación sin normalizar | Edge case actualizado a comparación normalizada (trim + minúsculas) en ambos lados | Resuelto |
| W-07 | Recuento de escenarios de `activity-data-migration` desactualizado en la auditoría (24 vs. 25) | Tabla de cobertura de `tasks.md` corregida a 25 y total 78; nota aclaratoria en `apply-progress.md` | Resuelto |

## 8. Warnings aceptados en el archivo (no bloqueantes)

| ID | Descripción | Riesgo | Tratamiento |
|----|-------------|--------|-------------|
| W-03 | El escenario "Campo ausente no dispara invalidación" no tiene test discriminante: los PATCH existentes recalculan al mismo valor | Bajo (el guard por presencia es correcto) | Follow-up de cobertura |
| W-04 | Falta el test de la combinación exacta "PATCH que modifica la selección a una actividad inválida → 400" | Bajo (ramas cubiertas por separado) | Follow-up de cobertura |
| W-05 | Superficie admin, Google Calendar y scripts de snapshots sin cobertura automatizada (9 escenarios PARTIAL) | Medio (verificado manualmente en local y producción) | Follow-up de cobertura |
| W-06 | 19 escenarios de migración verificados solo por ejecución manual, por decisión explícita de `tasks.md` | Medio residual (sin red automatizada si el script se reutiliza) | Aceptado; evidencia runtime documentada |
| W-08 | Ruta legacy `taller` del schema y fallback de `obtenerTalleres` no retirados | Bajo (solo lectura, sin default, sin documentos legacy) | Follow-up de limpieza |

## 9. Sincronización de specs

`openspec/specs/` no existía; las 4 delta specs son specs completas de capacidades nuevas. Se copiaron de forma mecánica (`cp` + `diff -r`) y se verificó la identidad byte a byte antes y después del renombrado.

| Capacidad | Acción | Resultado |
|-----------|--------|-----------|
| `multi-activity-selection` | Creada | `openspec/specs/multi-activity-selection/spec.md` — 8 REQ / 19 escenarios |
| `activity-sum-pricing` | Creada | `openspec/specs/activity-sum-pricing/spec.md` — 7 REQ / 19 escenarios |
| `activity-validation` | Creada | `openspec/specs/activity-validation/spec.md` — 7 REQ / 15 escenarios |
| `activity-data-migration` | Creada | `openspec/specs/activity-data-migration/spec.md` — 8 REQ / 25 escenarios |

No hubo requisitos MODIFIED, REMOVED ni RENAMED que fusionar: todas las capacidades son nuevas y no existía spec previo con esos nombres.

Lectura de `openspec/specs` posterior a la sincronización: 30 requisitos (`### REQ-`) y 78 escenarios (`#### Scenario:`) en total, coincidente con el recuento autoritativo de la verificación.

## 10. Follow-ups que NO forman parte de este change

Se dejan explícitos para que la administración pueda priorizarlos. Ninguno bloquea el cierre del change.

| Prioridad recomendada | Follow-up | Motivo | Alcance sugerido |
|----------------------|-----------|--------|------------------|
| Alta | Red de seguridad automatizada: test discriminante del guard por presencia (W-03), combinación PATCH con selección modificada e inválida (W-04), cobertura mínima de admin / Calendar / scripts (W-05) y del auto-cierre del toast (S-04) | Protege el camino de facturación y la superficie que hoy depende de QA manual | `/tarea` o `/feature` de tests; priorizar W-03 y el test de Calendar por ser funciones puras y baratas |
| Alta | Retirar la ruta legacy `taller` del schema (`api/models/event.model.js`) y simplificar `obtenerTalleres` (W-08) | Ya no queda ningún documento legacy en producción (0/398); es limpieza segura y reduce complejidad | `/tarea` pequeña: eliminar la ruta deprecated, simplificar el helper y ajustar fixtures/tests que aún usan `taller` como compat-read |
| Media | Decidir qué hacer con las 12 reservas cuyas actividades ya no están en el catálogo ("Show de Magia" ×9, "Spa de Princesas" ×3) | Conservan el fallback histórico 25/30 € por diseño; el nombre histórico es su facturación. Requiere decisión de negocio, no técnica | Revisión admin caso por caso (o script asistido con backup) |
| Media | Deuda preexistente de mass assignment en `event.set(req.body)` (`api/controllers/events.controllers.js`, PATCH) | Un cliente admin podría fijar campos no previstos, incluido `precioTotal` sin modificar `detalles`. No es regresión de este change | Change aparte con whitelist explícita de campos actualizables |
| Baja | Revisar la regla de las 72 h para el cliente y el mensaje 403 que devuelve la API cuando ya no se puede modificar | Decisión de producto/UX sobre el texto y el plazo; no afecta a multi-actividades | Análisis de producto + ajuste de copy y, si aplica, de la regla |
| Baja | DRY del `resolverWorkshop` duplicado en el script de migración (S-01) | El script reimplementa el helper de `api/utils/pricing.js`; solo relevante si se vuelve a ejecutar | Refactor pequeño dentro del script |
| Baja | Nits documentales detectados por la verificación: contador `stats.escrituras` en dry-run (S-02), inconsistencia del edge case "Todas deseleccionadas" en la spec (S-05) y lookup de icono sin normalizar en admin (S-06) | No afectan al comportamiento ni al recuento; S-05 quedó copiado tal cual en la spec canonizada para no alterar el texto verificado | Corrección documental/refactor menor en un pase de limpieza |

## 11. Rollback

1. **Datos**: restaurar `events` desde cualquiera de los backups de `api/scripts/backups/` (copias en `C:\Users\Asus\Desktop\Neverland\backups-multi-actividades\`): `backup-2026-11-06T13-01-19.json` (antes de A), `13-01-44.json` (antes de B) y `13-02-27.json` (antes de C).
2. **Código**: revertir el despliegue de `main` al commit `7944695a` (merge previo a la cadena multi-actividades).
3. **Migración**: no existe script inverso fiable; es *lossy* para selecciones de más de una actividad. La vía autoritativa de rollback es el backup, no el script inverso.

## 12. Notas de trazabilidad y contradicciones registradas

- El `verify-report` se emitió sobre `main` = `e82f0be`; el HEAD final `894fecc` añade únicamente documentación. No hay contradicción de código: el árbol funcional es el mismo.
- Las observaciones de Engram `sdd/multi-actividades/spec` (#907) y `sdd/multi-actividades/tasks` (#912) son instantáneas previas y no describen el estado final (62 escenarios y previsión de líneas antigua). Se conservan como histórico; la fuente de verdad es el repositorio en `894fecc`.
- Las correcciones documentales W-01/W-02/W-07 y el `verify-report` están commiteadas en `894fecc`, por lo que la sincronización de specs se hizo sobre el texto verificado.
- La spec canonizada de `multi-activity-selection` conserva el edge case informativo "Todas deseleccionadas vía toggles individuales" con el texto "Precio muestra 0€" (S-05). Se copió tal cual para no alterar el texto que la verificación avaló; la inconsistencia con el escenario de REQ-04 (el bloque de precio desaparece) queda registrada como nit documental, sin efecto en requisitos ni escenarios.

## 13. Cierre del ciclo

- [x] Puerta de completitud de tareas: `tasks.md` con 10/10 tareas completas, sin checkboxes pendientes.
- [x] Sin hallazgos CRITICAL en `verify-report` (regla dura de archivo).
- [x] 4 delta specs sincronizadas a `openspec/specs/` con verificación `diff -r` vacía.
- [x] Change movido a `openspec/changes/archive/2026-11-08-multi-actividades/`.
- [x] Informe archivístico persistido en el sistema de archivos y en Engram (`sdd/multi-actividades/archive-report`).
- [x] Ciclo SDD completo: explore → propose → spec → design → tasks → apply → verify → archive.

No quedan fases SDD pendientes para este change.
