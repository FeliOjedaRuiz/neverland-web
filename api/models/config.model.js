const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  menusNiños: [
    {
      id: mongoose.Schema.Types.Mixed, // Can be Number (1, 2, 3...) or String (MongoDB ID)
      nombre: String,
      precio: Number,
      principal: String,
      resto: String, // Multiline text for other items
      active: { type: Boolean, default: true } // [NEW] Soft delete
    }
  ],
  plusFinDeSemana: { type: Number, default: 1.5 },
  preciosAdultos: [
    {
      id: String,
      nombre: String,
      precio: Number,
      unidades: String, // Ej: "10 unidades por ración"
      active: { type: Boolean, default: true } // [NEW] Soft delete
    }
  ],
  workshops: [
    {
      id: String,
      name: String,
      priceBase: Number,
      pricePlus: Number,
      desc: String,
      imageUrl: String,
      active: { type: Boolean, default: true } // [NEW] Soft delete
    }
  ],
  characters: [String], // Simple list of names
  preciosExtras: {
    tallerBase: { type: Number, default: 25 }, // Hasta 15 niños
    tallerPlus: { type: Number, default: 30 }, // 16 o más
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
