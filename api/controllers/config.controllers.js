const Config = require('../models/config.model');
const createError = require('http-errors');

module.exports.get = (req, res, next) => {
  Config.findOne()
    .then(config => {
      if (!config) {
        // Return default values if no config is found yet
        return res.json({
          preciosNiños: { 1: 9, 2: 9, 3: 10, 4: 12, plusFinDeSemana: 1.5 },
          preciosAdultos: [],
          preciosExtras: { tallerBase: 25, tallerPlus: 30, personaje: 40, pinata: 15, extension30: 30, extension60: 50 }
        });
      }
      res.json(config);
    })
    .catch(next);
};

module.exports.update = (req, res, next) => {
  Config.findOneAndUpdate({}, req.body, { new: true, upsert: true, runValidators: true })
    .then(config => res.json(config))
    .catch(next);
};
