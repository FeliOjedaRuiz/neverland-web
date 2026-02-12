const Event = require('../models/event.model');
const createError = require('http-errors');
const googleService = require('../services/google.service');

const Config = require('../models/config.model');

// Helper to calculate price based on config and event data
const calculateEventPrice = async (eventData, config) => {
  const { tipo, fecha, turno, detalles, horario } = eventData;
  if (tipo === 'bloqueo') return 0;

  if (!config) {
    config = await Config.findOne();
  }
  if (!config) {
    config = {
      preciosNiños: { 1: 9, 2: 9, 3: 10, 4: 12, plusFinDeSemana: 1.5 },
      preciosAdultos: [],
      preciosExtras: { tallerBase: 25, tallerPlus: 30, personaje: 40, pinata: 15, extension30: 30, extension60: 50 }
    };
  }

  let total = 0;

  // Children
  const childPrice = config.preciosNiños[detalles.niños.menuId] || 0;
  let subTotalNiños = childPrice * detalles.niños.cantidad;

  // Weekend Plus
  const dateObj = new Date(fecha);
  const day = dateObj.getDay();
  if (day === 0 || day === 5 || day === 6) { // Fri, Sat, Sun
    subTotalNiños += (config.preciosNiños.plusFinDeSemana || 1.5) * detalles.niños.cantidad;
  }
  total += subTotalNiños;

  // Adults
  if (config.preciosAdultos?.length > 0 && detalles.adultos && Array.isArray(detalles.adultos)) {
    detalles.adultos.forEach(item => {
      // Find by name if it's the update format, or by id if it's the create format?
      // Actually, in config.preciosAdultos we have objects.
      const adultOption = config.preciosAdultos.find(opt => opt.nombre === item.item || opt.id === item.item);
      if (adultOption) {
        total += adultOption.precio * item.cantidad;
      }
    });
  }

  // Extras: Workshop
  if (detalles.extras.taller !== 'ninguno') {
    const tallerPrice = detalles.niños.cantidad > 25
      ? config.preciosExtras.tallerPlus
      : config.preciosExtras.tallerBase;
    total += tallerPrice;
  }

  // Extras: Character
  if (detalles.extras.personaje !== 'ninguno') {
    total += config.preciosExtras.personaje;
  }

  // Extras: Pinata
  if (detalles.extras.pinata) {
    total += config.preciosExtras.pinata;
  }

  // Extras: Extension
  if (horario?.extensionMinutos === 30) total += config.preciosExtras.extension30;
  if (horario?.extensionMinutos === 60) total += config.preciosExtras.extension60;

  return total;
};

module.exports.create = (req, res, next) => {
  const { tipo, fecha, turno, detalles, horario } = req.body;

  // Basic availability check
  Event.findOne({ fecha, turno, estado: { $ne: 'cancelada' } })
    .then(async (existingEvent) => {
      if (existingEvent) {
        throw createError(409, 'Este turno ya está ocupado');
      }

      // --- SECURE PRICE CALCULATION ---
      const calculatedTotal = await calculateEventPrice(req.body);

      // 3. Override price in body
      const eventData = { ...req.body, precioTotal: calculatedTotal };

      return Event.create(eventData)
        .then(async (event) => {
          // Sync with Google Calendar
          const gEvent = await googleService.createCalendarEvent(event);
          if (gEvent?.id) {
            event.googleEventId = gEvent.id;
            await event.save();
          }
          return res.status(201).json(event);
        });
    })
    .catch(next);
};

module.exports.list = (req, res, next) => {
  const { from, to } = req.query;
  const query = {};

  if (from && to) {
    query.fecha = { $gte: new Date(from), $lte: new Date(to) };
  }

  Event.find(query)
    .sort({ fecha: 1, turno: 1 })
    .then(events => res.json(events))
    .catch(next);
};

module.exports.detail = (req, res, next) => {
  Event.findById(req.params.id)
    .then(event => {
      if (!event) return next(createError(404, 'Evento no encontrado'));
      res.json(event);
    })
    .catch(next);
};

module.exports.update = (req, res, next) => {
  // If we change details, date or turn, we might need to recalculate price
  // To handle partial updates correctly, we first find the current event
  Event.findById(req.params.id)
    .then(async (currentEvent) => {
      if (!currentEvent) throw createError(404, 'Evento no encontrado');

      // Prepare merged data for price calculation
      const mergedData = {
        ...currentEvent.toObject(),
        ...req.body,
        detalles: {
          ...currentEvent.detalles,
          ...(req.body.detalles || {})
        }
      };

      // Recalculate price if relevant fields sent
      if (req.body.detalles || req.body.fecha || req.body.turno || req.body.horario) {
        req.body.precioTotal = await calculateEventPrice(mergedData);
      }

      return Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    })
    .then(async (event) => {
      // Update/Sync with Google Calendar
      try {
        const gEvent = await googleService.createCalendarEvent(event);
        if (gEvent?.id && !event.googleEventId) {
          event.googleEventId = gEvent.id;
          await event.save();
        }
      } catch (err) {
        console.error('Failed to sync updated event to Google:', err);
      }

      res.json(event);
    })
    .catch(next);
};

