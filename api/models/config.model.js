const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  preciosNiños: {
    1: { type: Number, default: 9 },
    2: { type: Number, default: 9 },
    3: { type: Number, default: 10 },
    4: { type: Number, default: 12 },
    plusFinDeSemana: { type: Number, default: 1.5 }
  },
  preciosAdultos: [
    {
      id: String,
      nombre: String,
      precio: Number,
      unidades: String // Ej: "10 unidades por ración"
    }
  ],
  workshops: [
    {
      id: String,
      name: String,
      priceBase: Number,
      pricePlus: Number,
      desc: String
    }
  ],
  characters: [String], // Simple list of names
  preciosExtras: {
    tallerBase: { type: Number, default: 25 }, // Hasta 25 niños
    tallerPlus: { type: Number, default: 30 }, // 26 o más
    personaje: { type: Number, default: 40 },
    pinata: { type: Number, default: 15 },
    extension30: { type: Number, default: 30 },
    extension60: { type: Number, default: 50 }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

const Config = mongoose.model('Config', configSchema);

module.exports = Config;
