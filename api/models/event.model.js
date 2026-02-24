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
    telefono: String,
    email: String
  },

  // Configuración del evento
  detalles: {
    niños: {
      cantidad: { type: Number, min: 12 },
      menuId: { type: String },
      precioApplied: { type: Number } // [NEW] Snapshot of the menu price per child
    },
    adultos: {
      cantidad: { type: Number, default: 0 },
      comida: [
        {
          item: String, // 'Salaillas', 'Tortilla', etc.
          cantidad: Number,
          precioUnitario: Number
        }
      ]
    },
    extras: {
      taller: { type: String, default: 'ninguno' },
      precioTallerApplied: { type: Number }, // [NEW] Snapshot
      personaje: { type: String, default: 'ninguno' },
      precioPersonajeApplied: { type: Number }, // [NEW] Snapshot
      pinata: { type: Boolean, default: false },
      precioPinataApplied: { type: Number }, // [NEW] Snapshot
      observaciones: { type: String, default: '', maxlength: 500 }
    }
  },

  // Lógica de Tiempos
  horario: {
    inicio: String, // Ej: "16:30"
    fin: String,    // Ej: "19:00"
    extensionMinutos: { type: Number, enum: [0, 30, 60], default: 0 },
    costoExtension: { type: Number, default: 0 } // This already acted as a snapshot, keeping it.
  },

  // Finanzas y Sincronización
  precioTotal: { type: Number, default: 0 },
  publicId: { type: String, unique: true },
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

// Generate a random 6-character alphanumeric publicId
eventSchema.pre('save', async function (next) {
  if (this.isNew && !this.publicId) {
    let isUnique = false;
    let newId;
    while (!isUnique) {
      newId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existing = await mongoose.models.Event.findOne({ publicId: newId });
      if (!existing) isUnique = true;
    }
    this.publicId = newId;
  }
  next();
});

// Prevent double bookings for the same time and shift, unless cancelled
eventSchema.index({ fecha: 1, turno: 1 }, {
  unique: true,
  partialFilterExpression: { estado: { $ne: 'cancelada' } }
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
