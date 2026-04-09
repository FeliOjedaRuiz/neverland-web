# 🌌 NEVERLAND WEB APP: THE SOURCE OF TRUTH (CONTEXT V3.0) 🚀

> **STATUS**: FULL SYNC (Includes Mailer Engine)
> **CONTAINS**: DNA, Schemas, Pricing Algorithms, Calendar Sync, and Notification Templates.

---

## 🏗️ SECCIÓN 1: EL ALMA Y LA VISIÓN (NARRATIVA)

### 📄 FILE: `ens.md`
Neverland es un salón de celebraciones infantiles (Granada, España) que ha evolucionado de una gestión manual por WhatsApp a una plataforma digital automatizada.

**Core Values:**
- **Automatización**: El sistema trabaja 24/7.
- **Precisión**: No hay errores en presupuestos ni solapamientos de calendario.
- **Escalabilidad**: Preparado para añadir gestión de múltiples salas y chatbots.

---

### 📄 FILE: `docs/Propuesta comercial.md`
- Fase 1: El Corazón (Web escaparate, Motor de Pre-Reservas, Backoffice).
- Fase 2: Experiencia (Invitaciones Digitales, Gestor de Eventos/Talleres, Tarifas en tiempo real).
- Fase 3: Automatización (Asistente Inteligente WhatsApp/Web, Filtro Automático de disponibilidad).

---

## 📊 SECCIÓN 2: ARQUITECTURA DE DATOS (SCHEMAS)

### 📄 FILE: `api/models/event.model.js`
```javascript
const eventSchema = new mongoose.Schema({
  tipo: { type: String, enum: ['reserva', 'bloqueo'], required: true },
  estado: { type: String, enum: ['pendiente', 'confirmado', 'modificada', 'cancelada'], default: 'pendiente' },
  fecha: { type: Date, required: true }, 
  turno: { type: String, enum: ['T1', 'T2', 'T3'], required: true },
  cliente: {
    nombreNiño: { type: String },
    nombrePadre: { type: String },
    telefono: { type: String },
    email: { type: String },
    privacyPolicyConsent: { type: Boolean }
  },
  detalles: {
    niños: { cantidad: Number, menuId: String, menuNombre: String, precioApplied: Number },
    adultos: { cantidad: Number, comida: Array },
    extras: { taller: String, personaje: String, pinata: Boolean, costoExtra: Number }
  },
  horario: { inicio: String, fin: String, extensionMinutos: Number, costoExtension: Number },
  precioTotal: Number,
  publicId: String,
  invitationId: String,
  googleEventId: String
});
```

---

## 🧠 SECCIÓN 3: LÓGICA DE NEGOCIO (THE CALCULATOR)

### 📄 FILE: `api/controllers/events.controllers.js` (PRICING ENGINE)
```javascript
const calculateEventPrice = async (eventData, config) => {
  // 1. Niños + Plus Finde (+1.50€/niño)
  // 2. Adultos y Raciones (según config.preciosAdultos)
  // 3. Extras (Taller, Personaje, Piñata)
  // 4. Extensiones Horarias (30min/30€, 60min/50€)
};
```

---

## ✉️ SECCIÓN 6: MOTOR DE NOTIFICACIONES (MAILER)

### 📄 FILE: `api/config/mailer.config.js` (CÓDIGO ÍNTEGRO)
```javascript
const nodemailer = require('nodemailer');
const Config = require('../models/config.model');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
});

const getHorarioFinal = (turno, extensionMinutos = 0) => {
  const shifts = { 'T1': { start: '17:00', end: '19:00' }, 'T2': { start: '18:00', end: '20:00' }, 'T3': { start: '19:15', end: '21:15' } };
  const shift = shifts[turno];
  if (!shift) return turno;
  if (!extensionMinutos) return `${shift.start} a ${shift.end}`;
  const [hours, minutes] = shift.end.split(':').map(Number);
  const totalMinutes = (hours * 60) + minutes + extensionMinutos;
  return `${shift.start} a ${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
};

module.exports.sendBookingConfirmationEmail = async (event) => {
  const { publicId, fecha, turno, cliente, detalles, horario, precioTotal } = event;
  const googleCalendarUrl = generateGCalUrl(); // Genera link dinámico para el padre
  
  const html = `... (Template HTML profesional con branding de Neverland) ...`;

  return transporter.sendMail({
    from: `"Neverland" <${process.env.EMAIL_USER}>`,
    to: cliente.email,
    subject: `Reserva recibida: ${publicId} - Neverland`,
    html,
  });
};
```

---

## 🌐 SECCIÓN 7: INTEGRACIONES EXTERNAS (CALENDAR & PUSH)

### 📄 FILE: `api/services/google.service.js`
- **T1/T2/T3**: Gestiona etiquetas para la sincronización perfecta con la cuenta de servicio de Google.
- **Detección de Solapamientos**: Evita que se solapen eventos de Neverland con bloqueos manuales en Google Calendar.

---
**FIN DEL DOCUMENTO DE CONTEXTO FINAL PARA NOTEBOOKLM**
