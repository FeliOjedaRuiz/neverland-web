// GGA Test: Control de precisión en reservas
const Event = require('../models/event.model');
const Taller = require('../models/taller.model');
const createError = require('http-errors');
const googleService = require('../services/google.service');
const mailer = require('../config/mailer.config');
const pushService = require('../services/push.service');
const { safeParseDate, getSafeNow, createSafeDate } = require('../utils/date');

const Config = require('../models/config.model');

// Centralized Shift Definitions
const SHIFTS = {
  'T1': { start: [17, 0], end: [19, 0] },
  'T2': { start: [18, 0], end: [20, 0] },
  'T3': { start: [19, 15], end: [21, 15] }
};

const validateEventData = (data) => {
  const { tipo, cliente, detalles } = data;
  if (tipo === 'bloqueo') return;

  if (cliente) {
    if (cliente.nombreNiño && cliente.nombreNiño.length > 100) throw createError(400, 'Nombre del niño demasiado largo (máx 100)');
    if (cliente.nombrePadre && cliente.nombrePadre.length > 100) throw createError(400, 'Nombre del padre demasiado largo (máx 100)');
    if (cliente.email && cliente.email.length > 100) throw createError(400, 'Email demasiado largo (máx 100)');
    if (cliente.telefono && (cliente.telefono.match(/\d/g) || []).length > 15) throw createError(400, 'Teléfono demasiado largo');
    if (cliente.edadNiño > 99) throw createError(400, 'La edad debe ser de máximo 2 cifras');
  }

  if (detalles) {
    if (detalles.niños?.cantidad > 50) throw createError(400, 'Máximo 50 niños permitidos');
    if (detalles.niños?.cantidad !== undefined && detalles.niños.cantidad < 12) throw createError(400, 'Mínimo 12 niños requeridos');

    if (detalles.adultos?.cantidad > 40) throw createError(400, 'Máximo 40 adultos permitidos');
    if (detalles.adultos?.cantidad !== undefined && detalles.adultos.cantidad <= 0) {
      throw createError(400, 'Se requiere al menos un adulto responsable');
    }

    if (detalles.adultos?.comida) {
      detalles.adultos.comida.forEach(item => {
        if (item.cantidad > 20) throw createError(400, `Máximo 20 unidades por ración (${item.item})`);
      });
    }

    if (detalles.extras?.observaciones?.length > 500) throw createError(400, 'Observaciones demasiado largas (máx 500)');
    if (detalles.extras?.alergenos?.length > 500) throw createError(400, 'Alérgenos demasiado largos (máx 500)');
    if (detalles.extras?.personajes?.length > 3) throw createError(400, 'Máximo 3 personajes permitidos');
  }
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
    preciosExtras: { tallerBase: 25, tallerPlus: 30, personaje: 40, extension30: 30, extension60: 50 },
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
      childPrice = menu ? menu.precio : 0;
      detalles.niños.precioApplied = childPrice;
      if (menu && !detalles.niños.menuNombre) {
        detalles.niños.menuNombre = menu.nombre;
      }
    }

    total += childPrice * (detalles.niños.cantidad || 0);

    // Weekend Plus
    if (fecha) {
      const dateObj = safeParseDate(fecha);
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
    // 3a. Generic catalog extras (Piñata is just another item now)
    if (Array.isArray(detalles.extras.catalogoItemIds)) {
      if (detalles.extras.catalogoItemIds.length === 0) {
        detalles.extras.precioCatalogoApplied = 0;
      } else {
      const catalogItems = safeConfig.extrasCatalogo || [];
      const catalogoItemIds = detalles.extras.catalogoItemIds;
      const seen = new Set();
      let catalogTotal = 0;
      let includesPinata = false;

      for (const itemId of catalogoItemIds) {
        if (seen.has(itemId)) {
          throw createError(400, `Extra del catálogo duplicado: ${itemId}`);
        }
        seen.add(itemId);

        const item = catalogItems.find(i => i.slug === itemId);
        if (!item || !item.active) {
          throw createError(400, `Extra del catálogo no válido o inactivo: ${itemId}`);
        }

        catalogTotal += item.precio || 0;
        if (item.slug === 'pinata') {
          includesPinata = true;
        }
      }

      detalles.extras.precioCatalogoApplied = catalogTotal;
      total += catalogTotal;

      // Backcompat dual-write: keep legacy pinata fields in sync so old UI
      // readers continue to work. Only authoritative when catalog selection
      // is non-empty; empty arrays preserve legacy reservations untouched.
      const pinataCatalogItem = catalogItems.find(i => i.slug === 'pinata');
      detalles.extras.pinata = includesPinata;
      detalles.extras.precioPinataApplied = includesPinata ? pinataCatalogItem?.precio : undefined;
      }
    }

    if (detalles.extras.taller && detalles.extras.taller !== 'ninguno') {
      let tallerPrice = detalles.extras.precioTallerApplied;
      if (tallerPrice === undefined || tallerPrice === null) {
        const workshop = safeConfig.workshops?.find(
          (w) => w.name.toLowerCase() === detalles.extras.taller.toLowerCase()
        );
        const isLargeGroup = (detalles.niños?.cantidad || 0) > 15;
        if (workshop) {
          tallerPrice = isLargeGroup
            ? (workshop.pricePlus > 0 ? workshop.pricePlus : workshop.priceBase)
            : workshop.priceBase;
        } else {
          tallerPrice = isLargeGroup ? 30 : 25;
        }
        detalles.extras.precioTallerApplied = tallerPrice;
      }
      total += tallerPrice;
    }

    // Multi-personaje pricing: array-based
    const personajes = detalles.extras.personajes || [];
    if (personajes.length > 0) {
      let charTotal = detalles.extras.precioPersonajeApplied;
      if (charTotal === undefined || charTotal === null) {
        const precioUnitario = safeConfig.preciosExtras?.personaje || 40;
        const precioPack3 = safeConfig.preciosExtras?.precioPack3Personajes || 100;
        charTotal = personajes.length === 3 ? precioPack3 : precioUnitario * personajes.length;
        detalles.extras.precioPersonajeApplied = charTotal;
      }
      total += charTotal;
    }

    // Legacy fallback: for old reservations with empty catalogoItemIds
    // but pinata: true, look up the price from the catalog item and charge.
    // Skip when catalog loop already processed the selection to avoid double-count.
    const catalogHandledSelection = Array.isArray(detalles.extras.catalogoItemIds) && detalles.extras.catalogoItemIds.length > 0;
    if (detalles.extras.pinata && !catalogHandledSelection) {
      let pinataPrice = detalles.extras.precioPinataApplied;
      if (pinataPrice === undefined || pinataPrice === null) {
        const pinataCatalogItem = (safeConfig.extrasCatalogo || []).find(i => i.slug === 'pinata');
        pinataPrice = pinataCatalogItem ? pinataCatalogItem.precio : 15;
        detalles.extras.precioPinataApplied = pinataPrice;
      }
      total += pinataPrice;
    }

    if (detalles.extras.costoExtra) {
      total += detalles.extras.costoExtra;
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

module.exports.create = async (req, res, next) => {
  try {
    const { tipo, fecha, turno, detalles, horario, cliente } = req.body;

    // --- VALIDATION LAYER ---
    if (!fecha || !turno) throw createError(400, 'Fecha y turno requeridos');

    if (tipo === 'reserva') {
      if (!cliente?.nombreNiño || !cliente?.nombrePadre || !cliente?.telefono || !cliente?.email) {
        throw createError(400, 'Datos del cliente incompletos (Nombre, Móvil, Email son obligatorios)');
      }

      // Validate Email format (strict)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cliente.email)) {
        throw createError(400, 'Email inválido');
      }

      // Validate Phone format (min 9 digits)
      const phoneDigits = (cliente.telefono.match(/\d/g) || []).length;
      if (phoneDigits < 9) {
        throw createError(400, 'Teléfono inválido (mínimo 9 dígitos)');
      }

      // Call unified validation for numeric limits and lengths
      validateEventData(req.body);
    }

    // Basic availability check
    const eventoExistente = await Event.findOne({ fecha, turno, estado: { $ne: 'cancelada' } });
    if (eventoExistente) {
      throw createError(409, 'Este turno ya está ocupado');
    }

    // --- SECURE PRICE CALCULATION ---
    const totalCalculado = await calculateEventPrice(req.body);

    // 3. Override price in body
    const datosEvento = { ...req.body, precioTotal: totalCalculado };

    const evento = await Event.create(datosEvento);

    // Sync with Google Calendar
    try {
      const gEvento = await googleService.createCalendarEvent(evento);
      if (gEvento?.id) {
        evento.googleEventId = gEvento.id;
        await evento.save();
      }
    } catch (gErr) {
      console.error('Google Calendar sync failed during creation:', gErr);
      // We don't block the user response if Google fails
    }

    // Send confirmation email
    if (evento.tipo === 'reserva' && evento.cliente?.email) {
      try {
        await mailer.sendBookingConfirmationEmail(evento);
      } catch (mErr) {
        console.error('Confirmation email failed:', mErr);
      }
    }

    // Notificar al admin vía Push
    if (evento.tipo === 'reserva') {
      try {
        pushService.notifyNewBooking(evento);
      } catch (pErr) {
        console.warn('Push notification failed:', pErr);
      }
    }

    return res.status(201).json(evento);
  } catch (error) {
    next(error);
  }
};

module.exports.list = async (req, res, next) => {
  try {
    const { from, to, estado, tipo, page, limit, sortBy = 'fecha', order = 'asc', search } = req.query;
    const query = {};

    if (from || to) {
      query.fecha = {};
      if (from) query.fecha.$gte = safeParseDate(from);
      if (to) query.fecha.$lte = safeParseDate(to);
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

      const [events, total] = await Promise.all([
        Event.find(query).sort(sortQuery).skip(skip).limit(limitNum),
        Event.countDocuments(query)
      ]);

      return res.json({
        data: events,
        meta: {
          total,
          pages: Math.ceil(total / limitNum),
          currentPage: pageNum,
          limit: limitNum
        }
      });
    } else {
      // Legacy / Calendar support
      const events = await Event.find(query).sort(sortQuery);
      return res.json(events);
    }
  } catch (error) {
    next(error);
  }
};

module.exports.detail = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return next(createError(404, 'Evento no encontrado'));
    res.json(event);
  } catch (error) {
    next(error);
  }
};

