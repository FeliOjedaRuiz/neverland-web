# Especificación — Talleres

## Requisitos funcionales

### REQ-01 — Modelo de datos Taller
El sistema DEBE tener un modelo `Taller` en MongoDB con los siguientes campos:
- `nombre` (String, requerido)
- `descripcion` (String, opcional)
- `precio` (Number, requerido, en euros)
- `aforo` (Number, requerido, default: 15)
- `publico` (Boolean, default: false)
- `fecha` (Date, requerido)
- `turnos` (Array de String, requerido — uno o más de: T1, T2, T3)
- `horario` ({ inicio: String, fin: String } — ej. "17:00", "18:30")
- `portada` (String, URL de Cloudinary)
- `galeria` (Array de String, URLs de Cloudinary, opcional)
- `inscripciones` (Array de objetos Inscripcion)
- `googleEventId` (String, opcional)
- `timestamps` (createdAt, updatedAt)

Cada `Inscripcion` DEBE contener:
- `nombreNiño` (String, requerido, max 100)
- `edadNiño` (Number, opcional, max 99)
- `nombreResponsable` (String, requerido, max 100)
- `telefonoResponsable` (String, requerido)
- `emailResponsable` (String, requerido, validado como email)
- `privacyPolicyConsent` (Boolean, requerido, debe ser true)
- `marketingConsent` (Boolean, default: false)
- `fechaConsentimiento` (Date, default: Date.now)

### REQ-02 — CRUD de Talleres (Admin)
El admin DEBE poder:
- **Listar** todos los talleres (incluyendo no públicos y pasados)
- **Crear** un nuevo taller con todos los campos requeridos
- **Editar** cualquier campo de un taller existente
- **Eliminar** un taller (y sus inscripciones asociadas)
- **Subir** imagen de portada y galería a Cloudinary

### REQ-03 — Publicación y visibilidad
- Un taller solo es visible en la web pública cuando `publico === true`
- Los talleres cuya `fecha + horario.fin` ya haya pasado (hora española) NO deben aparecer en listados públicos
- Un taller con aforo completo DEBE seguir siendo visible pero con indicador de "Aforo completo"
- Cuando `aforo - inscripciones.length <= 5` y > 0, DEBE mostrar "Últimos X lugares"

### REQ-04 — Inscripción de niños (Clientes)
El cliente DEBE poder:
- Ver el formulario de inscripción en la página de detalle del taller
- Completar: nombre del niño, edad, nombre del responsable, teléfono, email
- Aceptar la política de privacidad (obligatorio)
- Aceptar/denegar marketing (opcional)
- Recibir validación de campos en frontend Y backend
- Ver un resumen tras la inscripción exitosa con opción de agendar en Google Calendar

El sistema DEBE:
- Validar que `inscripciones.length < aforo` antes de aceptar
- Validar email y teléfono (mínimo 9 dígitos)
- Enviar email de confirmación al responsable con botón discreto para cancelar la inscripción
- Crear/actualizar evento en Google Calendar (sin cambios en el evento del taller, solo跟进)

### REQ-05 — Bloqueo de turnos
- Al crear un taller, los turnos seleccionados DEBEN bloquearse para reservas de cumpleaños
- Si el admin selecciona un turno que tiene un "bloqueo" existente (tipo: 'bloqueo'), el sistema DEBE eliminar ese bloqueo y reemplazarlo por el taller
- El `checkAvailability` DEBE reflejar los turnos ocupados por talleres

### REQ-06 — Google Calendar
- Al crear un taller, DEBE crearse un evento en Google Calendar con el horario del taller
- Si el taller ocupa turnos que tenían bloqueos, los bloqueos DEBEN eliminarse de Google Calendar
- Al eliminar un taller, DEBE eliminarse su evento de Google Calendar
- El evento DEBE usar el mismo formato/metadatos que los eventos de cumpleaños (source: 'neverland')

### REQ-07 — Email de confirmación
- Al inscribirse, el responsable DEBE recibir un email con:
  - Nombre del taller
  - Fecha y horario
  - Nombre del niño inscrito
  - Precio
  - Instrucciones o información adicional

