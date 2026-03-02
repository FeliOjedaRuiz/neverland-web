require('dotenv').config();
const mailer = require('./config/mailer.config');
const mongoose = require('mongoose');

// Mock Event
const mockEvent = {
  id: '64f89d9e6e8e8e8e8e8e8e8e', // Fake MongoDB ID
  publicId: 'REV-TEST-25',
  fecha: new Date('2026-05-20'),
  turno: 'T1',
  cliente: {
    nombreNiño: 'Pedrito',
    nombrePadre: 'Juan Pérez',
    email: 'feliojedaruiz@gmail.com', // Enviamos a tu dirección
    telefono: '600112233'
  },
  detalles: {
    niños: { cantidad: 15, menuId: 'menu-1' },
    adultos: {
      cantidad: 20,
      comida: [
        { item: 'Tortilla de Patatas', cantidad: 1 },
        { item: 'Salaíllas con Jamón', cantidad: 10 }
      ]
    },
    extras: {
      taller: 'Magia',
      personaje: 'Spiderman',
      pinata: true,
      observaciones: 'Esto es una prueba del nuevo sistema de emails con botón de Google Calendar.',
      alergenos: 'Sin frutos secos'
    }
  },
  horario: {
    extensionMinutos: 30,
    costoExtension: 30
  },
  precioTotal: 345
};

async function sendTest() {
  try {
    console.log('--- ENVIANDO MAIL DE PRUEBA ---');
    console.log(`Destinatario: ${mockEvent.cliente.email}`);

    // Conectamos a BD para que el mailer pueda buscar nombres de menú si es necesario
    // (Opcional, pero para que sea más real si hay una conexión activa)
    // await mongoose.connect(process.env.MONGODB_URI);

    await mailer.sendBookingConfirmationEmail(mockEvent);

    console.log('✅ ¡Mail enviado con éxito!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al enviar el mail:');
    console.error(err);
    process.exit(1);
  }
}

sendTest();