module.exports.publicDetail = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return next(createError(404, 'Reserva no encontrada'));

    // We only return public-safe fields (matching what the frontend needs)
    const publicData = {
      id: event.id,
      publicId: event.publicId,
      invitationId: event.invitationId,
      fecha: event.fecha,
      turno: event.turno,
      estado: event.estado,
      precioTotal: event.precioTotal,
      horario: event.horario,
      cliente: {
        nombreNiño: event.cliente.nombreNiño,
        edadNiño: event.cliente.edadNiño,
        nombrePadre: event.cliente.nombrePadre,
        email: event.cliente.email,
        telefono: event.cliente.telefono,
        privacyPolicyConsent: event.cliente.privacyPolicyConsent,
        marketingConsent: event.cliente.marketingConsent,
        fechaConsentimiento: event.cliente.fechaConsentimiento,
      },
      detalles: {
        niños: {
          cantidad: event.detalles.niños.cantidad,
          menuId: event.detalles.niños.menuId,
          menuNombre: event.detalles.niños.menuNombre,
          precioApplied: event.detalles.niños.precioApplied
        },
        adultos: event.detalles.adultos,
        extras: event.detalles.extras
      }
    };
    res.json(publicData);
  } catch (error) {
    next(error);
  }
};

module.exports.getInvitation = async (req, res, next) => {
  try {
    const event = await Event.findOne({ invitationId: req.params.invitationId });
    if (!event) return next(createError(404, 'Invitación no encontrada'));

    if (event.estado !== 'confirmado' && event.estado !== 'confirmada') {
      return next(createError(403, 'Esta invitación no está activa o ya no es válida'));
    }

    const publicData = {
      id: event.id,
      fecha: event.fecha,
      turno: event.turno,
      horario: event.horario,
      cliente: {
        nombreNiño: event.cliente.nombreNiño,
        edadNiño: event.cliente.edadNiño,
      }
    };
    res.json(publicData);
  } catch (error) {
    next(error);
  }
};

