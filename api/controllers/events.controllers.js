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
      menusNiños: [
        { id: 1, precio: 9 },
        { id: 2, precio: 9 },
        { id: 3, precio: 10 },
        { id: 4, precio: 12 }
      ],
      plusFinDeSemana: 1.5,
      preciosAdultos: [],
      preciosExtras: { tallerBase: 25, tallerPlus: 30, personaje: 40, pinata: 15, extension30: 30, extension60: 50 }
    };
  }

  let total = 0;

  // Children
  const menu = config.menusNiños.find(m => String(m.id) === String(detalles.niños.menuId));
  const childPrice = menu ? menu.precio : 0;
  let subTotalNiños = childPrice * detalles.niños.cantidad;

  // Weekend Plus
  const dateObj = new Date(fecha);
  const day = dateObj.getDay();
  if (day === 0 || day === 5 || day === 6) { // Fri, Sat, Sun
    total += (config.plusFinDeSemana || 1.5) * detalles.niños.cantidad;
  }
  total += subTotalNiños;

  // Adults Food
  const adultosComida = detalles.adultos?.comida || (Array.isArray(detalles.adultos) ? detalles.adultos : []);
  if (config.preciosAdultos?.length > 0 && adultosComida.length > 0) {
    adultosComida.forEach(item => {
      const adultOption = config.preciosAdultos.find(opt => opt.nombre === item.item || opt.id === item.item);
      if (adultOption) {
        total += adultOption.precio * item.cantidad;
      }
    });
  }

  // Extras: Activity
  if (detalles.extras.taller !== 'ninguno') {
    const workshop = config.workshops.find(
      (w) => w.name === detalles.extras.taller,
    );
    if (workshop) {
      const tallerPrice =
        detalles.niños.cantidad >= 15 ? workshop.pricePlus : workshop.priceBase;
      total += tallerPrice;
    } else {
      // Fallback to general prices if workshop not found
      const tallerPrice =
        detalles.niños.cantidad >= 15
          ? config.preciosExtras.tallerPlus
          : config.preciosExtras.tallerBase;
      total += tallerPrice;
    }
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
  const { tipo, fecha, turno, detalles, horario, cliente } = req.body;

  // --- VALIDATION LAYER ---
  if (!fecha || !turno) throw createError(400, 'Fecha y turno requeridos');
  if (!cliente?.nombreNiño || !cliente?.nombrePadre || !cliente?.telefono || !cliente?.email) {
    throw createError(400, 'Datos del cliente incompletos (Nombre, Móvil, Email son obligatorios)');
  }

  // Validate Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cliente.email)) {
    throw createError(400, 'Email inválido');
  }
  // Validate Phone format (Strict 9 digits local + prefix)
  // +34 600111222 = 11 digits
  const phoneDigits = (cliente.telefono.match(/\d/g) || []).length;
  // Being generous: some countries have shorter phones, but target is Spain (9) + Prefix (1-3)
  // Let's require at least 10 digits total to be safe (e.g. US 10 digits + 1 prefix = 11, Spain 9 + 2 = 11)
  // If user only enters local 9 digits without prefix space, frontend might send "+34 600..."
  if (phoneDigits < 9) {
    throw createError(400, 'Teléfono inválido (mínimo 9 dígitos)');
  }

  if (cliente?.edadNiño > 99) {
    throw createError(400, 'La edad debe tener máximo 2 cifras');
  }

  if (detalles?.adultos?.cantidad !== undefined && detalles.adultos.cantidad < 0) {
    throw createError(400, 'Cantidad de adultos inválida');
  }
  // Optional strict enforcement: if (detalles.adultos.cantidad === 0) throw ...
  // For now, allow 0 if that's a valid use case (e.g. only kids party?), but UI enforces > 0. Let's align with UI request.
  if (detalles?.adultos?.cantidad <= 0) {
    throw createError(400, 'Se requiere al menos un adulto responsable');
  }
  if (detalles?.niños?.cantidad < 0) throw createError(400, 'Cantidad de niños inválida');

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
      // Monthly Check - Fetch exactly the 42 days (6 weeks) shown in the frontend grid
      const firstDayOfMonth = new Date(year, month - 1, 1);
      // find the Monday of the same week as the 1st
      const startDayOffset = (firstDayOfMonth.getDay() + 6) % 7;

      startDate = new Date(year, month - 1, 1 - startDayOffset);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 41);
      endDate.setHours(23, 59, 59, 999);
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
