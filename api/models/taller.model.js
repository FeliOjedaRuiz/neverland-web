const mongoose = require('mongoose');

const inscripcionSchema = new mongoose.Schema({
  nombreNiño: { type: String, required: true, maxlength: 100 },
  edadNiño: { type: Number, max: 99 },
  nombreResponsable: { type: String, required: true, maxlength: 100 },
  telefonoResponsable: { type: String, required: true },
  emailResponsable: { type: String, required: true },
  privacyPolicyConsent: { type: Boolean, required: true },
  marketingConsent: { type: Boolean, default: false },
  fechaConsentimiento: { type: Date, default: Date.now }
}, { timestamps: true });

const tallerSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  precio: { type: Number, required: true, min: 0 },
  aforo: { type: Number, required: true, default: 15, min: 1 },
  publico: { type: Boolean, default: false },
  fecha: { type: Date, required: true },
  turnos: [{ type: String, enum: ['T1', 'T2', 'T3'] }],
  horario: {
    inicio: { type: String, required: true },
    fin: { type: String, required: true }
  },
  portada: String,
  galeria: [String],
  inscripciones: [inscripcionSchema],
  googleEventId: String
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

const Taller = mongoose.model('Taller', tallerSchema);

module.exports = Taller;