module.exports.update = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) throw createError(404, 'Evento no encontrado');

    // --- SCHEMA COMPATIBILITY SHIM ---
    if (event.tipo === 'reserva') {
      const extras = event.detalles?.extras;
      if (extras && extras.privacyPolicyConsent !== undefined && event.cliente?.privacyPolicyConsent === undefined) {
        console.warn(`[SCHEMA_SHIM] Evento ${event.publicId}: migrando consentimientos de detalles.extras a cliente.`);
        event.cliente = event.cliente || {};
        event.cliente.privacyPolicyConsent = extras.privacyPolicyConsent;
        event.cliente.marketingConsent = extras.marketingConsent ?? false;
        event.cliente.fechaConsentimiento = extras.fechaConsentimiento ?? getSafeNow(); // Usamos utilidad para "ahora"
        event.detalles.extras.privacyPolicyConsent = undefined;
        event.detalles.extras.marketingConsent = undefined;
        event.detalles.extras.fechaConsentimiento = undefined;
        await event.save();
      }
    }

    // --- PERMISSION & WINDOW CHECK ---
    const esAdmin = req.user && req.user.role === 'admin';

    if (!esAdmin) {
      // 1. Clients cannot change status
      if (req.body.estado && req.body.estado !== event.estado) {
        throw createError(403, 'No tienes permiso para cambiar el estado de la reserva');
      }

      // 2. 72h window check with shift-precision
      const [h, m] = (SHIFTS[event.turno]?.start || [0, 0]);
      const fechaEvento = safeParseDate(event.fecha);
      fechaEvento.setHours(h, m, 0, 0);

      const ahora = getSafeNow();
      const horasDif = (fechaEvento - ahora) / (1000 * 60 * 60);

      if (horasDif < 72) {
        throw createError(403, 'Las reservas solo pueden modificarse hasta 72 horas antes del inicio del evento');
      }
    }

    // --- VALIDATION LAYER for updates ---
    if (req.body.cliente) {
      const { nombreNiño, nombrePadre, email, telefono } = req.body.cliente;

      if (nombreNiño !== undefined && !String(nombreNiño).trim()) throw createError(400, 'El nombre del niño no puede estar vacío');
      if (nombrePadre !== undefined && !String(nombrePadre).trim()) throw createError(400, 'El nombre del padre/madre no puede estar vacío');
      if (email !== undefined && !String(email).trim()) throw createError(400, 'El email no puede estar vacío');
      if (telefono !== undefined && !String(telefono).trim()) throw createError(400, 'El teléfono no puede estar vacío');

      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) throw createError(400, 'Email inválido');
      }
      if (telefono) {
        const phoneDigits = (String(telefono).match(/\d/g) || []).length;
        if (phoneDigits < 9) throw createError(400, 'Teléfono inválido (mínimo 9 dígitos)');
      }
    }

    // Update basic fields or merge details
    if (req.body.detalles) {
      const oldDetalles = event.detalles.toObject();
      const newDetalles = req.body.detalles;

      // Invalidate snapshots if crucial selections changed
      let shouldInvalidateCatalogSnapshot = false;

      if (newDetalles.niños?.menuId && String(newDetalles.niños.menuId) !== String(oldDetalles.niños?.menuId)) {
        delete oldDetalles.niños.precioApplied;
        delete oldDetalles.niños.menuNombre;
        shouldInvalidateCatalogSnapshot = true;
      }
      if (newDetalles.extras?.taller && newDetalles.extras.taller !== oldDetalles.extras?.taller) {
        delete oldDetalles.extras.precioTallerApplied;
        shouldInvalidateCatalogSnapshot = true;
      }
      // Multi-personaje: compare sorted arrays to detect content changes
      {
        const oldChars = (oldDetalles.extras?.personajes || []).slice().sort();
        const newChars = (newDetalles.extras?.personajes || []).slice().sort();
        if (JSON.stringify(oldChars) !== JSON.stringify(newChars)) {
          delete oldDetalles.extras.precioPersonajeApplied;
          shouldInvalidateCatalogSnapshot = true;
        }
      }
      if (newDetalles.extras?.pinata !== undefined && newDetalles.extras.pinata !== oldDetalles.extras?.pinata) {
        delete oldDetalles.extras.precioPinataApplied;
        shouldInvalidateCatalogSnapshot = true;
      }
      // Catalog extras: compare sorted arrays to detect selection changes
      {
        const oldCatalog = (oldDetalles.extras?.catalogoItemIds || []).slice().sort();
        const newCatalog = (newDetalles.extras?.catalogoItemIds || []).slice().sort();
        if (JSON.stringify(oldCatalog) !== JSON.stringify(newCatalog)) {
          shouldInvalidateCatalogSnapshot = true;
        }
      }
      // Horario extension changes affect total price
      if (newDetalles.horario?.extensionMinutos !== undefined && newDetalles.horario.extensionMinutos !== oldDetalles.horario?.extensionMinutos) {
        delete oldDetalles.horario.costoExtension;
        shouldInvalidateCatalogSnapshot = true;
      }

      if (shouldInvalidateCatalogSnapshot) {
        delete oldDetalles.extras.precioCatalogoApplied;
      }

      const stripIds = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        const clean = { ...obj };
        delete clean._id;
        return clean;
      };

      event.detalles = {
        niños: { ...stripIds(oldDetalles.niños), ...(newDetalles.niños || {}) },
        adultos: { ...stripIds(oldDetalles.adultos), ...(newDetalles.adultos || {}) },
        extras: { ...stripIds(oldDetalles.extras), ...(newDetalles.extras || {}) }
      };

      // Second-pass invalidation on merged result to catch stale snapshots from client payload.
      // newDetalles may contain old snapshot prices — use event.set() to reliably clear them
      // when the corresponding selection changed (comparing newDetalles vs oldDetalles).
      let shouldInvalidateCatalogSnapshotSecondPass = false;

      if (newDetalles.niños?.menuId && String(newDetalles.niños.menuId) !== String(oldDetalles.niños?.menuId)) {
        event.set('detalles.niños.precioApplied', undefined);
        event.set('detalles.niños.menuNombre', undefined);
        shouldInvalidateCatalogSnapshotSecondPass = true;
      }
      if (newDetalles.extras?.taller && newDetalles.extras.taller !== oldDetalles.extras?.taller) {
        event.set('detalles.extras.precioTallerApplied', undefined);
        shouldInvalidateCatalogSnapshotSecondPass = true;
      }
      // Multi-personaje: compare sorted arrays (order-independent)
      {
        const oldChars = (oldDetalles.extras?.personajes || []).slice().sort();
        const newChars = (newDetalles.extras?.personajes || []).slice().sort();
        if (JSON.stringify(oldChars) !== JSON.stringify(newChars)) {
          event.set('detalles.extras.precioPersonajeApplied', undefined);
          shouldInvalidateCatalogSnapshotSecondPass = true;
        }
      }
      if (newDetalles.extras?.pinata !== undefined && newDetalles.extras.pinata !== oldDetalles.extras?.pinata) {
        event.set('detalles.extras.precioPinataApplied', undefined);
        shouldInvalidateCatalogSnapshotSecondPass = true;
      }
      // Catalog extras: compare sorted arrays to detect selection changes
      {
        const oldCatalog = (oldDetalles.extras?.catalogoItemIds || []).slice().sort();
        const newCatalog = (newDetalles.extras?.catalogoItemIds || []).slice().sort();
        if (JSON.stringify(oldCatalog) !== JSON.stringify(newCatalog)) {
          shouldInvalidateCatalogSnapshotSecondPass = true;
        }
      }
      // Horario extension changes affect total price
      if (newDetalles.horario?.extensionMinutos !== undefined && newDetalles.horario.extensionMinutos !== oldDetalles.horario?.extensionMinutos) {
        event.set('detalles.horario.costoExtension', undefined);
        shouldInvalidateCatalogSnapshotSecondPass = true;
      }

      if (shouldInvalidateCatalogSnapshotSecondPass) {
        event.set('detalles.extras.precioCatalogoApplied', undefined);
      }

      validateEventData(event.toObject());
      delete req.body.detalles;
    }

    if (req.body.cliente) {
      validateEventData({ tipo: event.tipo, cliente: { ...event.cliente, ...req.body.cliente } });
    }

    event.set(req.body);

    if (event.isModified('detalles') || event.isModified('fecha') || event.isModified('turno') || event.isModified('horario')) {
      const eventData = event.toObject();
      const newPrice = await calculateEventPrice(eventData);
      event.detalles = eventData.detalles;
      event.precioTotal = newPrice;
    }

    await event.save();

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
  } catch (error) {
    next(error);
  }
};

