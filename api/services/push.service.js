const webPush = require('web-push');
const PushSubscription = require('../models/pushSubscription.model');

const vapidEmail = (process.env.VAPID_EMAIL || '').startsWith('mailto:')
	? process.env.VAPID_EMAIL
	: `mailto:${process.env.VAPID_EMAIL || 'hola@neverlandcullarvega.es'}`;

webPush.setVapidDetails(
	vapidEmail,
	process.env.VAPID_PUBLIC_KEY,
	process.env.VAPID_PRIVATE_KEY
);

/**
 * Envía una notificación push a todos los administradores suscritos.
 * @param {object} event - El evento/reserva recién creado.
 */
const notifyNewBooking = async (event) => {
	try {
		const subscriptions = await PushSubscription.find({ role: 'admin' });

		if (!subscriptions.length) {
			console.log('[Push] No hay suscriptores admin. Se omite la notificación.');
			return;
		}

		const fechaStr = event.fecha
			? new Date(event.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
			: 'fecha desconocida';
		const nombre = event.cliente?.nombreNiño || 'Sin nombre';
		const turno = event.turno || '';

		const payload = JSON.stringify({
			title: '🎉 ¡Nueva Reserva!',
			body: `${nombre} — ${fechaStr}${turno ? ` (${turno})` : ''}`,
			data: { url: '/admin' }
		});

		const results = await Promise.allSettled(
			subscriptions.map((sub) =>
				webPush.sendNotification(
					{ endpoint: sub.endpoint, keys: sub.keys },
					payload
				)
			)
		);

		// Limpiar suscripciones expiradas (HTTP 410 = Gone)
		const expiredEndpoints = [];
		results.forEach((result, index) => {
			if (
				result.status === 'rejected' &&
				result.reason?.statusCode === 410
			) {
				expiredEndpoints.push(subscriptions[index].endpoint);
				console.warn(
					`[Push] Suscripción expirada eliminada: ${subscriptions[index].endpoint.slice(0, 50)}...`
				);
			}
		});

		if (expiredEndpoints.length) {
			await PushSubscription.deleteMany({ endpoint: { $in: expiredEndpoints } });
		}

		const sent = results.filter((r) => r.status === 'fulfilled').length;
		console.log(`[Push] Notificación enviada a ${sent}/${subscriptions.length} dispositivos.`);
	} catch (err) {
		// No propagamos el error: que falle el push NUNCA debe romper la reserva
		console.error('[Push] Error al enviar notificación:', err.message);
	}
};

module.exports = { notifyNewBooking };
