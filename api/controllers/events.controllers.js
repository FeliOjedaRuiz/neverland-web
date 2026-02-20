const Event = require('../models/event.model');
const createError = require('http-errors');
const googleService = require('../services/google.service');

const Config = require('../models/config.model');

// Centralized Shift Definitions
const SHIFTS = {
  'T1': { start: [17, 0], end: [19, 0] },
  'T2': { start: [18, 0], end: [20, 0] },
  'T3': { start: [19, 15], end: [21, 15] }
};

// Helper to calculate price based on config and event data
// NOW MUTATES eventData to add snapshots if they are missing!
const calculateEventPrice = async (eventData, config) => {
  const { tipo, fecha, turno, detalles, horario } = eventData;
  if (tipo === 'bloqueo') return 0;

  if (!config) {
    config = await Config.findOne();
  }

  const safeConfig = config || {
    menusNiños: [],
    plusFinDeSemana: 1.5,
    preciosAdultos: [],
    preciosExtras: { tallerBase: 25, tallerPlus: 30, personaje: 40, pinata: 15, extension30: 30, extension60: 50 },
    workshops: []
  };

  let total = 0;

  // 1. Children
  if (detalles?.niños) {
    let childPrice = detalles.niños.precioApplied;

    if (childPrice === undefined || childPrice === null) {
      const menu = safeConfig.menusNiños?.find(m =>
        String(m.id) === String(detalles.niños.menuId) ||
        String(m._id) === String(detalles.niños.menuId)
      );
      // Hard fallback if not found in DB but matches our default logic
      if (!menu && String(detalles.niños.menuId) === '4') childPrice = 12;
      else if (!menu && ['1', '2'].includes(String(detalles.niños.menuId))) childPrice = 9;
      else if (!menu && String(detalles.niños.menuId) === '3') childPrice = 10;
      else childPrice = menu ? menu.precio : 0;

      detalles.niños.precioApplied = childPrice;
    }

    total += childPrice * (detalles.niños.cantidad || 0);

    // Weekend Plus
    if (fecha) {
      const dateObj = new Date(fecha);
      const day = dateObj.getDay();
      if (day === 0 || day === 5 || day === 6) {
        total += (safeConfig.plusFinDeSemana || 1.5) * (detalles.niños.cantidad || 0);
      }
    }
  }

  // 2. Adults Food
  const adultosData = detalles?.adultos;
  const comidaList = Array.isArray(adultosData) ? adultosData : (adultosData?.comida || []);

  if (comidaList.length > 0) {
    comidaList.forEach(item => {
      if (item.precioUnitario !== undefined && item.precioUnitario !== null) {
        total += item.precioUnitario * item.cantidad;
      } else if (safeConfig.preciosAdultos) {
        const adultOption = safeConfig.preciosAdultos.find(opt =>
          opt.nombre === item.item || String(opt.id) === String(item.item) || String(opt.id) === String(item.id)
        );
        if (adultOption) {
          total += adultOption.precio * item.cantidad;
          item.precioUnitario = adultOption.precio;
        }
      }
    });
  }

  // 3. Extras
  if (detalles?.extras) {
    if (detalles.extras.taller && detalles.extras.taller !== 'ninguno') {
      let tallerPrice = detalles.extras.precioTallerApplied;
      if (tallerPrice === undefined || tallerPrice === null) {
        const workshop = safeConfig.workshops?.find(
          (w) => w.name.toLowerCase() === detalles.extras.taller.toLowerCase()
        );
        const isLargeGroup = (detalles.niños?.cantidad || 0) >= 15;
        if (workshop) {
          tallerPrice = isLargeGroup ? workshop.pricePlus : workshop.priceBase;
        } else {
          tallerPrice = isLargeGroup ? 30 : 25;
        }
        detalles.extras.precioTallerApplied = tallerPrice;
      }
      total += tallerPrice;
    }

    if (detalles.extras.personaje && detalles.extras.personaje !== 'ninguno') {
      let charPrice = detalles.extras.precioPersonajeApplied;
      if (charPrice === undefined || charPrice === null) {
        charPrice = safeConfig.preciosExtras?.personaje || 40;
        detalles.extras.precioPersonajeApplied = charPrice;
      }
      total += charPrice;
    }

    if (detalles.extras.pinata) {
      let pinataPrice = detalles.extras.precioPinataApplied;
      if (pinataPrice === undefined || pinataPrice === null) {
        pinataPrice = safeConfig.preciosExtras?.pinata || 15;
        detalles.extras.precioPinataApplied = pinataPrice;
      }
      total += pinataPrice;
    }
  }

  // 4. Extension
  if (horario?.extensionMinutos) {
    let extCost = horario.costoExtension;
    if (horario.extensionMinutos > 0 && !extCost) {
      if (horario.extensionMinutos === 30) extCost = safeConfig.preciosExtras?.extension30 || 30;
      if (horario.extensionMinutos === 60) extCost = safeConfig.preciosExtras?.extension60 || 50;
      horario.costoExtension = extCost;
    }
    total += extCost || 0;
  }

  console.log(`Final calculated price: ${total}€`);
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
  const { from, to, estado, tipo, page, limit, sortBy = 'fecha', order = 'asc', search } = req.query;
  const query = {};

  if (from || to) {
    query.fecha = {};
    if (from) query.fecha.$gte = new Date(from);
    if (to) query.fecha.$lte = new Date(to);
  }

  if (estado) {
    query.estado = estado;
  }

  if (tipo) {
    query.tipo = tipo;
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    query.$or = [
      { publicId: searchRegex },
      { 'cliente.nombreNiño': searchRegex },
      { 'cliente.nombrePadre': searchRegex }
    ];
  }

  const sortOrder = order === 'desc' ? -1 : 1;
  const sortQuery = { [sortBy]: sortOrder };

  // Secondary sort to ensure consistent ordering (e.g. by turno if dates are same)
  if (sortBy === 'fecha') {
    sortQuery.turno = sortOrder;
  }

  if (page) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    Promise.all([
      Event.find(query).sort(sortQuery).skip(skip).limit(limitNum),
      Event.countDocuments(query)
    ])
      .then(([events, total]) => {
        res.json({
          data: events,
          meta: {
            total,
            pages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            limit: limitNum
          }
        });
      })
      .catch(next);
  } else {
    // Legacy / Calendar support
    Event.find(query)
      .sort(sortQuery)
      .then(events => res.json(events))
      .catch(next);
  }
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
  Event.findById(req.params.id)
    .then(async (event) => {
      if (!event) throw createError(404, 'Evento no encontrado');

      // Update basic fields or merge details
      if (req.body.detalles) {
        const oldDetalles = event.detalles.toObject();
        const newDetalles = req.body.detalles;

        // Invalidate snapshots if crucial selections changed
        if (newDetalles.niños?.menuId && String(newDetalles.niños.menuId) !== String(oldDetalles.niños?.menuId)) {
          delete oldDetalles.niños.precioApplied;
        }
        if (newDetalles.extras?.taller && newDetalles.extras.taller !== oldDetalles.extras?.taller) {
          delete oldDetalles.extras.precioTallerApplied;
        }
        if (newDetalles.extras?.personaje && newDetalles.extras.personaje !== oldDetalles.extras?.personaje) {
          delete oldDetalles.extras.precioPersonajeApplied;
        }
        if (newDetalles.extras?.pinata !== undefined && newDetalles.extras.pinata !== oldDetalles.extras?.pinata) {
          delete oldDetalles.extras.precioPinataApplied;
        }

        // Deep merge details to avoid losing other sub-fields
        event.detalles = {
          niños: { ...oldDetalles.niños, ...(newDetalles.niños || {}) },
          adultos: { ...oldDetalles.adultos, ...(newDetalles.adultos || {}) },
          extras: { ...oldDetalles.extras, ...(newDetalles.extras || {}) }
        };
        delete req.body.detalles;
      }

      event.set(req.body);

      // Recalculate price if relevant fields changed
      if (event.isModified('detalles') || event.isModified('fecha') || event.isModified('turno') || event.isModified('horario')) {
        const newPrice = await calculateEventPrice(event.toObject());
        console.log(`Recalculating price for ${event.publicId}: ${newPrice}€`);
        event.precioTotal = newPrice;
      }

      await event.save();

      // Sync with Google
      try {
        if (event.estado === 'cancelada') {
          if (event.googleEventId) {
            await googleService.deleteCalendarEvent(event.googleEventId);
            event.googleEventId = undefined;
            await event.save();
          }
        } else {
          const gEvent = await googleService.createCalendarEvent(event);
          if (gEvent?.id && !event.googleEventId) {
            event.googleEventId = gEvent.id;
            await event.save();
          }
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
    .then(async (event) => {
      if (!event) return next(createError(404, 'Evento no encontrado'));

      // Sincronizar borrado con Google Calendar
      if (event.googleEventId) {
        await googleService.deleteCalendarEvent(event.googleEventId);
      }

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
        const summary = (gEvent.summary || '').toUpperCase();
        const eventTurno = gEvent.extendedProperties?.private?.turno;
        const isNeverland = gEvent.extendedProperties?.private?.source === 'neverland' || gEvent.extendedProperties?.private?.bookingId;

        // Soporte para palabras clave manuales desde Google Calendar
        const keywordShift = ['T1', 'T2', 'T3'].find(s => summary.includes(`#${s}`));
        const hasGeneralKeyword = summary.includes('#BLOQUEO') || summary.includes('#NEVERLAND');

        if (!isNeverland && !keywordShift && !hasGeneralKeyword) return;

        const eventDateStr = start.toISOString().split('T')[0];

        Object.entries(SHIFTS).forEach(([shiftId, time]) => {
          // 1. Por metadatos (App) o Palabra Clave específica (#T1, #T2, #T3)
          if (eventTurno === shiftId || keywordShift === shiftId) {
            occupied.push({ date: eventDateStr, shift: shiftId });
            return;
          }

          // 2. Por solapamiento (Si es un evento de Neverland/Bloqueo sin turno específico)
          const shiftStart = new Date(eventDateStr);
          shiftStart.setHours(time.start[0], time.start[1], 0, 0);

          const shiftEnd = new Date(eventDateStr);
          shiftEnd.setHours(time.end[0], time.end[1], 0, 0);

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
