const { google } = require('googleapis');
const path = require('path');
const createError = require('http-errors');

const KEYFILE_PATH = path.join(__dirname, '../google-credentials.json');

let calendar = null;
let calendarId = 'primary'; // Default, can be overridden by env

/**
 * Initialize the Google Calendar client.
 * This should be called on app startup or lazily.
 */
const init = async () => {
  try {
    let auth;

    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });
    } else {
      auth = new google.auth.GoogleAuth({
        keyFile: KEYFILE_PATH,
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });
    }

    const authClient = await auth.getClient();
    calendar = google.calendar({ version: 'v3', auth: authClient });

    if (process.env.GOOGLE_CALENDAR_ID) {
      calendarId = process.env.GOOGLE_CALENDAR_ID;
    }

    console.log('Google Calendar Service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Google Calendar Service:', error.message);
  }
};

// Initialize immediately (or could be exported to run in app.js)
init();

// Shifts configuration
const SHIFTS = {
  'T1': { start: '17:00', end: '19:00' },
  'T2': { start: '18:00', end: '20:00' },
  'T3': { start: '19:15', end: '21:15' }
};

/**
 * Creates a calendar event for a new booking.
 * @param {Object} booking - The booking object from database
 */
module.exports.createCalendarEvent = async (booking) => {
  if (!calendar) {
    console.warn('Google Calendar not initialized. Skipping event creation.');
    return null; // Fail silently or throw error depending on requirements
  }

  try {
    const { fecha, turno, cliente, _id, tipo, notasAdmin } = booking;

    // validate shift
    const shiftTimes = SHIFTS[turno];
    if (!shiftTimes) {
      console.warn(`Unknown shift ${turno}, skipping calendar event.`);
      return;
    }

    // Parse Horarios (Priorizar horario real almacenado con extensiones)
    const dateBase = new Date(fecha);
    const dateStr = dateBase.toISOString().split('T')[0];

    // Si la reserva tiene horario inicio/fin real (con extensiones), usarlo. Si no, fallback al turno base.
    const hInicio = (booking.horario?.inicio && booking.horario?.inicio !== '00:00') ? booking.horario.inicio : shiftTimes.start;
    const hFin = (booking.horario?.fin && booking.horario?.fin !== '00:00') ? booking.horario.fin : shiftTimes.end;

    const startTime = `${dateStr}T${hInicio}:00`;
    const endTime = `${dateStr}T${hFin}:00`;

    // Preparar descripción detallada (Respaldo)
    let description = '';
    if (tipo === 'bloqueo') {
      description = `Bloqueo manual: ${notasAdmin || 'Sin descripción'}`;
    } else {
      const { detalles } = booking;
      description = `
**🎂 NIÑO/A**: ${cliente.nombreNiño} (${cliente.edadNiño} años)
**👤 RESPONSABLE**: ${cliente.nombrePadre}
**📞 TELÉFONO**: ${cliente.telefono}
**📧 EMAIL**: ${cliente.email || 'No proporcionado'}

**📊 DETALLES COMERCIALES**:
- **Niños**: ${detalles?.niños?.cantidad || 0} (Menú ${detalles?.niños?.menuId})
- **Adultos**: ${detalles?.adultos?.cantidad || 0}
- **Raciones**: ${detalles?.adultos?.comida?.map(c => `${c.item} (x${c.cantidad})`).join(', ') || 'Sin comida'}

**✨ ACTIVIDADES Y EXTRAS**:
- **Taller**: ${detalles?.extras?.taller && detalles.extras.taller !== 'ninguno' ? detalles.extras.taller : 'No'}
- **Personaje**: ${detalles?.extras?.personaje && detalles.extras.personaje !== 'ninguno' ? detalles.extras.personaje : 'No'}
- **Piñata**: ${detalles?.extras?.pinata ? 'Sí' : 'No'}
- **Extensión**: ${booking.horario?.extensionMinutos || 0} min (+${booking.horario?.costoExtension || 0}€)

**📝 OBSERVACIONES**:
- ${detalles?.extras?.observaciones || 'Ninguna'}

**💰 TOTAL RESERVA**: ${booking.precioTotal}€
**🆔 ID**: ${booking.publicId || _id}
      `.trim();
    }

    // Determinar el color según el estado
    let colorId = '8'; // Gris por defecto (Bloqueos o desconocido)
    if (tipo === 'reserva') {
      if (booking.estado === 'pendiente') colorId = '5'; // Amarillo/Plátano (Pendiente)
      if (booking.estado === 'confirmado') colorId = '10'; // Verde/Basilio (Confirmado)
    }

    const eventResource = {
      summary: tipo === 'bloqueo'
        ? `🔒 BLOQUEO #${turno}: ${notasAdmin || 'Sin asunto'}`
        : `🎉 ${cliente.nombreNiño} #${turno} (${hInicio} - ${hFin})`,
      description: description,
      colorId: colorId,
      start: {
        dateTime: startTime,
        timeZone: 'Europe/Madrid',
      },
      end: {
        dateTime: endTime,
        timeZone: 'Europe/Madrid',
      },
      extendedProperties: {
        // ... sigue igual ...
        private: {
          turno: turno,
          bookingId: String(_id),
          tipo: tipo,
          source: 'neverland'
        }
      }
    };

    let response;
    if (booking.googleEventId) {
      response = await calendar.events.update({
        calendarId: calendarId,
        eventId: booking.googleEventId,
        resource: eventResource,
      });
      console.log(`Calendar event updated: ${response.data.htmlLink}`);
    } else {
      response = await calendar.events.insert({
        calendarId: calendarId,
        resource: eventResource,
      });
      console.log(`Calendar event created: ${response.data.htmlLink}`);
    }

    return response.data;

  } catch (error) {
    console.error('Error creating calendar event:', error);
    // Do not throw, so we don't block the booking response if calendar fails
    return null;
  }
};

/**
 * Deletes a calendar event.
 * @param {string} eventId - The Google Event ID to delete
 */
module.exports.deleteCalendarEvent = async (eventId) => {
  if (!calendar || !eventId) {
    return null;
  }

  try {
    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId,
    });
    console.log(`Calendar event deleted: ${eventId}`);
    return true;
  } catch (error) {
    if (error.code === 404 || error.code === 410) {
      console.warn('Event already deleted in Google Calendar');
      return true;
    }
    console.error('Error deleting calendar event:', error);
    return false;
  }
};

/**
 * Lists calendar events within a time range.
 * @param {Date} timeMin - Start time
 * @param {Date} timeMax - End time
 * @returns {Promise<Array>} List of events or throws error
 */
module.exports.listEvents = async (timeMin, timeMax) => {
  if (!calendar) {
    console.warn('Google Calendar not initialized. Cannot list events.');
    throw new Error('Google Calendar Service Unavailable');
  }

  try {
    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items;
  } catch (error) {
    console.error('Error listing calendar events:', error);
    throw error; // Re-throw to be handled by controller
  }
};
