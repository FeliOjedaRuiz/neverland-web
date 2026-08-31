require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/event.model');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const eventos = await Event.find({ tipo: 'reserva' })
    .select('publicId cliente detalles.extras.personajes fecha estado')
    .lean()
    .sort({ fecha: -1 });

  const conPersonaje = eventos.filter(e => (e.detalles?.extras?.personajes?.length || 0) > 0);
  
  console.log(`${conPersonaje.length} reservas con personaje de ${eventos.length} totales:\n`);
  
  conPersonaje.forEach(e => {
    const chars = e.detalles.extras.personajes.join(', ');
    const fecha = e.fecha ? new Date(e.fecha).toLocaleDateString('es-ES') : 'sin fecha';
    const c = e.cliente || {};
    const nombre = c.nombre || c.fullName || c.name || JSON.stringify(c).substring(0, 50) || 'sin nombre';
    console.log(`  ${e.publicId} | ${fecha} | ${nombre} | [${chars}]`);
  });

  // También mostrar las que no tienen personaje para referencia
  const sinPersonaje = eventos.filter(e => (e.detalles?.extras?.personajes?.length || 0) === 0);
  console.log(`\n${sinPersonaje.length} reservas sin personaje.`);

  await mongoose.connection.close();
})();
