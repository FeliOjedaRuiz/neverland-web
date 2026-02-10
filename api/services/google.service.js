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
    const auth = new google.auth.GoogleAuth({
      keyFile: KEYFILE_PATH,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const authClient = await auth.getClient();
    calendar = google.calendar({ version: 'v3', auth: authClient });

    if (process.env.GOOGLE_CALENDAR_ID) {
      calendarId = process.env.GOOGLE_CALENDAR_ID;
    }

    console.log('Google Calendar Service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Google Calendar Service:', error.message);
    console.error('Make sure "google-credentials.json" exists in the api root.');
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

    // Parse Date
    // Booking date is likely ISO Date or String YYYY-MM-DD
    const dateBase = new Date(fecha);
    const dateStr = dateBase.toISOString().split('T')[0]; // YYYY-MM-DD

    const startTime = `${dateStr}T${shiftTimes.start}:00`;
    const endTime = `${dateStr}T${shiftTimes.end}:00`;

    const eventResource = {
      summary: tipo === 'bloqueo'
        ? `BLOQUEO: ${notasAdmin || 'Sin asunto'}`
        : `Reserva Neverland: ${cliente.nombreNiño} (${turno})`,
      description: tipo === 'bloqueo' ? `Bloqueo manual: ${notasAdmin || 'Sin descripción'}` : `
**Cliente**: ${cliente.nombrePadre}
**Teléfono**: ${cliente.telefono}
**Niño/a**: ${cliente.nombreNiño} (${cliente.edadNiño} años)
**ID Reserva**: ${_id}
**Turno**: ${turno} (${shiftTimes.start} - ${shiftTimes.end})
            `.trim(),
      start: {
        dateTime: startTime,
        timeZone: 'Europe/Madrid',
      },
      end: {
        dateTime: endTime,
        timeZone: 'Europe/Madrid',
      },
      extendedProperties: {
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
