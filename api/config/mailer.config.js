const nodemailer = require('nodemailer');
const Config = require('../models/config.model');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const getHorarioFinal = (turno, extensionMinutos = 0) => {
  const shifts = {
    'T1': { start: '17:00', end: '19:00' },
    'T2': { start: '18:00', end: '20:00' },
    'T3': { start: '19:15', end: '21:15' }
  };

  const shift = shifts[turno];
  if (!shift) return turno;

  if (!extensionMinutos) return `${shift.start} a ${shift.end}`;

  const [hours, minutes] = shift.end.split(':').map(Number);
  const totalMinutes = (hours * 60) + minutes + extensionMinutos;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  const formattedEnd = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

  return `${shift.start} a ${formattedEnd}`;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

module.exports.sendBookingConfirmationEmail = async (event) => {
  const { publicId, fecha, turno, cliente, detalles, horario, precioTotal } = event;
  const formattedDate = formatDate(fecha);
  const shiftHours = getHorarioFinal(turno, horario.extensionMinutos);

  // Intentamos obtener el nombre del menú desde la configuración
  let menuName = detalles.niños.menuId;
  try {
    const config = await Config.findOne();
    if (config && config.menusNiños) {
      const menu = config.menusNiños.find(m => String(m.id) === String(detalles.niños.menuId) || String(m._id) === String(detalles.niños.menuId));
      if (menu) menuName = menu.nombre;
    }
  } catch (error) {
    console.error('Error fetching config for email:', error);
  }

  // Preparamos el texto del taller para evitar duplicados
  let tallerText = detalles.extras.taller;
  if (tallerText && tallerText !== 'ninguno') {
    if (!tallerText.toLowerCase().startsWith('taller') && !tallerText.toLowerCase().startsWith('show') && !tallerText.toLowerCase().startsWith('visita')) {
      tallerText = `Taller de ${tallerText}`;
    }
  }

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de Solicitud de Reserva - Neverland</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #FDEBD0; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .header { background-color: #ffffff; padding: 25px 20px; text-align: center; border-bottom: 1px solid #f9f9f9; }
        .content { padding: 30px 40px; text-align: center; }
        h1 { font-size: 24px; color: #111827; margin: 0 0 15px 0; font-weight: 800; }
        .message { color: #4B5563; font-size: 16px; margin-bottom: 20px; }
        .highlight { color: #24635A; font-weight: bold; }
        .booking-id-container { background-color: rgba(36, 99, 90, 0.05); border: 2px dashed rgba(36, 99, 90, 0.2); padding: 20px; border-radius: 16px; margin: 20px 0; }
        .booking-id-label { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #9CA3AF; font-weight: 900; margin-bottom: 5px; }
        .booking-id { font-size: 24px; font-weight: 900; color: #24635A; letter-spacing: 3px; }
        .summary-card { background-color: #FFF9F0; border-radius: 20px; padding: 25px; text-align: left; margin-bottom: 30px; border: 1px solid #FDEBD0; }
        .summary-title { font-weight: 800; font-size: 14px; text-transform: uppercase; color: #374151; margin-bottom: 15px; border-bottom: 1px solid #E5E7EB; padding-bottom: 10px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
        .summary-label { color: #6B7280; white-space: nowrap; }
        .summary-value { color: #111827; font-weight: 600; text-align: right; margin-left: 10px; }
        .footer { background-color: #F9FAFB; padding: 30px; text-align: center; font-size: 12px; color: #9CA3AF; }
        .total-row { border-top: 1px solid #E5E7EB; margin-top: 15px; padding-top: 15px; font-weight: 800; font-size: 18px; color: #10B981; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header" style="background-color: #ffffff; padding: 25px 20px; text-align: center;">
          <a href="https://neverland-web.vercel.app" target="_blank" style="text-decoration: none;">
            <img 
              src="https://res.cloudinary.com/duoshgr3h/image/upload/f_auto,q_auto/v1772317871/neverland/assets/neverland_logo_svg.png" 
              alt="Neverland Cúllar Vega" 
              style="display: block; width: 140px; height: auto; margin: 0 auto; border: 0;"
              width="140"
            />
          </a>
        </div>
        <div class="content">
          <h1>¡Hola ${cliente.nombrePadre}!</h1>
          <p class="message">
            Hemos recibido tu solicitud de reserva para el cumpleaños de <span class="highlight">${cliente.nombreNiño}</span>.
          </p>
          <p class="message" style="font-size: 14px; margin-top: -10px;">
            El equipo de Neverland revisará los detalles y te contactará muy pronto para confirmar la disponibilidad y completar la reserva.
          </p>

          <div class="booking-id-container">
            <div class="booking-id-label">ID DE TU SOLICITUD</div>
            <div class="booking-id">${publicId}</div>
          </div>

          <div class="summary-card">
            <div class="summary-title">Detalles de la Reserva</div>
            <div class="summary-row">
              <span class="summary-label">Fecha:</span>
              <span class="summary-value">${formattedDate}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Horario:</span>
              <span class="summary-value">${shiftHours}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Niños:</span>
              <span class="summary-value">${detalles.niños.cantidad} (${menuName})</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Adultos:</span>
              <span class="summary-value">${detalles.adultos.cantidad}</span>
            </div>
            
            ${detalles.adultos.comida && detalles.adultos.comida.length > 0 ? `
            <div class="summary-row" style="flex-direction: column; display: block; margin-bottom: 15px;">
              <div class="summary-label" style="margin-bottom: 5px;">Comida para adultos:</div>
              <div style="background: white; padding: 10px; border-radius: 12px; font-size: 13px; border: 1px solid #F3F4F6;">
                ${detalles.adultos.comida.map(item => `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span>${item.item}</span>
                    <span style="font-weight: bold;">x${item.cantidad}</span>
                  </div>
                `).join('')}
              </div>
            </div>` : ''}

            ${tallerText && tallerText !== 'ninguno' ? `
            <div class="summary-row">
              <span class="summary-label">Extra:</span>
              <span class="summary-value">${tallerText}</span>
            </div>` : ''}
            ${detalles.extras.personaje !== 'ninguno' ? `
            <div class="summary-row">
              <span class="summary-label">Extra:</span>
              <span class="summary-value">Visita de ${detalles.extras.personaje}</span>
            </div>` : ''}
            ${detalles.extras.pinata ? `
            <div class="summary-row">
              <span class="summary-label">Extra:</span>
              <span class="summary-value">Piñata</span>
            </div>` : ''}
            ${horario.extensionMinutos > 0 ? `
            <div class="summary-row">
              <span class="summary-label">Extensión:</span>
              <span class="summary-value">${horario.extensionMinutos} minutos</span>
            </div>` : ''}
            
            ${detalles.extras.observaciones ? `
            <div class="summary-row" style="margin-top: 15px; flex-direction: column; display: block;">
              <div class="summary-label" style="margin-bottom: 5px;">Observaciones:</div>
              <div class="summary-value" style="background: white; padding: 10px; border-radius: 10px; font-weight: normal; font-size: 13px; border: 1px solid #F3F4F6; text-align: left;">${detalles.extras.observaciones}</div>
            </div>` : ''}
            ${detalles.extras.alergenos ? `
            <div class="summary-row" style="margin-top: 15px; flex-direction: column; display: block;">
              <div class="summary-label" style="margin-bottom: 5px; color: #EF4444;">Alérgenos / Necesidades especiales:</div>
              <div class="summary-value" style="background: #FEF2F2; padding: 10px; border-radius: 10px; font-weight: normal; font-size: 13px; color: #991B1B; border: 1px solid #FEE2E2; text-align: left;">${detalles.extras.alergenos}</div>
            </div>` : ''}
            <div class="total-row">
              <span>Estimado Total:</span>
              <span style="float: right;">${precioTotal}€</span>
            </div>
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Neverland Cúllar Vega - Centro de Ocio Infantil
        </div>
      </div>
    </body>
    </html>
  `;

  return transporter.sendMail({
    from: `"Neverland" <${process.env.EMAIL_USER}>`,
    to: cliente.email,
    subject: `Reserva recibida: ${publicId} - Neverland`,
    html,
  })
    .then(info => {
      console.info(`Email sent to ${cliente.email}: ${info.messageId}`);
      return info;
    })
    .catch(error => {
      console.error(`Error sending email to ${cliente.email}:`, error);
      throw error;
    });
};
