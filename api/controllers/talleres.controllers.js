const Taller = require('../models/taller.model');
const Event = require('../models/event.model');
const createError = require('http-errors');
const googleService = require('../services/google.service');
const mailer = require('../config/mailer.config');
const { safeParseDate, getSafeNow } = require('../utils/date');

module.exports.list = async (req, res, next) => {
  try {
    const esAdmin = req.user && req.user.role === 'admin';
    const { publico: publicoParam, talleresProximos } = req.query;
    const query = {};

    // Filtro de visibilidad
    if (!esAdmin) {
      // Público: solo talleres publicados
      query.publico = true;
    } else if (publicoParam === 'true') {
      query.publico = true;
    }

    let talleres = await Taller.find(query).sort({ fecha: 1, 'horario.inicio': 1 });

    // Aplicar limite si se solicita
    const limite = parseInt(req.query.limite) || 0;

    // Filtrar talleres pasados (fecha + horario.fin ya pasó, hora española)
    if (!esAdmin || talleresProximos === 'true') {
      const ahora = getSafeNow();
      talleres = talleres.filter(taller => {
        if (!taller.horario?.fin) return true;
        const fechaFinTaller = safeParseDate(taller.fecha);
        const [h, m] = taller.horario.fin.split(':').map(Number);
        fechaFinTaller.setHours(h, m, 0, 0);
        return fechaFinTaller >= ahora;
      });
    }

    // Aplicar limite después del filtrado
    const resultado = limite > 0 ? talleres.slice(0, limite) : talleres;
    return res.json(resultado);
  } catch (error) {
    next(error);
  }
};

module.exports.cancelarInscripcion = async (req, res, next) => {
  try {
    const { email } = req.query;
    const taller = await Taller.findById(req.params.id);
    if (!taller) throw createError(404, 'Taller no encontrado');

    // Buscar inscripción por _id
    const inscripcion = taller.inscripciones.id(req.params.inscripcionId);
    if (!inscripcion) throw createError(404, 'Inscripción no encontrada');

    // Verificar email
    if (!email || inscripcion.emailResponsable.toLowerCase() !== email.toLowerCase()) {
      throw createError(403, 'Email no válido para cancelar esta inscripción');
    }

    // Eliminar inscripción
    await Taller.findByIdAndUpdate(
      req.params.id,
      { $pull: { inscripciones: { _id: req.params.inscripcionId } } }
    );

    // Redirigir a página de confirmación en frontend
    const WEB_URL = process.env.WEB_URL || 'http://localhost:5173';
    res.redirect(301, `${WEB_URL}/talleres/cancelacion?exitosa=true&taller=${encodeURIComponent(taller.nombre)}&nino=${encodeURIComponent(inscripcion.nombreNiño)}`);
  } catch (error) {
    // Si hay error, redirigir a frontend con mensaje de error
    const WEB_URL = process.env.WEB_URL || 'http://localhost:5173';
    const msg = error.status === 403 ? 'email_no_valido' : 'error';
    res.redirect(301, `${WEB_URL}/talleres/cancelacion?exitosa=false&error=${msg}`);
  }
};

module.exports.create = async (req, res, next) => {
  try {
    const { nombre, descripcion, precio, aforo, fecha, turnos, horario, portada, galeria } = req.body;

    // Validaciones de campos requeridos
    if (!nombre || precio === undefined || precio === null || !fecha || !turnos || turnos.length === 0) {
      throw createError(400, 'Campos requeridos: nombre, precio, fecha, turnos');
    }

    if (!horario?.inicio || !horario?.fin) {
      throw createError(400, 'El horario (inicio y fin) es requerido');
    }

    // Validar que no exista otro taller en la misma fecha y turnos que se solapen
    const tallerExistente = await Taller.find({
      fecha,
      turnos: { $in: turnos }
    });
    if (tallerExistente.length > 0) {
      throw createError(409, 'Ya existe un taller en esa fecha con turnos que se solapan');
    }

    // Reemplazar bloqueos existentes
    const bloqueos = await Event.find({
      fecha,
      turno: { $in: turnos },
      tipo: 'bloqueo'
    });

    for (const bloqueo of bloqueos) {
      if (bloqueo.googleEventId) {
        try {
          await googleService.deleteCalendarEvent(bloqueo.googleEventId);
        } catch (gErr) {
          console.error('Error eliminando evento de Google Calendar para bloqueo:', gErr);
        }
      }
      await Event.findByIdAndDelete(bloqueo._id);
    }

    // Crear el taller
    const taller = await Taller.create({
      nombre,
      descripcion,
      precio,
      aforo: aforo || 15,
      publico: false,
      fecha,
      turnos,
      horario,
      portada,
      galeria: galeria || []
    });

    // Google Calendar sync
    try {
      const gEvento = await googleService.createTallerCalendarEvent(taller);
      if (gEvento?.id) {
        taller.googleEventId = gEvento.id;
        await taller.save();
      }
    } catch (gErr) {
      console.error('Google Calendar sync failed during taller creation:', gErr);
    }

    return res.status(201).json(taller);
  } catch (error) {
    next(error);
  }
};

