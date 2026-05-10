# Exploración — Talleres

## Resumen del codebase

### Backend (api/)

| Archivo | Rol actual | Impacto en Talleres |
|---------|-----------|-------------------|
| `models/event.model.js` | Reservas de cumpleaños + bloqueos. Índice único `(fecha, turno)` previene double-booking. Estados: pendiente, confirmado, modificada, cancelada. Campos: tipo, estado, fecha, turno, cliente, detalles, horario, precioTotal, googleEventId | **Modelo de referencia.** La lógica de turnos, fechas y double-booking se replica para talleres. |
| `models/workshop.model.js` | Esqueleto simple: nombre, duracionMinutos, descripcion, capacidadMaxima, precio, imageUrl. SIN turnos, SIN estados, SIN inscripciones, SIN fechas. | **Se descarta.** Se crea `taller.model.js` nuevo desde cero. |
| `models/config.model.js` | Configuración global. Campo `workshops[]` son ACTIVIDADES EXTRAS de cumpleaños (pintacaras, slime, magia) — NO son talleres. | **Sin cambios.** Los "workshops" del config se mantienen como "actividades". |
| `models/user.model.js` | Admin users con roles. | Sin cambios. |
| `controllers/events.controllers.js` | Lógica completa de reservas: create (con validación, precio, Google Calendar, email, push), list (con filtros, paginación), detail, update (con permiso y 72h window), delete, checkAvailability (con Google Calendar sync). SHIFTS definidos como constantes. | **Referencia para replicar patrones** en talleres (validación, email, Google Calendar, availability). |
| `controllers/workshops.controllers.js` | CRUD simple (list, create, update, delete). | **Se reescribe** para el nuevo modelo `taller.model.js`. |
| `controllers/config.controllers.js` | Get/update del config singleton. Upload de imágenes. | Sin cambios. |
| `config/routes.config.js` | Rutas existentes: `/api/v1/workshops` (CRUD con secure.isAdmin). | **Se añaden rutas nuevas** para talleres: CRUD + inscripciones + disponibilidad. |
| `config/cloudinary.config.js` | Configuración de multer + Cloudinary. | **Se reutiliza** para subida de fotos de talleres. |
| `config/mailer.config.js` | Envío de emails (confirmación de reserva). | **Se reutiliza** con nueva plantilla para confirmación de inscripción a taller. |
| `services/google.service.js` | Google Calendar API (crear, actualizar, borrar eventos). | **Se reutiliza** para crear/eliminar eventos de taller. |
| `services/push.service.js` | Notificaciones push al admin. | **Se reutiliza** para notificar nuevas inscripciones. |
| `utils/date.js` | `safeParseDate`, `getSafeNow`, `createSafeDate`. | **Se reutiliza** para todo manejo de fechas. |
| `middlewares/secure.mid.js` | Autenticación JWT + roles. | Sin cambios. |

### Frontend (web/)

| Archivo | Rol actual | Impacto en Talleres |
|---------|-----------|-------------------|
| `src/App.jsx` | Router principal. Admin routes bajo `/admin` con `RequireAuth`. | **Añadir rutas**: `/talleres`, `/talleres/:id`, `/admin/talleres`, `/admin/talleres/nuevo`, `/admin/talleres/:id`. |
| `src/pages/AdminDashboard.jsx` | Sidebar con 3 items: reservas, calendario, config. Usa `Outlet` + `config` context. | **Añadir item "Talleres"** al sidebar + ruta anidada. |
| `src/pages/HomePage.jsx` | Secciones: Hero, Services, Menus, Facilities, WorkshopsSection, Workflow, FAQ. | **Añadir sección de talleres públicos** (o modificar la existente). La actual `WorkshopsSection` es para "actividades extras". |
| `src/services/api.js` | Cliente HTTP con interceptores JWT. Ya tiene `getWorkshops`, `createWorkshop`, etc. | **Añadir endpoints de talleres**: `getTalleres`, `getTallerById`, `createTaller`, `updateTaller`, `deleteTaller`, `inscribirNino`, `getInscripciones`. |
| `src/components/admin/` | Componentes de admin: CalendarView, ReservationInbox, ConfigurationPanel, etc. | **Crear nuevos**: `TalleresList`, `TallerForm`, `TallerDetail`, `InscripcionesList`. |
| `src/components/home/WorkshopsSection.jsx` | Muestra actividades extras (pintacaras, slime, magia) como tarjetas. | **NO modificar.** Es para "actividades". Crear `TalleresSection.jsx` nueva. |
| `src/components/common/` | Componentes compartidos: SEO, WhatsAppButton, PwaUpdater, InstallPwaPrompt. | Sin cambios. |
| `src/components/layout/` | Navbar, Footer. | Sin cambios significativos. |

### Patrones de UI a replicar

- **Glassmorphism + Tailwind**: fondos translúcidos (`bg-calendar-bg`, `backdrop-blur-xl`), bordes redondeados (`rounded-3xl`), sombras suaves (`shadow-soft`).
- **Mobile-first**: `dvh` en vez de `vh`, inputs con `text-base`.
- **Modales**: `AnimatePresence` + `motion.div` con scale + fade.
- **Acordeones**: `AccordionSection` en ConfigurationPanel.
- **Toggle Switch**: Componente reutilizable en ConfigurationPanel.
- **Cards con hover**: Escalado + cambio de borde + sombra.
- **Estados visuales**: "Oculto" (gris, opacidad baja), "Activo" (color neverland-green).

### Integraciones existentes

1. **Google Calendar**: Bidireccional. Crea/modifica/borra eventos. El availability checker consulta tanto BD local como Google.
2. **Email**: Nodemailer con plantillas HTML. Confirmación de reserva.
3. **Cloudinary**: Subida de imágenes via multer + multer-storage-cloudinary.
4. **Push Notifications**: Web-push para notificar al admin de nuevas reservas.

### Punto de integración crítico: Disponibilidad

El `checkAvailability` actual en `events.controllers.js` consulta:
1. Eventos en MongoDB (filtrados por fecha, excluyendo cancelados)
2. Eventos en Google Calendar (filtrados por source y keywords)

Los talleres deben:
- Bloquear los turnos seleccionados en el calendario
- Ser visibles como "ocupados" en el checkAvailability (para que no se reserven cumpleaños en esos turnos)
- Si el admin selecciona un turno que ya tiene un "bloqueo", reemplazarlo
