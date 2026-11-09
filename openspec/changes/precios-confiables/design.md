# Diseño: Precios confiables

## Approach

El límite de escritura vive en `events.controllers.js`: `create` y `update` proyectan explícitamente el payload a campos permitidos según rol, en lugar de pasar el body o `detalles` completos a Mongoose. Los snapshots (`precioApplied`, `precioUnitario`, `precioTallerApplied`, `precioPersonajeApplied`, `precioPinataApplied`, `costoExtension`, `precioTotal`) se excluyen antes de construir el documento; `calculateEventPrice` recibe únicamente selecciones y snapshots confiables. La respuesta conserva snapshots para display. No se rechazan discrepancias con el preview del navegador, que puede usar configuración cacheada.

## Components

| Componente | Diseño / contrato | Requisitos |
|---|---|---|
| `api/controllers/events.controllers.js#create` | Antes de validar/calcular, derivar `isAdmin` solo de identidad establecida por JWT válido y usuario cargado. POST es público: sin token, token inválido o usuario no-admin → cliente; se ignoran en silencio campos restringidos, se fuerza `estado: 'pendiente'`, y `tipo: 'bloqueo'` da 400. Admin puede fijar campos admin/estado y crear bloqueos. Proyectar campos, excluyendo todo precio cliente, construir documento limpio, validar menú solo para reservas y calcular catálogo/snapshots/total antes de guardar. | `server-price-authority/REQ-01..03`; `role-based-event-fields/REQ-01..05`; `menu-id-validation/REQ-01..04` |
| `api/controllers/events.controllers.js#update` | PATCH conserva autenticación opcional existente: tomar rol solo del usuario cuyo JWT fue validado y cuya identidad se cargó; sin token/inválido → no-admin. Construir patch allowlisted; ignorar escrituras restringidas no-admin y todos los precios entrantes. Fusionar selecciones sobre documento actual, preservar snapshots de servidor y comparar selección previa/nueva. Si cambia, borrar solo snapshot dependiente; si no, gana siempre snapshot almacenado. Invalidar `adultos.comida[].precioUnitario` al cambiar lista de comida; invalidar extensión si cambia duración. Recalcular `precioTotal` también para PATCH aislado/inocuo. No validar `menuId` en PATCH ni repreciar selecciones intactas. | `server-price-authority/REQ-01,04..08`; `role-based-event-fields/REQ-01..04` |
| `api/config/routes.config.js` | Mantener POST público y middleware JWT opcional del PATCH; confirmar que identidad se propaga solo tras `checkUserForAuth`. No elevar PATCH a admin-only. | `role-based-event-fields/REQ-01..05` |
| `api/models/event.model.js` | Añadir `min: 0` a `horario.costoExtension`; no limitar negativos de `costoExtra` (descuento legítimo de admin). | `server-price-authority/REQ-01..03`; `role-based-event-fields/REQ-01` |
| `api/tests/budget-flow.test.js` y pruebas API | Verificar persistencia (no solo respuesta), snapshots intactos, cambios/no cambios, menú, rol y comida adulta. TDD rojo primero; sin lanzar tests en esta fase. | `server-price-authority/REQ-01..08`; `role-based-event-fields/REQ-01..05`; `menu-id-validation/REQ-01..04` |

## Data Flow

**CREATE**: `POST /events → identidad opcional validada → isAdmin → proyección allowlist por rol → (reserva: validar menuId exacto contra Config.menusNiños) → validar selección → calcular precios desde Config y precioTotal → guardar documento limpio → responder con snapshots`. `menuId` ausente/desconocido en reserva: 400 descriptivo y sin documento. El flujo `bloqueo` omite validación de menú, acepta el `menuId: 1` heredado de los modales admin y conserva total 0.

**PATCH**: `PATCH /events/:id → JWT opcional/usuario validado → cargar documento y copia previa → proyectar patch → fusionar selección con documento (nunca spread de snapshot cliente sobre snapshot servidor) → comparar selecciones → invalidar snapshots afectados, incluida comida adulta → calcular total desde los snapshots preservados o recalculados → guardar → responder`. Este orden resuelve el merge actual `old, new`: snapshot servidor es la base autorizada; solo una selección modificada elimina el snapshot asociado.

## Interfaces / Contracts

