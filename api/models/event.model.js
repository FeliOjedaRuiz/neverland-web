const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['reserva', 'bloqueo'],
    required: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmado', 'modificada', 'cancelada'],
    default: 'pendiente'
  },
  fecha: {
    type: Date,
    required: true
  }, // Almacenar sin hora o normalizar a medianoche
  turno: {
    type: String,
    enum: ['T1', 'T2', 'T3'],
    required: true
  },

  // Datos de contacto (solo si tipo: 'reserva')
  cliente: {
    nombreNiño: String,
    edadNiño: Number,
    nombrePadre: String,
    telefono: String
  },

  // Configuración del evento
  detalles: {
    niños: {
      cantidad: { type: Number, min: 12 },
      menuId: { type: Number, enum: [1, 2, 3, 4] }
    },
    adultos: [
      {
        item: String, // 'Salaillas', 'Tortilla', etc.
        cantidad: Number,
        precioUnitario: Number
      }
    ],
    extras: {
      taller: { type: String, default: 'ninguno' },
      personaje: { type: String, default: 'ninguno' },
      pinata: { type: Boolean, default: false }
    }
  },

  // Lógica de Tiempos
  horario: {
    inicio: String, // Ej: "16:30"
    fin: String,    // Ej: "19:00"
    extensionMinutos: { type: Number, enum: [0, 30, 60], default: 0 },
    costoExtension: { type: Number, default: 0 }
  },

  // Finanzas y Sincronización
  precioTotal: { type: Number, default: 0 },
  googleEventId: String, // ID devuelto por Google Calendar API
  notasAdmin: String,    // Para uso interno del salón
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

const Event = mongoose.model('Event', eventSchema);

// Prevent double bookings for the same time and shift, unless cancelled
eventSchema.index({ fecha: 1, turno: 1 }, {
  unique: true,
  partialFilterExpression: { estado: { $ne: 'cancelada' } }
});

module.exports = Event;