module.exports.update = async (req, res, next) => {
  try {
    const taller = await Taller.findById(req.params.id);
    if (!taller) throw createError(404, 'Taller no encontrado');

    const { fecha, turnos, horario } = req.body;

    // Si cambia fecha o turnos: re-validar que no haya conflictos con otros talleres
    const fechaCambia = fecha && fecha !== taller.fecha.toISOString().split('T')[0] &&
      safeParseDate(fecha).getTime() !== taller.fecha.getTime();

    const turnosCambian = turnos && JSON.stringify(turnos.sort()) !== JSON.stringify(taller.turnos.sort());

    if (fechaCambia || turnosCambian) {
      const newFecha = fecha || taller.fecha;
      const newTurnos = turnos || taller.turnos;

      const conflicto = await Taller.find({
        _id: { $ne: taller._id },
        fecha: newFecha,
        turnos: { $in: newTurnos }
      });
      if (conflicto.length > 0) {
        throw createError(409, 'Ya existe otro taller en esa fecha con turnos que se solapan');
      }
    }

    // Si cambian turnos, gestionar reemplazo de bloqueos
    if (turnosCambian) {
      const bloqueos = await Event.find({
        fecha: fecha || taller.fecha,
        turno: { $in: turnos },
        tipo: 'bloqueo'
      });
      for (const bloqueo of bloqueos) {
        if (bloqueo.googleEventId) {
          try {
            await googleService.deleteCalendarEvent(bloqueo.googleEventId);
          } catch (gErr) {
            console.error('Error eliminando bloqueo de Google Calendar:', gErr);
          }
        }
        await Event.findByIdAndDelete(bloqueo._id);
      }
    }

    // Actualizar campos (proteger inscripciones de sobreescritura)
    const updates = { ...req.body };
    delete updates.inscripciones;
    taller.set(updates);
    await taller.save();

    // Resincronizar Google Calendar si cambió fecha/horario
    if (fechaCambia || turnosCambian || horario) {
      try {
        const gEvento = await googleService.createTallerCalendarEvent(taller);
        if (gEvento?.id && !taller.googleEventId) {
          taller.googleEventId = gEvento.id;
          await taller.save();
        }
      } catch (gErr) {
        console.error('Google Calendar sync failed during taller update:', gErr);
      }
    }

    res.json(taller);
  } catch (error) {
    next(error);
  }
};

module.exports.detail = async (req, res, next) => {
  try {
    const taller = await Taller.findById(req.params.id);
    if (!taller) throw createError(404, 'Taller no encontrado');

    const esAdmin = req.user && req.user.role === 'admin';

    if (esAdmin) {
      return res.json(taller);
    }

    // Público: solo datos públicos, NUNCA datos de inscripciones
    const publicData = {
      id: taller.id,
      nombre: taller.nombre,
      descripcion: taller.descripcion,
      precio: taller.precio,
      aforo: taller.aforo,
      fecha: taller.fecha,
      turnos: taller.turnos,
      horario: taller.horario,
      portada: taller.portada,
      galeria: taller.galeria,
      publico: taller.publico,
      numInscripciones: taller.inscripciones ? taller.inscripciones.length : 0,
      createdAt: taller.createdAt,
      updatedAt: taller.updatedAt
    };

    res.json(publicData);
  } catch (error) {
    next(error);
  }
};

