# HANDOFF — Revisión, Tests y Merge de feat/talleres

> **Fecha**: 2026-05-14
> **Fase**: Planificación (modelo pesado)
> **Rama**: `feat/talleres`
> **Repo**: `FeliOjedaRuiz/neverland-web`

---

## Contexto

La rama `feat/talleres` implementa un **sistema completo de talleres con inscripciones** para Neverland. Fue trabajada por otros agentes y contiene:

- **3 commits** en la rama + **24 archivos con cambios sin commitear** adicionales
- **31 archivos modificados/nuevos** vs `main` (solo commits)
- **~4200 líneas** nuevas/modificadas en total
- Documentación SDD completa en `changes/talleres/`

### Arquitectura de deploy
- **API**: Fly.io (deploy manual con `fly deploy` o `npm run ship`)
- **Web**: Vercel (deploy automático por rama/PR)
- La web en Vercel apunta a la API en producción vía `VITE_API_BASE_URL`
- **Implicación clave**: Para que el preview de Vercel funcione con talleres, la API DEBE estar deployada primero con los endpoints de talleres

---

## Inventario de Cambios

### Backend (API) — 8 archivos
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `api/models/taller.model.js` | **Nuevo** | Modelo Taller + subdocumento Inscripción |
| `api/controllers/talleres.controllers.js` | **Nuevo** | CRUD completo + inscripciones + upload + cancelación |
| `api/models/workshop.model.js` | **Eliminado** | Modelo antiguo no usado |
| `api/controllers/workshops.controllers.js` | **Eliminado** | Controlador antiguo no usado |
| `api/config/routes.config.js` | Modificado | 9 rutas nuevas para talleres |
| `api/config/cloudinary.config.js` | Modificado | Factory `createUploader()` para carpetas dinámicas |
| `api/config/mailer.config.js` | Modificado | `sendTallerConfirmationEmail()` nueva |
| `api/services/google.service.js` | Modificado | `createTallerCalendarEvent()` nueva |
| `api/controllers/events.controllers.js` | Modificado | `checkAvailability` incluye talleres |

### Frontend (Web) — 17 archivos
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `web/src/services/api.js` | Modificado | 8 funciones nuevas para talleres |
| `web/src/App.jsx` | Modificado | 8 rutas nuevas (4 públicas, 4 admin) |
| `web/src/pages/AdminDashboard.jsx` | Modificado | Sidebar con sección Talleres |
| `web/src/pages/HomePage.jsx` | Modificado | Integra `TalleresSection` |
| `web/src/pages/TalleresListPage.jsx` | **Nuevo** | Página pública de listado |
| `web/src/pages/CancelacionPage.jsx` | **Nuevo** | Confirmación de cancelación |
| `web/src/components/admin/TalleresList.jsx` | **Nuevo** | Listado admin |
| `web/src/components/admin/TallerForm.jsx` | **Nuevo** | Formulario crear/editar |
| `web/src/components/admin/TallerDetail.jsx` | **Nuevo** | Detalle admin con inscripciones |
| `web/src/components/admin/InscripcionesList.jsx` | **Nuevo** | Lista de inscritos |
| `web/src/components/home/TalleresSection.jsx` | **Nuevo** | Sección homepage |
| `web/src/components/talleres/TallerPublicCard.jsx` | **Nuevo** | Tarjeta pública |
| `web/src/components/talleres/TallerPublicDetail.jsx` | **Nuevo** | Detalle público + formulario |
| `web/src/components/talleres/InscripcionForm.jsx` | **Nuevo** | Formulario inscripción |
| `web/src/components/talleres/InscripcionResumen.jsx` | **Nuevo** | Resumen post-inscripción |

### Documentación
| Archivo | Descripción |
|---------|-------------|
| `changes/talleres/exploration.md` | Exploración SDD |
| `changes/talleres/proposal.md` | Propuesta SDD |
| `changes/talleres/spec.md` | Especificaciones |
| `changes/talleres/design.md` | Diseño técnico |
| `changes/talleres/tasks.md` | Desglose de tareas |
| `docs/handoffs/2026-05-09-talleres.md` | Handoff original |

---

## Plan de Ejecución (4 Fases)

### FASE 1 — Revisión y Documentación del Código

**Objetivo**: Auditoría completa del código nuevo para detectar bugs, inconsistencias con las specs, violaciones de patrones del proyecto, y riesgos antes de testear.

**Checklist de revisión**:

