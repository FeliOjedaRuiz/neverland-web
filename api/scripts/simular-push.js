require('dotenv').config();
const mongoose = require('mongoose');
const { notifyNewBooking } = require('../services/push.service');

const run = async () => {
	try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/neverland';
		await mongoose.connect(uri);
		console.log('📡 Conectado a la base de datos.');

		console.log('🚀 Simulando evento de nueva reserva y disparando notificación...');
		const fakeEvent = {
			_id: new mongoose.Types.ObjectId(),
			tipo: 'reserva',
			cliente: { nombreNiño: 'Niño Prueba AI' },
			fecha: new Date(),
			turno: 'Mañana (Test)',
		};

		// Llamamos al servicio de notificaciones con nuestro evento falso
		await notifyNewBooking(fakeEvent);
		
		console.log('✅ Trigger de notificación completado. Revisa tu PC/móvil.');
	} catch (error) {
		console.error('❌ Error enviando push de prueba:', error);
	} finally {
		await mongoose.disconnect();
		process.exit(0);
	}
};

run();
