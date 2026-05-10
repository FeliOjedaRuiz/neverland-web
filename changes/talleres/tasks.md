# Tareas de Implementación — Talleres

## Fase 1: Backend — Modelo y Controladores

### 1.0 Eliminar modelo y controlador Workshop antiguos
- **Archivos**: `api/models/workshop.model.js`, `api/controllers/workshops.controllers.js`
- **Descripción**: Eliminar el esqueleto antiguo de Workshop que no se usa. También eliminar las rutas asociadas en `routes.config.js`.
- **Dependencias**: Ninguna
- **Prioridad**: 🔴 ALTA

### 1.1 Crear modelo `taller.model.js`
- **Archivo**: `api/models/taller.model.js`
- **Descripción**: Crear esquema de Taller con subdocumento Inscripción, timestamps, toJSON transform.
- **Dependencias**: Ninguna
- **Prioridad**: 🔴 ALTA

### 1.2 Crear controlador `talleres.controllers.js`
- **Archivo**: `api/controllers/talleres.controllers.js`
- **Descripción**: Implementar CRUD completo + inscripciones + upload imágenes.
- **Funciones**:
  - `list` — listar talleres con filtros (publico, fecha futura, orden por fecha)
  - `detail` — detalle de taller (admin ve inscripciones, público no)
  - `create` — crear taller con validación, bloqueo de turnos, Google Calendar, eliminar bloqueos existentes
  - `update` — actualizar taller, resincronizar Google Calendar
  - `delete` — eliminar taller, eliminar evento Google Calendar
  - `inscribir` — inscribir niño con validación atómica de aforo, email confirmación
  - `eliminarInscripcion` — admin elimina inscripción
  - `upload` — subir imagen a Cloudinary (portada o galería)
- **Dependencias**: 1.1
- **Prioridad**: 🔴 ALTA

### 1.3 Configurar rutas de talleres
- **Archivo**: `api/config/routes.config.js`
- **Descripción**: Añadir rutas REST para talleres (GET, POST, PATCH, DELETE) + rutas de inscripciones + upload.
- **Dependencias**: 1.2
- **Prioridad**: 🔴 ALTA

### 1.4 Configurar Cloudinary para carpeta de talleres
- **Archivo**: `api/config/cloudinary.config.js`
- **Descripción**: Añadir carpeta 'talleres' en la configuración de subida (o usar la misma config con folder param).
- **Dependencias**: Ninguna
- **Prioridad**: 🟡 MEDIA

### 1.5 Crear plantilla de email para talleres
- **Archivo**: `api/config/mailer.config.js`
- **Descripción**: Añadir función `sendTallerConfirmationEmail()` con plantilla HTML específica para talleres.
- **Dependencias**: 1.2
- **Prioridad**: 🟡 MEDIA

### 1.6 Modificar `checkAvailability` para incluir talleres
- **Archivo**: `api/controllers/events.controllers.js`
- **Descripción**: En la función `checkAvailability`, añadir consulta a la colección Taller para que los turnos ocupados por talleres también aparezcan como no disponibles.
- **Dependencias**: 1.1
- **Prioridad**: 🔴 ALTA

## Fase 2: Frontend — API Service y Rutas

### 2.1 Añadir endpoints de talleres al servicio API
- **Archivo**: `web/src/services/api.js`
- **Descripción**: Añadir funciones: `getTalleres`, `getTallerById`, `createTaller`, `updateTaller`, `deleteTaller`, `inscribirATaller`, `eliminarInscripcion`, `uploadTallerImage`.
- **Dependencias**: 1.3
- **Prioridad**: 🔴 ALTA

### 2.2 Añadir rutas de talleres al router
- **Archivo**: `web/src/App.jsx`
- **Descripción**: Añadir rutas públicas (`/talleres`, `/talleres/:id`) y rutas admin anidadas (`/admin/talleres`, `/admin/talleres/nuevo`, `/admin/talleres/:id`).
- **Dependencias**: 2.1
- **Prioridad**: 🔴 ALTA

### 2.3 Renombrar sidebar y añadir "Talleres"
- **Archivo**: `web/src/pages/AdminDashboard.jsx`
- **Descripción**: Renombrar "Bandeja de Entrada" → "Cumpleaños". Añadir `{ id: 'talleres', label: 'Talleres', icon: Palette }` al array `sidebarItems`. Nuevo orden: Cumpleaños, Talleres, Calendario, Configuración. Actualizar lógica de header para detectar ruta 'talleres'.
- **Dependencias**: 2.2
- **Prioridad**: 🟡 MEDIA

## Fase 3: Frontend — Componentes Admin

### 3.1 Crear `TalleresList.jsx` (listado admin)
- **Archivo**: `web/src/components/admin/TalleresList.jsx`
- **Descripción**: Vista de lista/grilla de talleres. Cada tarjeta muestra: nombre, fecha, turnos, aforo (X/Y), toggle publico. Botón "Nuevo Taller" en header.
- **Dependencias**: 2.1, 2.2
- **Prioridad**: 🔴 ALTA