#### Backend
- [ ] **Modelo `taller.model.js`**: Verificar schema, índices, validaciones del subdocumento
- [ ] **Controlador `talleres.controllers.js`**: 
  - Validar que `inscribir` usa operación atómica (✅ usa `findOneAndUpdate` con `$expr`)
  - Verificar protección de inscripciones en `update` (✅ `delete updates.inscripciones`)
  - Confirmar manejo de errores correcto en todos los endpoints
  - Verificar que `cancelarInscripcion` valida el email correctamente
  - Comprobar que `list` filtra talleres pasados correctamente con `getSafeNow()`
- [ ] **Rutas**: Verificar que rutas protegidas usan `secure.isAdmin` correctamente
- [ ] **`checkAvailability`**: Confirmar que talleres bloquean turnos sin duplicados
- [ ] **Cloudinary**: Verificar `createUploader` mantiene retrocompatibilidad
- [ ] **Mailer**: Verificar `sendTallerConfirmationEmail` tiene guard de tests

#### Frontend
- [ ] **Rutas App.jsx**: Verificar orden (rutas específicas antes de parametrizadas)
- [ ] **API service**: Confirmar todas las funciones matchean rutas del backend
- [ ] **Componentes admin**: Verificar uso de `safeParseDate` en vez de `new Date(string)`
- [ ] **Formulario inscripción**: Validaciones frontend coherentes con backend
- [ ] **CSS/Tailwind**: Verificar uso de `dvh` en vez de `vh`, `text-base` en inputs

#### Observaciones encontradas durante el análisis:

**⚠️ Inconsistencias detectadas (pendientes de verificar en archivos sin commitear)**:

1. **`api.js` (web)**: Hay `getPublicTalleres` que apunta a `/talleres/public` pero NO existe esa ruta en el backend. La ruta del backend es `GET /talleres` con filtro por query param. Posible 404 en producción.

2. **`api.js` (web)**: Hay `editarInscripcion` y `deleteTallerImage` que no tienen rutas correspondientes en `routes.config.js`. `editarInscripcion` existe como función en el controlador pero no está ruteada. `deleteTallerImage` apunta a `/talleres/upload/delete` que no existe.

3. **`cancelarInscripcion` en el controlador**: Usa `res.redirect(301)` — un redirect permanente. Para una acción que podría repetirse, un 302 (temporal) sería más apropiado. Los browsers cachean los 301.

4. **`talleres/cancelacion` ruta en App.jsx**: Potencial conflicto de rutas con `/talleres/:id` si React Router no prioriza correctamente. `cancelacion` podría matchear como `:id`.

5. **Modelo `taller.model.js`**: No hay índice único para evitar talleres duplicados en misma fecha+turno. La validación es solo en el controlador (susceptible a race conditions).

---

### FASE 2 — Tests de Integración

**Objetivo**: Crear `api/tests/talleres.test.js` siguiendo el patrón existente de `events.test.js`.

**Framework**: Jest + Supertest + MongoMemoryServer (ya configurado en `tests/setup.js`)

**Test suite propuesto**:

```
describe('Talleres API')
│
├── CRUD Admin
│   ├── Crear taller con datos válidos → 201
│   ├── Rechazar taller sin nombre → 400
│   ├── Rechazar taller sin fecha → 400
│   ├── Rechazar taller sin turnos → 400
│   ├── Rechazar taller sin horario → 400
│   ├── Rechazar taller duplicado (misma fecha+turno) → 409
│   ├── Listar talleres → 200 (array)
│   ├── Obtener detalle de taller existente → 200
│   ├── Obtener detalle de taller inexistente → 404
│   ├── Actualizar taller existente → 200
│   ├── Actualizar NO debe sobreescribir inscripciones
│   ├── Eliminar taller → 204
│   └── Eliminar taller inexistente → 404
│
├── Inscripciones
│   ├── Inscribir con datos válidos → 201
│   ├── Rechazar sin nombreNiño → 400
│   ├── Rechazar sin email → 400
│   ├── Rechazar email inválido → 400
│   ├── Rechazar teléfono con menos de 9 dígitos → 400
│   ├── Rechazar nombre > 100 caracteres → 400
│   ├── Rechazar sin privacyPolicyConsent → 400
│   ├── Rechazar cuando aforo completo → 409
│   ├── Inscripción atómica: solo 1 éxito cuando quedan 0 plazas → 409
│   └── No devolver datos de inscripciones en detalle público
│
├── Bloqueo de turnos
│   ├── Taller bloquea turnos en checkAvailability
│   └── Crear taller elimina bloqueos existentes
│
└── Autorización
    ├── POST /talleres sin auth → 401/403
    ├── DELETE /talleres/:id sin auth → 401/403
    └── POST inscripción sin auth → permitido (ruta pública)
```

