const jwt = require('jsonwebtoken');
const User = require('../../models/user.model');
const Config = require('../../models/config.model');

const getFutureDate = (targetDayOfWeek, daysAhead = 30) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  while (d.getDay() !== targetDayOfWeek) d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
};

const futureTuesday = getFutureDate(2);

const reservationPayload = {
  tipo: 'reserva',
  fecha: futureTuesday,
  turno: 'T1',
  cliente: {
    nombreNiño: 'Leo',
    edadNiño: 5,
    nombrePadre: 'Ana',
    telefono: '123456789',
    email: 'ana@example.com',
    privacyPolicyConsent: true
  },
  detalles: {
    niños: { cantidad: 12, menuId: 'menu-1' }
  }
};

const mergeDeep = (target, source) => {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      result[key] = mergeDeep(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
};

const buildReservation = (overrides = {}) => mergeDeep(reservationPayload, overrides);

const createAdminUser = () =>
  User.create({
    name: 'Test',
    surname: 'Admin',
    email: 'admin-test@neverland.com',
    password: 'test1234',
    role: 'admin'
  });

const createGuestUser = () =>
  User.create({
    name: 'Test',
    surname: 'Guest',
    email: 'guest-test@neverland.com',
    password: 'test1234',
    role: 'guest'
  });

const getUserToken = (user) =>
  jwt.sign(
    { sub: user._id },
    process.env.JWT_SECRET || 'test-jwt-secret',
    { expiresIn: '1h' }
  );

const createBaseConfig = () =>
  Config.create({
    menusNiños: [{ id: 'menu-1', nombre: 'Menú Aventura', precio: 15 }],
    plusFinDeSemana: 1.5,
    preciosAdultos: [],
    workshops: [],
    preciosExtras: { extension30: 30, extension60: 50 }
  });

module.exports = {
  getFutureDate,
  futureTuesday,
  reservationPayload,
  buildReservation,
  createAdminUser,
  createGuestUser,
  getUserToken,
  createBaseConfig
};
