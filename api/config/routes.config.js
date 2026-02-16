const express = require('express');
const router = express.Router();

const users = require('../controllers/users.controllers');
const events = require('../controllers/events.controllers');
const config = require('../controllers/config.controllers');
const workshops = require('../controllers/workshops.controllers');

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
router.get('/events/:id', events.detail); // Client needs detail for summary/edit
router.patch('/events/:id', secure.isAdmin, events.update); // Only admin can edit for now
router.delete('/events/:id', secure.isAdmin, events.delete);

// CONFIG
router.get('/config', config.get);
router.patch('/config', secure.isAdmin, config.update);

// WORKSHOPS
router.get('/workshops', workshops.list);
router.post('/workshops', secure.isAdmin, workshops.create);
router.patch('/workshops/:id', secure.isAdmin, workshops.update);
router.delete('/workshops/:id', secure.isAdmin, workshops.delete);

module.exports = router;
