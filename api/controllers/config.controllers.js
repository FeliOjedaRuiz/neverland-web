const Config = require('../models/config.model');
const createError = require('http-errors');

module.exports.get = (req, res, next) => {
  Config.findOne()
    .then(config => {
      const defaults = {
        menusNiños: [
          { id: 1, nombre: 'Menú 1', precio: 9, principal: 'Sandwiches ( 2 1/2 ) dulce o salado', resto: '-Zumo, batido o refresco\n-Tarta\n-Cono de chuches' },
          { id: 2, nombre: 'Menú 2', precio: 9, principal: 'Perrito caliente', resto: '-Zumo, batido o refresco\n-Tarta\n-Cono de chuches' },
          { id: 3, nombre: 'Menú 3', precio: 10, principal: 'Porción de pizza', resto: '-Zumo, batido o refresco\n-Tarta\n-Cono de chuches' },
          { id: 4, nombre: 'Menú 4', precio: 12, principal: 'Hamburguesa', resto: '-Zumo, batido o refresco\n-Tarta\n-Cono de chuches' }
        ],
        plusFinDeSemana: 1.5,
        preciosAdultos: [
          { id: 'salaillas', nombre: 'Salaillas con Jamón', precio: 15, unidades: '10 Unidades' },
          { id: 'tortilla', nombre: 'Tortilla de Patatas', precio: 12, unidades: '1 Unidad' },
          { id: 'saladitos', nombre: 'Saladitos Variados', precio: 16, unidades: '45 Unidades' },
          { id: 'pasteles', nombre: 'Pasteles Surtidos', precio: 16, unidades: '25 Unidades' },
          { id: 'bocadillos', nombre: 'Bocadillos', precio: 14, unidades: '12 Unidades' }
        ],
        workshops: [
          { id: 'pintacaras', name: 'Pintacaras', priceBase: 25, pricePlus: 30, desc: 'Maquillaje de fantasía para todos.', imageUrl: '/src/assets/images/face_painting.png' },
          { id: 'slime', name: 'Taller de Slime', priceBase: 25, pricePlus: 30, desc: '¡Creación de slime pegajoso y divertido!', imageUrl: '/src/assets/images/slime.png' },
          { id: 'magia', name: 'Show de Magia', priceBase: 25, pricePlus: 30, desc: 'Trucos increíbles para sorprender.', imageUrl: '/src/assets/images/magic.png' }
        ],
        characters: [
          'Mickey', 'Minnie', 'Goofy', 'Donald', 'Daysi', 'Sonic', 'Stich', 'Marshall', 'Sky',
          'Mario', 'Luigi', 'Bella', 'Bestia', 'Cenicienta', 'Príncipe', 'Aladín', 'Jasmín',
          'Blancanieves', 'Elsa', 'Anna', 'Olaf', 'K-Pop', 'Vaina'
        ],
        preciosExtras: { tallerBase: 25, tallerPlus: 30, personaje: 40, pinata: 15, extension30: 30, extension60: 50 }
      };

      if (!config) {
        return res.json(defaults);
      }

      const configObj = config.toJSON();

      // If the existing config has an empty or missing menusNiños, provide defaults
      if (!configObj.menusNiños || configObj.menusNiños.length === 0) {
        configObj.menusNiños = defaults.menusNiños;
      }

      res.json(configObj);
    })
    .catch(next);
};

module.exports.update = (req, res, next) => {
  Config.findOneAndUpdate({}, req.body, { new: true, upsert: true, runValidators: true })
    .then(config => res.json(config))
    .catch(next);
};
