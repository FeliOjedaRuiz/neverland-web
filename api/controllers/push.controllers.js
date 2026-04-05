const PushSubscription = require('../models/pushSubscription.model');
const createError = require('http-errors');

/**
 * GET /push/public-key
 * Devuelve la VAPID public key para que el frontend pueda suscribirse.
 */
module.exports.getPublicKey = (req, res) => {
	const publicKey = process.env.VAPID_PUBLIC_KEY;
	if (!publicKey) {
		return res.status(503).json({ message: 'Push notifications no configuradas en el servidor.' });
	}
	res.json({ publicKey });
};

/**
 * POST /push/subscribe
 * Guarda o actualiza la suscripción push del admin.
 * Body: { endpoint, keys: { p256dh, auth } }
 */
module.exports.subscribe = (req, res, next) => {
	const { endpoint, keys } = req.body;

	if (!endpoint || !keys?.p256dh || !keys?.auth) {
		return next(createError(400, 'Suscripción inválida: faltan endpoint o keys.'));
	}

	// Upsert: si ya existe la suscripción la actualizamos, si no la creamos
	PushSubscription.findOneAndUpdate(
		{ endpoint },
		{ endpoint, keys, role: 'admin' },
		{ upsert: true, new: true, setDefaultsOnInsert: true }
	)
		.then(() => res.status(201).json({ message: 'Suscripción guardada correctamente.' }))
		.catch(next);
};

/**
 * DELETE /push/unsubscribe
 * Elimina la suscripción push de un dispositivo.
 * Body: { endpoint }
 */
module.exports.unsubscribe = (req, res, next) => {
	const { endpoint } = req.body;

	if (!endpoint) {
		return next(createError(400, 'Endpoint requerido.'));
	}

	PushSubscription.findOneAndDelete({ endpoint })
		.then(() => res.json({ message: 'Suscripción eliminada.' }))
		.catch(next);
};