### REQ-08 — Gestión de inscripciones (Admin)
- El admin DEBE poder ver la lista de niños inscritos en cada taller
- El admin DEBE poder eliminar una inscripción individual
- Al eliminar una inscripción, el aforo se libera automáticamente

### REQ-09 — Interfaz de administración
El dashboard de admin DEBE incluir:
- Renombrar "Bandeja de Entrada" → "Cumpleaños" en el sidebar
- Nuevo orden del sidebar: Cumpleaños, Talleres, Calendario, Configuración
- Página de listado de talleres con: nombre, fecha, turnos, estado de aforo, toggle de visibilidad
- Botón "Nuevo Taller" que lleve al formulario de creación
- Página/formulario de creación/edición con todos los campos
- Página de detalle de taller con:
  - Información completa del taller
  - Sección de inscripciones (lista de niños, expansible)
  - Cada inscripción clicable para ver detalles, editar y eliminar

### REQ-10 — Interfaz pública
La web pública DEBE incluir:
- Sección/listado de talleres en la homepage (solo públicos, no pasados, ordenados por fecha más próxima)
- Página de detalle de taller con:
  - Información completa (nombre, descripción, fecha, horario, precio, fotos)
  - Indicador de aforo
  - Formulario de inscripción (si hay plazas) o indicador de "Aforo completo"
  - Galería de imágenes (si existe)
- Página de resumen post-inscripción con botón "Agendar en Google Calendar"

## Escenarios de aceptación

### Escenario 1: Admin crea un taller y lo publica
1. Admin navega a Dashboard > Talleres > Nuevo Taller
2. Completa: nombre "Taller de Slime", precio 10€, aforo 15, fecha, turno T1, horario 17:30-19:00, sube portada
3. Guarda. El taller se crea con `publico: false`
4. Admin activa el toggle de visibilidad → `publico: true`
5. El taller aparece en la home pública

### Escenario 2: Cliente inscribe a un niño
1. Cliente ve el taller en la home, hace clic
2. Ve detalles: nombre, fecha, horario, precio, "Últimos 15 lugares"
3. Completa el formulario con datos del niño y responsable
4. Marca consentimiento de privacidad
5. Envía → recibe confirmación visual + email
6. El contador de aforo baja a 14

### Escenario 3: Taller llega al aforo máximo
1. Taller con aforo 15 y 14 inscritos
2. Se muestra "Último lugar disponible"
3. Un cliente inscribe → se muestra "Aforo completo"
4. El formulario de inscripción se oculta, solo se ve "Aforo completo"
5. Siguiente cliente ve el taller pero no puede inscribirse

### Escenario 4: Taller pasado de fecha
1. Taller con horario de finalización a las 18:30
2. Son las 18:31 (hora española) del mismo día
3. El taller DEJA de ser visible en la home pública en ese instante
4. El admin SÍ lo ve en su panel
5. No cambia su estado interno — simplemente se filtra de las consultas públicas

### Escenario 5: Admin selecciona turno con bloqueo existente
1. Existe un bloqueo en fecha X, turno T2
2. Admin crea taller para fecha X, selecciona turnos T1 y T2
3. El sistema elimina el bloqueo de T2 y crea el taller
4. T1 y T2 quedan bloqueados por el taller
5. Google Calendar: se elimina el evento del bloqueo, se crea evento del taller

## Edge cases

- **Inscripción concurrente**: Si dos clientes intentan inscribir al mismo tiempo cuando queda 1 plaza, solo una debe tener éxito. MongoDB `$push` con condición atómica.
- **Taller sin horario definido**: El horario es requerido al crear. No se permite taller sin hora de inicio y fin.
- **Aforo 0**: No permitido. Mínimo 1.
- **Email inválido**: Validación estricta con regex en front y back.
- **Teléfono con formato internacional**: Aceptar cualquier formato, validar solo cantidad de dígitos (≥9).
- **Taller duplicado en mismo turno**: El sistema debe validar que no exista otro taller en la misma fecha y turno (usando índice único o validación en controller).