module.exports.delete = async (req, res, next) => {
  try {
    const taller = await Taller.findByIdAndDelete(req.params.id);
    if (!taller) throw createError(404, 'Taller no encontrado');

    // Eliminar evento de Google Calendar si existe
    if (taller.googleEventId) {
      try {
        await googleService.deleteCalendarEvent(taller.googleEventId);
      } catch (gErr) {
        console.error('Error eliminando evento de Google Calendar:', gErr);
      }
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports.inscribir = async (req, res, next) => {
  try {
    const {
      nombreNiño,
      edadNiño,
      nombreResponsable,
      telefonoResponsable,
      emailResponsable,
      privacyPolicyConsent,
      marketingConsent
    } = req.body;

    // Validaciones
    if (!nombreNiño || !nombreResponsable || !telefonoResponsable || !emailResponsable) {
      throw createError(400, 'Campos requeridos: nombreNiño, nombreResponsable, telefonoResponsable, emailResponsable');
    }

    if (nombreNiño.length > 100) throw createError(400, 'Nombre del niño demasiado largo (máx 100)');
    if (nombreResponsable.length > 100) throw createError(400, 'Nombre del responsable demasiado largo (máx 100)');

    if (edadNiño !== undefined && edadNiño !== null && edadNiño > 99) {
      throw createError(400, 'La edad debe ser de máximo 2 cifras');
    }

    if (!privacyPolicyConsent) {
      throw createError(400, 'Debes aceptar la política de privacidad');
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailResponsable)) {
      throw createError(400, 'Email inválido');
    }

    // Validar teléfono (mínimo 9 dígitos)
    const phoneDigits = (telefonoResponsable.match(/\d/g) || []).length;
    if (phoneDigits < 9) {
      throw createError(400, 'Teléfono inválido (mínimo 9 dígitos)');
    }

    // Inscripción atómica con validación de aforo
    const datosInscripcion = {
      nombreNiño,
      edadNiño,
      nombreResponsable,
      telefonoResponsable,
      emailResponsable,
      privacyPolicyConsent,
      marketingConsent: marketingConsent || false,
      fechaConsentimiento: new Date()
    };

    const resultado = await Taller.findOneAndUpdate(
      {
        _id: req.params.id,
        publico: true,
        fecha: { $gte: getSafeNow() },
        $expr: { $lt: [{ $size: '$inscripciones' }, '$aforo'] }
      },
      { $push: { inscripciones: datosInscripcion } },
      { new: true }
    );

    if (!resultado) {
      throw createError(409, 'Aforo completo o taller no disponible');
    }

    // Obtener la inscripción recién añadida
    const nuevaInscripcion = resultado.inscripciones[resultado.inscripciones.length - 1];

    // Enviar email de confirmación
    try {
      await mailer.sendTallerConfirmationEmail(resultado, nuevaInscripcion);
    } catch (mErr) {
      console.error('Taller confirmation email failed:', mErr);
    }

    // Devolver datos públicos + flag de éxito
    const publicData = {
      id: resultado.id,
      nombre: resultado.nombre,
      descripcion: resultado.descripcion,
      precio: resultado.precio,
      aforo: resultado.aforo,
      fecha: resultado.fecha,
      turnos: resultado.turnos,
      horario: resultado.horario,
      portada: resultado.portada,
      galeria: resultado.galeria,
      publico: resultado.publico,
      numInscripciones: resultado.inscripciones.length,
      inscripcionExitosa: true
    };

    res.status(201).json(publicData);
  } catch (error) {
    next(error);
  }
};

module.exports.eliminarInscripcion = async (req, res, next) => {
  try {
    const taller = await Taller.findByIdAndUpdate(
      req.params.id,
      { $pull: { inscripciones: { _id: req.params.inscripcionId } } },
      { new: true }
    );

    if (!taller) throw createError(404, 'Taller no encontrado');

    res.json(taller);
  } catch (error) {
    next(error);
  }
};

module.exports.upload = async (req, res, next) => {
  try {
    if (!req.file) {
      throw createError(400, 'No se ha proporcionado ninguna imagen');
    }

    res.json({ imageUrl: req.file.path });
  } catch (error) {
    next(error);
  }
};
