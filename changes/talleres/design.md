# Diseño Técnico — Talleres

## Decisiones de arquitectura

### 1. Modelo de datos: `Taller` independiente

**Decisión**: Crear `api/models/taller.model.js` como modelo nuevo, sin modificar `event.model.js` ni `workshop.model.js`.

**Razón**: Los talleres tienen una estructura de datos fundamentalmente diferente a los eventos de cumpleaños: múltiples inscripciones como subdocumentos, múltiples turnos, galería de imágenes, sin los campos complejos de detalles (menús, adultos, extras). Forzarlo en Event crearía un esquema confuso.

### 2. Inscripciones como subdocumentos embebidos

**Decisión**: Las inscripciones se almacenan como array de subdocumentos dentro del documento Taller.

**Razón**: 
- Las inscripciones siempre se acceden junto al taller (no tienen vida independiente)
- El número máximo de inscripciones es pequeño (típicamente 15-30)
- Facilita la atomicidad en la validación de aforo (operación `$push` atómica)
- Evita joins/populate innecesarios

### 3. Múltiples turnos por taller

**Decisión**: El campo `turnos` es un array de strings (ej. `["T1", "T2"]`). El admin puede seleccionar uno o más turnos.

**Razón**: El usuario especificó que el admin debe poder bloquear más de un turno si el taller ocupa un rango horario amplio.

### 4. Eliminación de bloqueos al seleccionar turnos

**Decisión**: Al crear un taller, el sistema busca eventos tipo 'bloqueo' en los mismos (fecha, turno) y los elimina antes de crear el taller.

**Razón**: El admin usaba bloqueos manuales para reservar turnos para talleres. Ahora el taller reemplaza esa función. Esto evita conflictos de double-booking.

### 5. Visibilidad: booleano, no enum de estados

**Decisión**: Un solo campo `publico: Boolean`. Los talleres pasados se filtran por fecha, no por estado.

**Razón**: El usuario descartó el sistema de estados múltiples. La lógica es más simple: el taller existe, es público o no, y se filtra por fecha para las vistas públicas.

## Estructura de archivos

```
api/
├── models/
│   └── taller.model.js          ← NUEVO: esquema de Taller + Inscripción
├── controllers/
│   └── talleres.controllers.js  ← NUEVO: CRUD + inscripciones + upload imágenes
├── config/
│   └── routes.config.js         ← MODIFICADO: añadir rutas /talleres
│   └── cloudinary.config.js     ← MODIFICADO: añadir carpeta 'talleres'
│   └── mailer.config.js         ← MODIFICADO: nueva plantilla email taller

web/
├── src/
│   ├── pages/
│   │   ├── TalleresPage.jsx          ← NUEVO: página pública de detalle
│   │   └── AdminDashboard.jsx        ← MODIFICADO: añadir item "Talleres"
│   ├── components/
│   │   ├── admin/
│   │   │   ├── TalleresList.jsx      ← NUEVO: listado admin de talleres
│   │   │   ├── TallerForm.jsx        ← NUEVO: formulario crear/editar
│   │   │   ├── TallerDetail.jsx      ← NUEVO: detalle admin con inscripciones
│   │   │   └── InscripcionesList.jsx ← NUEVO: lista de niños inscritos
│   │   ├── home/
│   │   │   └── TalleresSection.jsx   ← NUEVO: sección en homepage
│   │   └── talleres/
│   │       ├── TallerPublicCard.jsx  ← NUEVO: tarjeta de taller en lista
│   │       ├── TallerPublicDetail.jsx← NUEVO: detalle público
│   │       ├── InscripcionForm.jsx   ← NUEVO: formulario de inscripción
│   │       └── InscripcionResumen.jsx← NUEVO: resumen post-inscripción
│   ├── services/
│   │   └── api.js                    ← MODIFICADO: añadir endpoints talleres
│   └── App.jsx                       ← MODIFICADO: añadir rutas
```

## Modelo de datos detallado

```javascript
// taller.model.js
const inscripcionSchema = new mongoose.Schema({
  nombreNiño: { type: String, required: true, maxlength: 100 },
  edadNiño: { type: Number, max: 99 },
  nombreResponsable: { type: String, required: true, maxlength: 100 },
  telefonoResponsable: { type: String, required: true },
  emailResponsable: { type: String, required: true },
  privacyPolicyConsent: { type: Boolean, required: true },
  marketingConsent: { type: Boolean, default: false },
  fechaConsentimiento: { type: Date, default: Date.now }
}, { timestamps: true });

const tallerSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  precio: { type: Number, required: true, min: 0 },
  aforo: { type: Number, required: true, default: 15, min: 1 },
  publico: { type: Boolean, default: false },
  fecha: { type: Date, required: true },
  turnos: [{ type: String, enum: ['T1', 'T2', 'T3'] }],
  horario: {
    inicio: { type: String, required: true },
    fin: { type: String, required: true }
  },
  portada: String,
  galeria: [String],
  inscripciones: [inscripcionSchema],
  googleEventId: String
}, { timestamps: true, toJSON: { /* transform estándar */ } });
```

