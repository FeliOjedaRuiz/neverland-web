// Mock de nodemailer para capturar el HTML generado sin enviar correos reales.
// createTransport se invoca al cargar mailer.config, así que el mock queda
// registrado en los resultados del factory.
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-html-id' }),
  })),
}));

const nodemailer = require('nodemailer');
const { sendBookingConfirmationEmail } = require('../config/mailer.config');

// Evento mínimo pero completo: todos los campos que lee la plantilla.
const eventoBase = {
  id: '64b000000000000000000001',
  publicId: 'NAV123',
  fecha: new Date(),
  turno: 'T1',
  precioTotal: 180,
  cliente: {
    email: 'ana@example.com',
    nombrePadre: 'Ana',
    nombreNiño: 'Leo',
  },
  detalles: {
    niños: { cantidad: 12, menuId: 'menu-1', menuNombre: 'Menú 1' },
    adultos: { cantidad: 1, comida: [] },
    extras: {},
  },
  horario: { inicio: '17:00', fin: '19:00', extensionMinutos: 0 },
};

// sendBookingConfirmationEmail tiene un early-return en NODE_ENV=test (evita
// enviar correos reales en la suite). Para ejercitar la generación del HTML
// abrimos ese guard temporalmente y restauramos siempre.
const generarHtml = async (event) => {
  const envPrevio = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  try {
    await sendBookingConfirmationEmail(event);
  } finally {
    process.env.NODE_ENV = envPrevio;
  }
  const transport = nodemailer.createTransport.mock.results.at(-1).value;
  const ultimaLlamada = transport.sendMail.mock.calls.at(-1);
  return ultimaLlamada[0].html;
};

describe('sendBookingConfirmationEmail — aviso de la señal de reserva', () => {
  it('incluye el aviso de la transferencia de 50€ tras el bloque del ID', async () => {
    const html = await generarHtml(eventoBase);

    expect(html).toMatch(/transferencia de 50€ en concepto de reserva/);
    // El aviso va DESPUÉS del bloque del ID de solicitud y ANTES del resumen.
    // Se busca `class="..."` (no `.payment-notice`) porque la clase también
    // aparece antes, en la definición CSS del <head>.
    const idxAviso = html.indexOf('class="payment-notice"');
    expect(html.indexOf('ID DE TU SOLICITUD')).toBeGreaterThan(-1);
    expect(idxAviso).toBeGreaterThan(html.indexOf('ID DE TU SOLICITUD'));
    expect(idxAviso).toBeLessThan(html.indexOf('Detalles de la Reserva'));
  });

  it('NUNCA incluye el IBAN en el correo (seguridad: solo por WhatsApp desde el panel admin)', async () => {
    const html = await generarHtml(eventoBase);

    expect(html).not.toMatch(/IBAN/i);
    expect(html).not.toMatch(/ES\d{2}/); // formato de IBAN español
  });

  it('usa el importe mínimo entre 50€ y el precioTotal', async () => {
    const html = await generarHtml({ ...eventoBase, precioTotal: 30 });

    expect(html).toMatch(/transferencia de 30€ en concepto de reserva/);
  });

  it('NO muestra el aviso cuando el precioTotal es 0 (reserva no pagable)', async () => {
    const html = await generarHtml({ ...eventoBase, precioTotal: 0 });

    expect(html).not.toMatch(/transferencia de/);
  });
});
