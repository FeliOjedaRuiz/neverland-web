const Config = require('../models/config.model');
const createError = require('http-errors');

module.exports.get = (req, res, next) => {
  Config.findOne()
    .then(config => {
      if (!config) {
        // Return default values if no config is found yet
        return res.json({
          preciosNiños: { 1: 9, 2: 9, 3: 10, 4: 12, plusFinDeSemana: 1.5 },
          preciosAdultos: [
            { id: 'salaillas', nombre: 'Salaillas con Jamón', precio: 15, unidades: '10 Unidades' },
            { id: 'tortilla', nombre: 'Tortilla de Patatas', precio: 12, unidades: '1 Unidad' },
            { id: 'saladitos', nombre: 'Saladitos Variados', precio: 16, unidades: '45 Unidades' },
            { id: 'pasteles', nombre: 'Pasteles Surtidos', precio: 16, unidades: '25 Unidades' },
            { id: 'bocadillos', nombre: 'Bocadillos', precio: 14, unidades: '12 Unidades' }
          ],
          workshops: [
            { id: 'pintacaras', name: 'Pintacaras', priceBase: 25, pricePlus: 30, desc: 'Maquillaje de fantasía para todos.' },
            { id: 'slime', name: 'Taller de Slime', priceBase: 25, pricePlus: 30, desc: '¡Creación de slime pegajoso y divertido!' },
            { id: 'magia', name: 'Show de Magia', priceBase: 25, pricePlus: 30, desc: 'Trucos increíbles para sorprender.' }
          ],
          characters: [
            'Mickey', 'Minnie', 'Goofy', 'Donald', 'Daysi', 'Sonic', 'Stich', 'Marshall', 'Sky',
            'Mario', 'Luigi', 'Bella', 'Bestia', 'Cenicienta', 'Príncipe', 'Aladín', 'Jasmín',
            'Blancanieves', 'Elsa', 'Anna', 'Olaf', 'K-Pop', 'Vaina'
          ],
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
