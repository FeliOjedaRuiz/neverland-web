const Workshop = require('../models/workshop.model');
const createError = require('http-errors');

module.exports.list = (req, res, next) => {
  Workshop.find()
    .then(workshops => res.json(workshops))
    .catch(next);
};

module.exports.create = (req, res, next) => {
  Workshop.create(req.body)
    .then(workshop => res.status(201).json(workshop))
    .catch(next);
};

module.exports.update = (req, res, next) => {
  Workshop.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .then(workshop => {
      if (!workshop) return next(createError(404, 'Taller no encontrado'));
      res.json(workshop);
    })
    .catch(next);
};

module.exports.delete = (req, res, next) => {
  Workshop.findByIdAndDelete(req.params.id)
    .then(workshop => {
      if (!workshop) return next(createError(404, 'Taller no encontrado'));
      res.status(204).send();
    })
    .catch(next);
};
