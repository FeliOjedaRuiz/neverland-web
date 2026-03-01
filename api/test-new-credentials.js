require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

console.log(`Intentando enviar mail desde: ${process.env.EMAIL_USER}`);

transporter.sendMail({
  from: `"Neverland" <${process.env.EMAIL_USER}>`,
  to: 'feliojedaruiz@gmail.com',
  subject: 'Prueba de configuración de correo - Neverland',
  text: 'Si recibes este mail, la configuración del nuevo correo es correcta.',
  html: '<b>Si recibes este mail, la configuración del nuevo correo es correcta.</b>'
})
  .then(info => {
    console.log('✅ ¡Éxito! El mail fue enviado a feliojedaruiz@gmail.com');
    console.log('Message ID:', info.messageId);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error al enviar el mail:');
    console.error(err);
    process.exit(1);
  });