module.exports.delete = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return next(createError(404, 'Evento no encontrado'));

    // Sincronizar borrado con Google Calendar
    if (event.googleEventId) {
      try {
        await googleService.deleteCalendarEvent(event.googleEventId);
      } catch (gErr) {
        console.error('Failed to delete Google Calendar event:', gErr);
      }
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports.checkAvailability = async (req, res, next) => {
  const { fecha, year, month } = req.query;

  try {
    let fechaInicio, fechaFin;

    if (fecha) {
      // Single Day Check
      fechaInicio = safeParseDate(fecha);
      fechaInicio.setHours(0, 0, 0, 0);
      fechaFin = safeParseDate(fecha);
      fechaFin.setHours(23, 59, 59, 999);
    } else if (year && month) {
      // Monthly Check - Fetch exactly the 42 days (6 weeks) shown in the frontend grid
      // Aquí usamos createSafeDate(year, month, day) que es seguro
      const primerDiaMes = createSafeDate(year, month - 1, 1);
      // find the Monday of the same week as the 1st
      const desfaseDiaInicio = (primerDiaMes.getDay() + 6) % 7;

      fechaInicio = createSafeDate(year, month - 1, 1 - desfaseDiaInicio);
      fechaInicio.setHours(0, 0, 0, 0);

      fechaFin = createSafeDate(fechaInicio);
      fechaFin.setDate(fechaInicio.getDate() + 41);
      fechaFin.setHours(23, 59, 59, 999);
    } else {
      return next(createError(400, 'Fecha o Año/Mes requeridos'));
    }

    // 1. Local DB Events
    const eventosDB = await Event.find({
      fecha: { $gte: fechaInicio, $lte: fechaFin },
      estado: { $ne: 'cancelada' }
    });

    let ocupados = [];

    const toLocalISO = (date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    eventosDB.forEach(evento => {
      const fechaEventoTexto = toLocalISO(evento.fecha);
      if (evento.turno) {
        ocupados.push({ 
          date: fechaEventoTexto, 
          shift: evento.turno, 
          id: String(evento._id), 
          tipo: evento.tipo,
          motivo: evento.tipo === 'bloqueo' ? (evento.notasAdmin || 'Bloqueado') : undefined
        });
      }
    });

    // 1.5 Talleres (bloquean turnos en el calendario)
    const talleres = await Taller.find({
      fecha: { $gte: fechaInicio, $lte: fechaFin }
    });

    talleres.forEach(taller => {
      const fechaEventoTexto = toLocalISO(taller.fecha);
      (taller.turnos || []).forEach(turno => {
        // Evitar duplicados con eventos existentes
        const yaExiste = ocupados.some(o => o.date === fechaEventoTexto && o.shift === turno);
        if (!yaExiste) {
          ocupados.push({ date: fechaEventoTexto, shift: turno, id: `taller-${taller._id}`, tipo: 'taller', nombre: taller.nombre });
        }
      });
    });

    // 2. Google Calendar Events
    try {
      const eventosGoogle = await googleService.listEvents(fechaInicio, fechaFin);

      eventosGoogle.forEach(gEvento => {
        // Skip available/transparent events
        if (gEvento.transparency === 'transparent') return;
        if (gEvento.status === 'cancelled') return;

        // --- FILTER: Only process Neverland events or manual keyword events ---
        const resumen = (gEvento.summary || '').toUpperCase();
        const turnoEvento = gEvento.extendedProperties?.private?.turno;
        const idReserva = gEvento.extendedProperties?.private?.bookingId;
        const esNeverland = gEvento.extendedProperties?.private?.source === 'neverland' || idReserva;

        // Soporte para palabras clave manuales desde Google Calendar
        const turnoPalabraClave = ['T1', 'T2', 'T3'].find(s => resumen.includes(`#${s}`));
        const tienePalabraClaveGeneral = resumen.includes('#BLOQUEO') || resumen.includes('#NEVERLAND');

        // Ignorar eventos que NO son de Neverland ni tienen palabras clave
        if (!esNeverland && !turnoPalabraClave && !tienePalabraClaveGeneral) return;

        // Los talleres ya se procesaron desde la BD (lineas 609-623).
        // Saltar eventos de GC que sean talleres para evitar duplicados y falsos solapamientos.
        const esTallerGC = gEvento.extendedProperties?.private?.type === 'taller';
        if (esTallerGC) return;

        // Standard ISO 8601 strings work in all JS engines, safeParseDate strips times!
        const inicio = gEvento.start.dateTime ? new Date(gEvento.start.dateTime) : safeParseDate(gEvento.start.date);
        const fin = gEvento.end.dateTime ? new Date(gEvento.end.dateTime) : safeParseDate(gEvento.end.date);

        // Handle All-Day Events (solo si pasó el filtro anterior)
        if (!gEvento.start.dateTime) {
          const turnoABloquear = turnoEvento || turnoPalabraClave;
          let actual = createSafeDate(inicio);
          while (actual < fin) {
            const fechaTexto = toLocalISO(actual);
            // Determinar tipo basado en palabras clave
            const esBloqueoGoogle = resumen.includes('#BLOQUEO');
            const tipoAsignado = esBloqueoGoogle ? 'bloqueo' : (esNeverland ? 'reserva' : 'bloqueo');
            if (turnoABloquear) {
              // Bloquea solo el turno específico - con deduplicación
              const yaExiste = ocupados.some(o => o.date === fechaTexto && o.shift === turnoABloquear);
              if (!yaExiste) {
                ocupados.push({ date: fechaTexto, shift: turnoABloquear, id: idReserva || gEvento.id, tipo: tipoAsignado });
              }
            } else {
              // Bloquea todos los turnos (ej: #BLOQUEO o #NEVERLAND sin turno específico)
              ['T1', 'T2', 'T3'].forEach(turno => {
                const yaExiste = ocupados.some(o => o.date === fechaTexto && o.shift === turno);
                if (!yaExiste) {
                  ocupados.push({ date: fechaTexto, shift: turno, id: idReserva || gEvento.id, tipo: tipoAsignado });
                }
              });
            }
            actual.setDate(actual.getDate() + 1);
          }
          return;
        }

        // Handle Timed Events
        const fechaEventoTexto = toLocalISO(inicio);

        const turnoABloquear = turnoEvento || turnoPalabraClave;
        if (turnoABloquear) {
          // 1. Por metadatos (App) o Palabra Clave específica (#T1, #T2, #T3)
          // Determinar tipo
          const esBloqueoGoogle = resumen.includes('#BLOQUEO');
          const tipoAsignado = esBloqueoGoogle ? 'bloqueo' : (esNeverland ? 'reserva' : 'bloqueo');
          // Bloquea EXCLUSIVAMENTE su propio turno - con deduplicación
          const yaExiste = ocupados.some(o => o.date === fechaEventoTexto && o.shift === turnoABloquear);
          if (!yaExiste) {
            ocupados.push({ date: fechaEventoTexto, shift: turnoABloquear, id: idReserva || gEvento.id, tipo: tipoAsignado });
          }
          return;
        }

        Object.entries(SHIFTS).forEach(([idTurno, tiempo]) => {
          // 2. Por solapamiento horario (evento Neverland/#BLOQUEO SIN turno específico)
          const inicioTurno = createSafeDate(fechaEventoTexto);
          inicioTurno.setHours(tiempo.start[0], tiempo.start[1], 0, 0);

          const finTurno = createSafeDate(fechaEventoTexto);
          finTurno.setHours(tiempo.end[0], tiempo.end[1], 0, 0);

          if (inicio < finTurno && fin > inicioTurno) {
            const esBloqueoGoogle = resumen.includes('#BLOQUEO');
            const tipoAsignado = esBloqueoGoogle ? 'bloqueo' : (esNeverland ? 'reserva' : 'bloqueo');
            // Con deduplicación
            const yaExiste = ocupados.some(o => o.date === fechaEventoTexto && o.shift === idTurno);
            if (!yaExiste) {
              ocupados.push({ date: fechaEventoTexto, shift: idTurno, id: idReserva || gEvento.id, tipo: tipoAsignado });
            }
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
      const turnosOcupados = ocupados
        .filter(o => o.date === fecha);

      // Deduplicate by shift but keep info (though frontend usually only needs shifts)
      res.json({ occupiedShifts: turnosOcupados });
    } else {
      // Return all occupied slots
      res.json({ occupied: ocupados });
    }

  } catch (error) {
    next(error);
  }
};