**Mocks necesarios**:
```javascript
jest.mock('../services/google.service', () => ({
  createCalendarEvent: jest.fn().mockResolvedValue({ id: 'mock-google-id' }),
  deleteCalendarEvent: jest.fn().mockResolvedValue(true),
  listEvents: jest.fn().mockResolvedValue([]),
  createTallerCalendarEvent: jest.fn().mockResolvedValue({ id: 'mock-taller-event-id' })
}));
```

**Mock de mailer** (ya tiene guard `NODE_ENV === 'test'` pero por seguridad):
```javascript
jest.mock('../config/mailer.config', () => ({
  sendBookingConfirmationEmail: jest.fn().mockResolvedValue({ messageId: 'mock' }),
  sendTallerConfirmationEmail: jest.fn().mockResolvedValue({ messageId: 'mock' })
}));
```

---

### FASE 3 — Merge de API a `main` (Deploy a Fly.io)

**Objetivo**: Deployar solo los cambios de API para que el preview de Vercel funcione.

**Estrategia**: Cherry-pick o commit selectivo de los archivos `api/` únicamente.

**Pasos**:
1. Commitear todos los cambios pendientes en `feat/talleres`
2. Crear rama `feat/talleres-api` desde `main`
3. Cherry-pick o copiar solo archivos `api/`:
   - `api/models/taller.model.js`
   - `api/controllers/talleres.controllers.js`
   - `api/config/routes.config.js`
   - `api/config/cloudinary.config.js`
   - `api/config/mailer.config.js`
   - `api/services/google.service.js`
   - `api/controllers/events.controllers.js`
   - `api/tests/talleres.test.js` (nuevo)
   - Eliminar: `api/controllers/workshops.controllers.js`, `api/models/workshop.model.js`
4. PR `feat/talleres-api` → `main`
5. Merge y deploy a Fly.io
6. Verificar que endpoints funcionan en producción

**⚠️ Riesgo**: La eliminación de `workshops.controllers.js` y `workshop.model.js` podría romper algo si hay código en `main` que las usa. Hay que verificar que las rutas de workshops NO se eliminan en esta fase si el frontend actual las necesita.

---

### FASE 4 — Merge de Web tras Aprobación

**Objetivo**: Una vez que el cliente apruebe desde el preview de Vercel, mergear el frontend.

**Pasos**:
1. El PR de `feat/talleres` (completo) debería ya tener la API mergeada
2. Rebase de `feat/talleres` sobre `main` actualizado
3. PR `feat/talleres` → `main` (solo debería quedar el diff de `web/`)
4. El preview de Vercel se genera automáticamente con el PR
5. El cliente prueba en el preview (que ya apunta a la API actualizada en Fly.io)
6. Tras aprobación → merge

---

## Dependencias entre fases

```
FASE 1 (Revisión) ──→ FASE 2 (Tests) ──→ FASE 3 (API Merge)
                                                    │
                                              [Deploy Fly.io]
                                                    │
                                              [Preview Vercel]
                                                    │
                                            [Aprobación cliente]
                                                    │
                                              FASE 4 (Web Merge)
```

---

## Bugs/Fixes a resolver antes del merge

| # | Severidad | Descripción | Archivo |
|---|-----------|-------------|---------|
| 1 | 🔴 ALTA | `getPublicTalleres` apunta a ruta inexistente `/talleres/public` | `web/src/services/api.js` |
| 2 | 🟡 MEDIA | `editarInscripcion` no tiene ruta en backend | `api/config/routes.config.js` |
| 3 | 🟡 MEDIA | `deleteTallerImage` no tiene ruta en backend | `api/config/routes.config.js` |
| 4 | 🟡 MEDIA | `res.redirect(301)` debería ser `302` en cancelación | `api/controllers/talleres.controllers.js` |
| 5 | 🟢 BAJA | Posible conflicto de rutas `/talleres/cancelacion` vs `/talleres/:id` | `web/src/App.jsx` |
| 6 | 🟢 BAJA | Sin índice único fecha+turno en modelo (race condition teórica) | `api/models/taller.model.js` |

---

## Notas para el implementador

- **Test runner**: `cd api && npm test` (Jest con `--setupFilesAfterEnv=./tests/setup.js`)
- **Patrón de tests**: Seguir exactamente `events.test.js` — Supertest + MongoMemoryServer
- **Mocks**: Google Service y Mailer deben mockearse
- **`safeParseDate`**: SIEMPRE. NUNCA `new Date(string)` directo
- **VERIFICAR** los cambios sin commitear — hay refactors significativos encima de los commits originales
