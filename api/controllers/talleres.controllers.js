const Taller = require('../models/taller.model');
const Event = require('../models/event.model');
const createError = require('http-errors');
const cloudinary = require('cloudinary').v2;
const googleService = require('../services/google.service');
const mailer = require('../config/mailer.config');
const { safeParseDate, getSafeNow, isTallerIniciado } = require('../utils/date');

module.exports.list = async (req, res, next) => {
  try {
    const esAdmin = req.user && req.user.role === 'admin';
    const { publico: parametroPublico, talleresProximos } = req.query;
    const consulta = {};

    // Filtro de visibilidad
    if (!esAdmin) {
      // Público: solo talleres publicados
      consulta.publico = true;
    } else if (parametroPublico === 'true') {
      consulta.publico = true;
    }

    let talleres = await Taller.find(consulta).sort({ fecha: 1, 'horario.inicio': 1 });

    // Aplicar limite si se solicita
    const limite = parseInt(req.query.limite) || 0;

    // Filtrar talleres ya iniciados (fecha + horario.inicio en hora española ya pasó).
    // Un taller sigue visible/librable HASTA su hora de inicio y desaparece en ese instante.
    // El parámetro 'incluirPasados' permite a la home mostrar pasados para rellenar slots
    const incluirPasados = req.query.incluirPasados === 'true';
    if ((!esAdmin && !incluirPasados) || talleresProximos === 'true') {
      const ahora = getSafeNow();
      talleres = talleres.filter(taller => !isTallerIniciado(taller, ahora));
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
    const WEB_URL = process.env.WEB_URL || 'http://localhost:5173';

    if (!email) {
      return res.redirect(302, `${WEB_URL}/talleres/cancelacion?exitosa=false&error=email_no_valido`);
    }

    // Buscar la inscripción específica (proyección para traer solo esa)
    const taller = await Taller.findOne(
      { _id: req.params.id, 'inscripciones._id': req.params.inscripcionId },
      { nombre: 1, inscripciones: 1 }
    );

    if (!taller || !taller.inscripciones || taller.inscripciones.length === 0) {
      return res.redirect(302, `${WEB_URL}/talleres/cancelacion?exitosa=false&error=error`);
    }

    const inscripcion = taller.inscripciones[0];

    // Verificar email (case-insensitive)
    if (inscripcion.emailResponsable.toLowerCase() !== email.toLowerCase()) {
      return res.redirect(302, `${WEB_URL}/talleres/cancelacion?exitosa=false&error=email_no_valido`);
    }

    // Eliminación atómica
    const tallerActualizado = await Taller.findOneAndUpdate(
      { _id: req.params.id },
      { $pull: { inscripciones: { _id: req.params.inscripcionId } } },
      { new: true }
    );

    // Actualizar Google Calendar con la lista actualizada de inscriptos
    if (tallerActualizado && tallerActualizado.googleEventId) {
      try {
        await googleService.createTallerCalendarEvent(tallerActualizado);
      } catch (errorGoogle) {
        console.error('Falló la sincronización con Google Calendar al cancelar la inscripción del taller:', errorGoogle);
      }
    }

    // Redirigir a página de confirmación en frontend
    res.redirect(302, `${WEB_URL}/talleres/cancelacion?exitosa=true&taller=${encodeURIComponent(taller.nombre)}&nino=${encodeURIComponent(inscripcion.nombreNiño)}`);
  } catch (error) {
    const WEB_URL = process.env.WEB_URL || 'http://localhost:5173';
    res.redirect(302, `${WEB_URL}/talleres/cancelacion?exitosa=false&error=error`);
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
        } catch (errorGoogle) {
          console.error('Error eliminando evento de Google Calendar para bloqueo:', errorGoogle);
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

    // Sincronización con Google Calendar
    try {
      const eventoGoogle = await googleService.createTallerCalendarEvent(taller);
      if (eventoGoogle?.id) {
        taller.googleEventId = eventoGoogle.id;
        await taller.save();
      }
    } catch (errorGoogle) {
      console.error('Falló la sincronización con Google Calendar al crear el taller:', errorGoogle);
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
          } catch (errorGoogle) {
            console.error('Error eliminando bloqueo de Google Calendar:', errorGoogle);
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
        const eventoGoogle = await googleService.createTallerCalendarEvent(taller);
        if (eventoGoogle?.id && !taller.googleEventId) {
          taller.googleEventId = eventoGoogle.id;
          await taller.save();
        }
      } catch (errorGoogle) {
        console.error('Falló la sincronización con Google Calendar al actualizar el taller:', errorGoogle);
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

    // Público: un taller sin publicar no es accesible, ni siquiera por URL directa
    if (!taller.publico) throw createError(404, 'Taller no encontrado');

    // Público: solo datos públicos, NUNCA datos de inscripciones
    const datosPublicos = {
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

    res.json(datosPublicos);
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
      } catch (errorGoogle) {
        console.error('Error eliminando evento de Google Calendar:', errorGoogle);
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
      privacyPolicyConsent: consentimientoPrivacidad,
      marketingConsent: consentimientoMarketing
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

    if (!consentimientoPrivacidad) {
      throw createError(400, 'Debes aceptar la política de privacidad');
    }

    // Validar email
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(emailResponsable)) {
      throw createError(400, 'Email inválido');
    }

    // Validar teléfono (mínimo 9 dígitos)
    const digitosTelefono = (telefonoResponsable.match(/\d/g) || []).length;
    if (digitosTelefono < 9) {
      throw createError(400, 'Teléfono inválido (mínimo 9 dígitos)');
    }

    // Verificar disponibilidad ANTES del push atómico: el taller debe existir,
    // estar publicado y no haber comenzado todavía.
    const tallerDoc = await Taller.findById(req.params.id);
    if (!tallerDoc) throw createError(404, 'Taller no encontrado');
    if (!tallerDoc.publico) throw createError(409, 'El taller no está disponible');
    if (isTallerIniciado(tallerDoc, getSafeNow())) {
      throw createError(409, 'El taller ya ha comenzado y no admite más inscripciones');
    }

    // Inscripción atómica con validación de aforo
    const datosInscripcion = {
      nombreNiño,
      edadNiño,
      nombreResponsable,
      telefonoResponsable,
      emailResponsable,
      privacyPolicyConsent: consentimientoPrivacidad,
      marketingConsent: consentimientoMarketing || false,
      fechaConsentimiento: getSafeNow(),
      // Toda inscripción nace SIN pagar: el pago del taller por transferencia
      // lo verifica y marca el admin desde el panel (defensa en profundidad:
      // aunque el payload trajera `pagoTaller`, aquí se pone a false a mano).
      pagoTaller: false
    };

    const resultado = await Taller.findOneAndUpdate(
      {
        _id: req.params.id,
        publico: true,
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
    } catch (errorCorreo) {
      console.error('Falló el envío del email de confirmación del taller:', errorCorreo);
    }

    // Actualizar Google Calendar con la nueva lista de inscriptos
    if (resultado.googleEventId) {
      try {
        await googleService.createTallerCalendarEvent(resultado);
      } catch (errorGoogle) {
        console.error('Falló la sincronización con Google Calendar al inscribir en el taller:', errorGoogle);
      }
    }

    // Devolver datos públicos + flag de éxito
    const datosPublicos = {
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

    res.status(201).json(datosPublicos);
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

    // Actualizar Google Calendar con la lista actualizada de inscriptos
    if (taller.googleEventId) {
      try {
        await googleService.createTallerCalendarEvent(taller);
      } catch (errorGoogle) {
        console.error('Falló la sincronización con Google Calendar al eliminar la inscripción del taller:', errorGoogle);
      }
    }

    res.json(taller);
  } catch (error) {
    next(error);
  }
};

module.exports.editarInscripcion = async (req, res, next) => {
  try {
    const { nombreNiño, edadNiño, nombreResponsable, telefonoResponsable, emailResponsable } = req.body;

    // --- PERMISOS del estado de pago (defensa en profundidad) ---
    // La ruta PATCH /talleres/:id/inscripciones/:inscripcionId lleva
    // `secure.isAdmin` DESDE SU CREACIÓN (commit 8cfd0c9), así que en la
    // práctica un no-admin recibe 401 del middleware y NUNCA llega a este
    // controller. Este guard queda como defensa en profundidad: protege la
    // invariante de que `pagoTaller` solo lo escribe el admin, aunque mañana
    // alguien cambiara la ruta a `optionalAuth` (misma estrategia que
    // `pagoReserva` en events.controllers.js, donde la ruta SÍ es opcional y
    // el 403 es alcanzable por HTTP).
    const esAdmin = req.user && req.user.role === 'admin';

    if (!esAdmin) {
      // Booleano: se comprueba `!== undefined` (no truthiness, porque `false`
      // también es un intento de cambio).
      if (req.body.pagoTaller !== undefined) {
        throw createError(403, 'No tienes permiso para cambiar el estado de pago del taller');
      }

      // `pagoTallerFecha` es un campo derivado que solo estampa el servidor
      // al cambiar el booleano (abajo): un no-admin no debe poder escribirla,
      // ni para falsificar la conciliación banco↔web.
      if (req.body.pagoTallerFecha !== undefined && req.body.pagoTallerFecha !== null) {
        throw createError(403, 'No tienes permiso para modificar la fecha de pago');
      }
    }

    // `pagoTallerFecha` es un DERIVADO de `pagoTaller`: SOLO el servidor la
    // estampa. Se elimina del payload ANTES de aplicarlo para que ningún
    // request (ni siquiera de un admin) pueda fijar una fecha arbitraria: la
    // fecha de conciliación banco↔web tiene que ser fiable. Mismo patrón que
    // `pagoReservaFecha` en events.controllers.js (commit 9af8599 de esta
    // rama); para los no-admin, el guard de arriba ya devuelve 403 antes.
    delete req.body.pagoTallerFecha;

    const taller = await Taller.findOne({ _id: req.params.id, 'inscripciones._id': req.params.inscripcionId });
    if (!taller) throw createError(404, 'Taller o inscripción no encontrado');

    const inscripcion = taller.inscripciones.id(req.params.inscripcionId);
    if (!inscripcion) throw createError(404, 'Inscripción no encontrada');

    if (nombreNiño !== undefined) inscripcion.nombreNiño = nombreNiño;
    if (edadNiño !== undefined) inscripcion.edadNiño = edadNiño;
    if (nombreResponsable !== undefined) inscripcion.nombreResponsable = nombreResponsable;
    if (telefonoResponsable !== undefined) inscripcion.telefonoResponsable = telefonoResponsable;
    if (emailResponsable !== undefined) inscripcion.emailResponsable = emailResponsable;

    // Estado de pago: al marcar pagado se estampa "ahora"; al desmarcar se
    // limpia para no dejar la fecha de un pago anterior. Solo se actúa si el
    // valor CAMBIA de verdad (reenviar el mismo valor no restampa la fecha).
    // El toggle NO toca `precio` ni `aforo` del taller: vive en el
    // subdocumento de la inscripción (cubierto en pago-taller.test.js).
    if (req.body.pagoTaller !== undefined && req.body.pagoTaller !== inscripcion.pagoTaller) {
      inscripcion.pagoTaller = req.body.pagoTaller;
      inscripcion.pagoTallerFecha = req.body.pagoTaller ? getSafeNow() : undefined;
    }

    await taller.save();

    // Actualizar Google Calendar con los datos editados de la inscripción
    if (taller.googleEventId) {
      try {
        await googleService.createTallerCalendarEvent(taller);
      } catch (errorGoogle) {
        console.error('Falló la sincronización con Google Calendar al editar la inscripción del taller:', errorGoogle);
      }
    }

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

/**
 * Elimina una imagen de Cloudinary dado su public_id.
 * Espera { imageUrl } en el body. Extrae el public_id de la URL.
 */
module.exports.deleteImage = async (req, res, next) => {
  try {
    const { imageUrl: urlImagen } = req.body;
    if (!urlImagen) throw createError(400, 'Se requiere imageUrl');

    // Parsear URL de Cloudinary para extraer public_id de forma robusta
    // Formato: https://res.cloudinary.com/{cloud}/image/upload/[{transforms}/][v{version}/]{public_id}.{ext}
    const url = new URL(urlImagen);
    const partesRuta = url.pathname.split('/');
    const indiceSubida = partesRuta.indexOf('upload');
    if (indiceSubida === -1) throw createError(400, 'URL de Cloudinary no válida');

    // Después de 'upload': filtrar segmentos de versión (v1234567890), el resto es el public_id
    const idPublico = partesRuta
      .slice(indiceSubida + 1)
      .filter((p) => !/^v\d+$/.test(p))
      .join('/')
      .replace(/\.[^.]+$/, ''); // quitar extensión

    if (!idPublico) throw createError(400, 'No se pudo extraer public_id de la URL');

    const resultado = await cloudinary.uploader.destroy(idPublico);

    // 'ok' = eliminada, 'not found' = ya no existía → ambos son éxito
    if (resultado.result === 'ok' || resultado.result === 'not found') {
      res.json({ success: true, publicId: idPublico });
    } else {
      throw createError(500, `Cloudinary respondió: ${resultado.result}`);
    }
  } catch (error) {
    next(error);
  }
};