## API Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/v1/talleres` | No (admin ve todos, público ve solo `publico: true`) | Listar talleres. Query params: `publico`, `proximos`, `fecha` |
| `GET` | `/api/v1/talleres/:id` | No (público) / Admin | Detalle de taller (admin ve inscripciones, público no) |
| `POST` | `/api/v1/talleres` | Admin | Crear taller |
| `PATCH` | `/api/v1/talleres/:id` | Admin | Actualizar taller |
| `DELETE` | `/api/v1/talleres/:id` | Admin | Eliminar taller |
| `POST` | `/api/v1/talleres/:id/inscripciones` | No (público) | Inscribir niño |
| `DELETE` | `/api/v1/talleres/:id/inscripciones/:inscripcionId` | Admin | Eliminar inscripción |
| `POST` | `/api/v1/talleres/upload` | Admin | Subir imagen (portada o galería) |

## Lógica de bloqueo de turnos

### Al crear un taller:
1. Validar que no exista otro taller en (fecha, turnos[]) — SOLO talleres, no eventos
2. Buscar eventos tipo 'bloqueo' en (fecha, turnos[])
3. Eliminar los bloqueos encontrados (BD + Google Calendar)
4. Crear el taller
5. Crear evento en Google Calendar con el horario del taller
6. Los talleres se almacenan en su propia colección `Taller` (NO en la colección `Event`, que está muy acoplada a cumpleaños con campos como `detalles.niños`, `adultos`, `extras`). El `checkAvailability` consulta AMBAS colecciones (Event + Taller) para determinar turnos ocupados.

### Al consultar disponibilidad:
- Modificar `checkAvailability` para que también busque en la colección `Taller`
- Un turno está ocupado si existe un taller con ese turno en esa fecha
- Devolver los turnos ocupados por talleres junto con los de eventos

### Alternativa considerada:
Crear eventos tipo 'bloqueo' automáticamente al crear un taller. **Descartado**: sería duplicar datos y crear complejidad de sincronización. Es más limpio consultar directamente la colección Taller en el availability check.

## Flujo de inscripción atómica

```javascript
// Prevenir race conditions en aforo
const resultado = await Taller.findOneAndUpdate(
  { 
    _id: tallerId, 
    [`inscripciones.${aforo - 1}`]: { $exists: false } // aún hay plaza
  },
  { $push: { inscripciones: datosInscripcion } },
  { new: true }
);

if (!resultado) {
  throw createError(409, 'Aforo completo');
}
```

## Integración Google Calendar

Al crear/editar taller:
1. Formatear fecha + horario.inicio → DateTime inicio
2. Formatear fecha + horario.fin → DateTime fin
3. Crear/actualizar evento con `googleService.createCalendarEvent()`
4. El summary incluye "🎨 Taller: {nombre}" para distinguirlo de cumpleaños
5. Metadatos: `source: 'neverland'`, `type: 'taller'`, `tallerId: id`

Al seleccionar turnos con bloqueos existentes:
1. Buscar eventos de Google con extendedProperties.type === 'bloqueo' en (fecha, turnos[])
2. Eliminarlos con `googleService.deleteCalendarEvent()`

## Plantilla de email

Similar a la de reservas pero simplificada:
- Asunto: "Confirmación de inscripción — {nombreTaller}"
- Contenido: nombre del taller, fecha, horario, nombre del niño, precio, instrucciones
- Sin detalles de menús, adultos, ni extras (no aplican)

## Frontend: Componentes y rutas

### Rutas nuevas en App.jsx:
```jsx
// Públicas
<Route path="/talleres" element={<TalleresListPage />} />
<Route path="/talleres/:id" element={<TallerPublicDetail />} />
<Route path="/talleres/:id/inscripcion" element={<InscripcionForm />} />
<Route path="/talleres/:id/confirmacion" element={<InscripcionResumen />} />

// Admin (anidadas bajo /admin)
<Route path="talleres" element={<TalleresList />} />
<Route path="talleres/nuevo" element={<TallerForm />} />
<Route path="talleres/:id" element={<TallerDetail />} />
<Route path="talleres/:id/editar" element={<TallerForm />} />
```

### Sidebar del admin:
Renombrar "Bandeja de Entrada" → "Cumpleaños". Añadir `{ id: 'talleres', label: 'Talleres', icon: Palette }` al array `sidebarItems`. Nuevo orden: Cumpleaños, Talleres, Calendario, Configuración.

### Homepage:
Añadir `<TalleresSection />` en `HomePage.jsx`. Esta sección consulta `GET /api/v1/talleres?publico=true&proximos=true` y muestra los primeros 3-6 talleres en cards horizontales con link a "Ver todos".

## Seguridad y protección de datos

- Mismos estándares que las reservas de cumpleaños
- `privacyPolicyConsent` obligatorio para inscribir
- `marketingConsent` opcional
- Datos de niños almacenados solo como parte de la inscripción
- Email del responsable validado y verificado
- Helmet, CORS, rate limiting ya configurados en app.js