### 3.2 Crear `TallerForm.jsx` (crear/editar admin)
- **Archivo**: `web/src/components/admin/TallerForm.jsx`
- **Descripción**: Formulario completo con campos: nombre, descripción, precio, aforo, fecha (datepicker), turnos (checkboxes T1/T2/T3), horario inicio/fin, portada (upload), galería (upload múltiple). Vista de turnos con indicador de bloqueos existentes.
- **Dependencias**: 2.1, 3.1
- **Prioridad**: 🔴 ALTA

### 3.3 Crear `TallerDetail.jsx` (detalle admin con inscripciones)
- **Archivo**: `web/src/components/admin/TallerDetail.jsx`
- **Descripción**: Vista detallada del taller con sección de inscripciones (lista expansible). Cada inscripción muestra nombre del niño, responsable, email, teléfono. Botón para eliminar inscripción.
- **Dependencias**: 2.1, 3.1
- **Prioridad**: 🟡 MEDIA

### 3.4 Crear `InscripcionesList.jsx` (lista de niños)
- **Archivo**: `web/src/components/admin/InscripcionesList.jsx`
- **Descripción**: Componente reutilizable para mostrar lista de inscritos con capacidad de eliminar.
- **Dependencias**: 2.1
- **Prioridad**: 🟡 MEDIA

## Fase 4: Frontend — Componentes Públicos

### 4.1 Crear `TalleresSection.jsx` (sección en homepage)
- **Archivo**: `web/src/components/home/TalleresSection.jsx`
- **Descripción**: Sección en la homepage que muestra los próximos talleres públicos (máx 3-6). Cards horizontales con: portada, nombre, fecha, horario, precio, indicador de plazas. Link "Ver todos los talleres".
- **Dependencias**: 2.1
- **Prioridad**: 🟡 MEDIA

### 4.2 Integrar `TalleresSection` en HomePage
- **Archivo**: `web/src/pages/HomePage.jsx`
- **Descripción**: Añadir `<TalleresSection />` en la secuencia de secciones de la homepage.
- **Dependencias**: 4.1
- **Prioridad**: 🟢 BAJA

### 4.3 Crear `TallerPublicCard.jsx` (tarjeta de taller)
- **Archivo**: `web/src/components/talleres/TallerPublicCard.jsx`
- **Descripción**: Componente de tarjeta para mostrar taller en listados públicos. Estilo consistente con el diseño Neverland (glassmorphism, hover effects).
- **Dependencias**: 2.1
- **Prioridad**: 🟡 MEDIA

### 4.4 Crear `TallerPublicDetail.jsx` (página de detalle público)
- **Archivo**: `web/src/components/talleres/TallerPublicDetail.jsx` o `web/src/pages/TallerDetailPage.jsx`
- **Descripción**: Página completa de detalle de taller con: galería (si existe), información, precio, indicador de aforo, formulario de inscripción o indicador "Aforo completo".
- **Dependencias**: 2.1, 4.3
- **Prioridad**: 🔴 ALTA

### 4.5 Crear `InscripcionForm.jsx` (formulario de inscripción)
- **Archivo**: `web/src/components/talleres/InscripcionForm.jsx`
- **Descripción**: Formulario con campos: nombre niño, edad, nombre responsable, teléfono, email, checkboxes de consentimiento (privacidad requerido, marketing opcional). Validación en frontend. Envío a API.
- **Dependencias**: 2.1
- **Prioridad**: 🔴 ALTA

### 4.6 Crear `InscripcionResumen.jsx` (resumen post-inscripción)
- **Archivo**: `web/src/components/talleres/InscripcionResumen.jsx`
- **Descripción**: Página de confirmación post-inscripción con: mensaje de éxito, resumen de datos, botón "Agendar en Google Calendar".
- **Dependencias**: 4.5
- **Prioridad**: 🟡 MEDIA

## Orden de implementación recomendado

```
1.0 → 1.1 → 1.2 → 1.3 → 1.6 → 1.4 → 1.5
               ↓
              2.1 → 2.2 → 2.3
                          ↓
              3.1 → 3.2 → 3.3 → 3.4
                          ↓
              4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6
```

## Notas para el implementador

- **safeParseDate()**: USAR SIEMPRE para parsear fechas. NUNCA `new Date(string)`.
- **dvh**: USAR `h-dvh`, `min-h-dvh` en vez de `h-screen`, `min-h-screen`.
- **text-base**: Todo input/textarea/select debe tener `text-base` o `min-text-[16px]`.
- **try/catch**: Obligatorio en todo evento que manipule datos o llame a `scrollTo`.
- **Email de cancelación**: El email de confirmación DEBE incluir un botón discreto para que el cliente pueda cancelar su inscripción.
- **JavaScript puro**: PROHIBIDO TypeScript.
- **Idioma**: Variables, comentarios y documentación en español.
- **Estilo UI**: Replicar patrones existentes (glassmorphism, animaciones framer-motion, colores neverland-green/energy-orange, tipografía font-display).
