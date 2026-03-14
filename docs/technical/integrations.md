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

---

## 💬 WhatsApp Business Integration

- **URLs Dinámicas**: El sistema construye enlaces `wa.me` con el desglose de la reserva.
- **Confirmación**: Se ofrece al cliente un botón de "Avisar por WhatsApp" al finalizar la reserva.
