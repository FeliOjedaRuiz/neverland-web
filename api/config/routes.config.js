const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const users = require('../controllers/users.controllers');
const events = require('../controllers/events.controllers');
const config = require('../controllers/config.controllers');
const workshops = require('../controllers/workshops.controllers');
const push = require('../controllers/push.controllers');

const secure = require('../middlewares/secure.mid');
const usersMid = require('../middlewares/users.mid');

// USERS
router.post('/users', secure.isAdmin, users.create);
router.post('/login', users.login);
router.post(
	'/sendRestoreEmail/:email',
	usersMid.exists,
	users.sendRestoreEmail
);
router.post(
	'/restorepassword/:userId',
	usersMid.checkUser,
	users.restorePassword
);
router.get('/users/:userId', secure.auth, secure.isAuthorized, users.detail);
router.patch(
	'/users/:userId',
	secure.isAdmin,
	usersMid.clientExists,
	users.update
);
router.get('/users', secure.isAdmin, users.list);

// EVENTS (Reservations & Blocks)
router.get('/events/availability', events.checkAvailability);
router.post('/events', events.create); // Clients can create reservations
router.get('/events', secure.isAdmin, events.list);
router.get('/events/:id/public', events.publicDetail); // NEW: Public-safe detail
router.get('/events/invitation/:invitationId', events.getInvitation); // NEW: Invitation safe detail
router.get('/events/:id', secure.isAdmin, events.detail); // Sensitive full detail
router.patch('/events/:id', (req, res, next) => {
	// Attempt authentication but don't fail if token is missing or invalid
	const token = req.headers.authorization?.split(" ")?.[1];
	if (token) {
		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			return usersMid.checkUserForAuth(decoded.sub)(req, res, () => {
				next();
			});
		} catch (err) {
			// Invalid or expired token - proceed as anonymous
			console.warn('Invalid token provided for PATCH /events, proceeding as anonymous');
		}
	}
	// No token or invalid token? Proceed as anonymous/customer
	next();
}, events.update);
router.delete('/events/:id', secure.isAdmin, events.delete);

const upload = require('../config/cloudinary.config');

// CONFIG
router.get('/config', config.get);
router.patch('/config', secure.isAdmin, config.update);
router.post('/config/upload-image', secure.isAdmin, upload.single('image'), config.uploadImage);

// WORKSHOPS
router.get('/workshops', workshops.list);
router.post('/workshops', secure.isAdmin, workshops.create);
router.patch('/workshops/:id', secure.isAdmin, workshops.update);
router.delete('/workshops/:id', secure.isAdmin, workshops.delete);

// PUSH NOTIFICATIONS
router.get('/push/public-key', push.getPublicKey); // Pública: el admin la necesita antes de autenticarse con push
router.post('/push/subscribe', secure.isAdmin, push.subscribe);
router.delete('/push/unsubscribe', secure.isAdmin, push.unsubscribe);

module.exports = router;
