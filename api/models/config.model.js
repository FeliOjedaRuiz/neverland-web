const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  menusNiños: [
    {
      id: mongoose.Schema.Types.Mixed, // Can be Number (1, 2, 3...) or String (MongoDB ID)
      nombre: String,
      precio: Number,
      principal: String,
      resto: String, // Multiline text for other items
      imageUrl: String,
      suspended: { type: Boolean, default: false },
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
      imageUrl: String,
      suspended: { type: Boolean, default: false },
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
      suspended: { type: Boolean, default: false },
      active: { type: Boolean, default: true }
    }
  ],
  characters: [
    {
      id: String,
      name: String,
      imageUrl: String,
      suspended: { type: Boolean, default: false },
      active: { type: Boolean, default: true }
    }
  ],
  preciosExtras: {
    tallerBase: { type: Number, default: 25 },
    tallerPlus: { type: Number, default: 30 },
    personaje: { type: Number, default: 40 },
    precioPack3Personajes: { type: Number, default: 100 },
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