module.exports.delete = (req, res, next) => {
  Event.findByIdAndDelete(req.params.id)
    .then(event => {
      if (!event) return next(createError(404, 'Evento no encontrado'));
      res.status(204).send();
    })
    .catch(next);
};

module.exports.checkAvailability = async (req, res, next) => {
  const { fecha, year, month } = req.query;

  try {
    let startDate, endDate;

    if (fecha) {
      // Single Day Check
      startDate = new Date(fecha);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(fecha);
      endDate.setHours(23, 59, 59, 999);
    } else if (year && month) {
      // Monthly Check
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
    } else {
      return next(createError(400, 'Fecha o Año/Mes requeridos'));
    }

    // 1. Local DB Events
    const dbEvents = await Event.find({
      fecha: { $gte: startDate, $lte: endDate },
      estado: { $ne: 'cancelada' }
    });

    let occupied = dbEvents.map(e => ({
      date: e.fecha.toISOString().split('T')[0],
      shift: e.turno
    }));

    // 2. Google Calendar Events
    try {
      const googleEvents = await googleService.listEvents(startDate, endDate);

      // Shift Definitions (Hardcoded for now to match google.service.js)
      const SHIFTS = {
        'T1': { start: [17, 0], end: [19, 0] },
        'T2': { start: [18, 0], end: [20, 0] },
        'T3': { start: [19, 15], end: [21, 15] }
      };

      googleEvents.forEach(gEvent => {
        // Skip available/transparent events
        if (gEvent.transparency === 'transparent') return;
        if (gEvent.status === 'cancelled') return;

        const start = new Date(gEvent.start.dateTime || gEvent.start.date);
        const end = new Date(gEvent.end.dateTime || gEvent.end.date);

        // Handle All-Day Events
        if (!gEvent.start.dateTime) {
          let curr = new Date(start);
          while (curr < end) {
            const dateStr = curr.toISOString().split('T')[0];
            // Block all shifts for all-day events
            ['T1', 'T2', 'T3'].forEach(shift => {
              occupied.push({ date: dateStr, shift });
            });
            curr.setDate(curr.getDate() + 1);
          }
          return;
        }

        // Handle Timed Events
        // We strictly check date string match to avoid timezone confusion for shift comparison base
        // But for overlap we use real Date objects.
        const eventDateStr = start.toISOString().split('T')[0];
        const eventTurno = gEvent.extendedProperties?.private?.turno;
        const isNeverland = gEvent.extendedProperties?.private?.source === 'neverland' || gEvent.extendedProperties?.private?.bookingId;

        if (!isNeverland) return; // Skip any personal/external events without our metadata

        Object.entries(SHIFTS).forEach(([shiftId, time]) => {
          // If the event specifically belongs to a shift (our own sync), only block that shift
          if (eventTurno) {
            if (eventTurno === shiftId) {
              occupied.push({ date: eventDateStr, shift: shiftId });
            }
            return;
          }

          // Case for manual blocks synced from dashboard (they have source: neverland but might not have a turno if they block all day)
          // For now, if it's neverland but has no turno, we check overlap
          const shiftStart = new Date(eventDateStr);
          shiftStart.setHours(time.start[0], time.start[1], 0, 0);

          const shiftEnd = new Date(eventDateStr);
          shiftEnd.setHours(time.end[0], time.end[1], 0, 0);

          // Overlap check: StartA < EndB && EndA > StartB
          if (start < shiftEnd && end > shiftStart) {
            occupied.push({ date: eventDateStr, shift: shiftId });
          }
        });
      });

    } catch (googleError) {
      console.error('Google Calendar Sync Failed:', googleError);
      // FAIL-SAFE: Throw error to prevent returning partial availability
      throw createError(503, 'Service Temporarily Unavailable: Calendar Sync Failed');
    }

    // 3. Format Response
    if (fecha) {
      // Return occupied shifts for the specific day
      const occupiedShifts = occupied
        .filter(o => o.date === fecha)
        .map(o => o.shift);

      // Deduplicate
      res.json({ occupiedShifts: [...new Set(occupiedShifts)] });
    } else {
      // Return all occupied slots
      res.json({ occupied });
    }

  } catch (error) {
    next(error);
  }
};