- `isAdmin(req)`: verdadero solo con usuario autenticado/cargado y rol admin; todo caso ausente o fallido resulta falso. `create` público no confía en `req.body`; PATCH no convierte fallo de autenticación opcional en autorización.
- Proyección de escritura por rol: selecciones, contacto y consentimiento permitidos; nunca acepta snapshots ni `precioTotal`. Campos `costoExtra`, `estado`, `tipo`, IDs, `googleEventId` y `notasAdmin` se incluyen solo según permisos especificados.
- Calculador: entrada normalizada con selecciones y precios almacenados confiables; salida `precioTotal` y snapshots server-owned. No introducir dependencia/API nueva.

## Risks

| Riesgo | Mitigación |
|---|---|
| Snapshot falso queda en documento aunque cálculo lo ignore | Excluir del objeto antes de `Event`/`event.set`; comprobar documento persistido y respuesta (entrada filtrada, salida conserva snapshots). |
| PATCH sobrescribe snapshot legítimo por orden de merge | Snapshot almacenado prevalece; invalidación selectiva solo al cambiar selección. Pruebas de selección igual y distinta. |
| Admin mal identificado en endpoint público/opcional | Solo identidad creada por JWT validado y usuario cargado; sin token/inválido/no-admin se aplica política cliente. |
| Comida adulta cambia pero precio unitario no | Comparar la selección completa de comida y eliminar/recalcular sus precios unitarios al cambiarla. |
| Bloqueo falla por `menuId` heredado o menú inválido cobra 0 | Validar menú exclusivamente en reserva; prueba de bloqueo admin y de menú ausente/inválido. |
| Revertir código afecta importes | No hay migración destructiva: revertir deploy restaura lógica previa pero no reescribe documentos. Reservas creadas con código nuevo tienen snapshots server-side válidos; reservas existentes, incluidas las 12 con actividades retiradas y las cinco con línea a 0 €, se conservan como histórico. Auditoría dry-run con `api/scripts/analyze-stale-snapshots.js` (hoy cubre el precio del menú y el de las actividades: extenderlo al precio unitario de la comida de adultos); reparación selectiva solo con decisión de la admin, nunca reparación masiva automática. Si 400 de menú da falsos positivos por drift, rollback acotado de esa validación sin revertir whitelist/precios. |
| PATCH con `menuId` inválido deja el precio del menú a 0 € | El PATCH no valida el menú a propósito: la mayoría de las reservas legacy guardan un `menuId` que ya no resuelve en el catálogo actual, y validarlo siempre les impediría editarse. Un cliente podría cambiar el `menuId` por uno inexistente y dejar el precio del menú a 0 €. Mitigación: validar el `menuId` en PATCH SOLO cuando cambia, sin repreciar selecciones intactas. |
| Preview PWA cacheada difiere del importe final | Respuesta devuelve precio definitivo; decisión pendiente entre log/métrica y aviso visible; nunca 400 por discrepancia. |

## Threat Matrix

N/A — el cambio no modifica routing, comandos de shell, subprocessos, VCS/PR, clasificación ejecutable ni integración de procesos. Se conserva la ruta HTTP existente; la autorización se limita a identidad opcional y proyección de campos.

## Testing Strategy

| Capa | Cobertura prevista | Enfoque |
|---|---|---|
| API integración | CREATE/PATCH con precios falsos; snapshot servidor sin cambio; recálculo con cambio; `precioTotal` aislado; comida adulta; histórico; menú válido/inválido/ausente y bloqueo | Jest + Supertest + MongoDB de pruebas; afirmar respuesta y documento persistido. |
| API integración por rol | Sin token, JWT inválido, no-admin y admin; `costoExtra`, campos admin, estado y bloqueo | Comprobar silenciamiento, 400 para bloqueo no-admin y capacidades admin. |
| Frontend | Displays mantienen snapshots del servidor | Suite existente; sin cambio de contrato de lectura. |

## Migration / Rollout

No se requiere migración ni cambio destructivo de esquema. Desplegar código; monitorear divergencias preview/respuesta sin bloquear. Rollback: revertir deploy, no editar precios históricos. La validación de menú puede revertirse de forma acotada ante falsos positivos. Auditoría dry-run y cualquier reparación de las cinco reservas a 0 € quedan sujetas a aprobación explícita de la admin.

## Preguntas abiertas

1. Si preview y cargo difieren por configuración cacheada: ¿solo log/métrica o aviso visible en confirmación?
2. ¿Se aprueban reparaciones puntuales de las cinco reservas antiguas cuya línea de actividad quedó a 0 €? Decisión de datos de la admin; fuera de implementación.
