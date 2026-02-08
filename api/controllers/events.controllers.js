const Event = require('../models/event.model');
const createError = require('http-errors');
const googleService = require('../services/google.service');

module.exports.create = (req, res, next) => {
  const { tipo, fecha, turno } = req.body;

  // Basic availability check (simplified for now)
  Event.findOne({ fecha, turno, estado: { $ne: 'cancelada' } })
    .then(event => {
      if (event && tipo === 'reserva') {
        return next(createError(409, 'Este turno ya está ocupado'));
      }

      return Event.create(req.body)
        .then(async (event) => {
          // Sync with Google Calendar
          await googleService.createCalendarEvent(event);
          return res.status(201).json(event);
        })
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
  Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .then(event => {
      if (!event) return next(createError(404, 'Evento no encontrado'));
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

module.exports.checkAvailability = (req, res, next) => {
  const { fecha, year, month } = req.query;

  // Single Day Check
  if (fecha) {
    return Event.find({ fecha, estado: { $ne: 'cancelada' } })
      .then(events => {
        const occupiedShifts = events.map(e => e.turno);
        res.json({ occupiedShifts });
      })
      .catch(next);
  }

  // Monthly Check
  if (year && month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59); // End of month

    return Event.find({
      fecha: { $gte: startDate, $lte: endDate },
      estado: { $ne: 'cancelada' }
    })
      .then(events => {
        // Return array of { date: 'YYYY-MM-DD', shift: 'T1' }
        const occupied = events.map(e => ({
          date: e.fecha.toISOString().split('T')[0],
          shift: e.turno
        }));
        res.json({ occupied });
      })
      .catch(next);
  }

  next(createError(400, 'Fecha o Año/Mes requeridos'));
};
