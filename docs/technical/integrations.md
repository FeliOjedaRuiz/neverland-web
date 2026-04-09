# 🔌 Integraciones y Sincronización

## 📅 Google Calendar API (Sincronización Bidireccional)

El sistema utiliza Google Calendar como espejo para la gestión de disponibilidad y visualización.

### Configuración Técnica
- **Autenticación**: Service Account. Requiere `GOOGLE_SERVICE_ACCOUNT_EMAIL` y `GOOGLE_PRIVATE_KEY` (o archivo local en desarrollo).
- **Zona Horaria**: Forzada a `Europe/Madrid`.

### Flujo de Sincronización
1. **Creación**: Al guardar una reserva, se genera un evento con `googleEventId`.
2. **Metadatos**: Etiquetas `source: neverland`, `bookingId`, `turno`.
3. **Consulta**: Se consultan eventos para marcar slots ocupados.

### Bloqueos Manuales Externos
El administrador puede bloquear turnos desde la App oficial de Google Calendar usando:
- `#T1`, `#T2`, `#T3`: Bloquea turno específico.
- `#BLOQUEO` o `#NEVERLAND`: Bloquea por rango horario.
- **Evento Todo el día**: Bloquea el día completo.

### ⚠️ Manejo Crítico de Fechas (Regla de Oro)
Para evitar errores de solapamiento y compatibilidad:
1. **Google `date` (Todo el día)**: Utilizar `safeParseDate(gEvento.start.date)` para normalizar a medianoche local y evitar desplazamientos de zona horaria.
2. **Google `dateTime` (Con hora)**: Utilizar `new Date(gEvento.start.dateTime)` DIRECTAMENTE. **PROHIBIDO** usar `safeParseDate` aquí, ya que descarta la información horaria necesaria para calcular solapamientos de turnos específicos.
3. **Conversión a String**: Utilizar `toLocalISO(date)` en lugar de `toISOString().split('T')[0]` para asegurar que la fecha generada corresponde al día local de España y no al día anterior por desfase UTC.

---

## ☁️ Cloudinary Asset Management

El sistema delega la gestión de imágenes a Cloudinary para optimizar el rendimiento y escalabilidad.

### Configuración
- **Almacenamiento**: Carpeta `neverland/activities`.
- **Integración**: Multer + Cloudinary Storage.
- **Flujo**:
  1. El Admin sube una imagen desde el `ConfigurationPanel`.
  2. El servidor procesa la subida y devuelve la URL segura.
  3. La URL se almacena en el documento `Config` bajo el campo `imageUrl`.

---

---

## 🔔 Notificaciones Push Nativas (VitePWA + Web-Push)

El sistema integra notificaciones push en tiempo real para alertar a los administradores sobre nuevas reservas sin necesidad de tener la App abierta.

### Configuración Técnica
- **Protocolo**: VAPID (Voluntary Application Server Identification).
- **Backend**: Librería `web-push` en Node.js.
- **Frontend**: API `PushManager` del navegador coordinada por el Service Worker (`sw.js`).
- **Almacenamiento**: Colección `pushsubscriptions` en MongoDB.

### Flujo de Notificación
1. **Suscripción**: Los administradores activan el botón "Notificaciones" en el Panel. El navegador solicita permiso y genera un `endpoint` único que se guarda en la base de datos vinculado a la sesión.
2. **Evento**: Al crearse una nueva reserva (controller `events`), se dispara el servicio `push.service`.
3. **Payload**: Se construye un objeto dinámico con:
   - `title`: '🎉 ¡Nueva Reserva!'
   - `body`: '{Nombre del Niño} — {Fecha Formateada} ({Turno})'
   - `data.url`: Enlace directo al `/admin` para gestión rápida.
4. **Broadcast**: El servidor envía el mensaje a todos los dispositivos suscritos almacenados en la base de datos.
5. **Recepción**: El Service Worker intercepta el evento `push`, muestra la notificación visual y gestiona el clic para redirigir a la App.

### Gestión de Errores y Limpieza
- Si el navegador rechaza el permiso, se muestra feedback visual en la UI.
- Las suscripciones inválidas (cuando el usuario desinstala o bloquea) se limpian automáticamente al detectar fallos de envío desde el backend.
