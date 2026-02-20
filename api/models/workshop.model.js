const mongoose = require('mongoose');

const workshopSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  duracionMinutos: { type: Number, default: 60 },
  descripcion: String,
  capacidadMaxima: Number,
  precio: { type: Number, required: true },
  requiereExtension: { type: Boolean, default: false },
  diasHabilitados: [String], // Ej: ["Lunes", "Martes"]
  imageUrl: String,
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

const Workshop = mongoose.model('Workshop', workshopSchema);

module.exports = Workshop;
