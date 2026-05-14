const rateLimit = require('express-rate-limit');

const maxRequests = process.env.NODE_ENV === 'production' ? 300 : 1000;

// 1. Limite general para toda la API (Protección básica DDoS/Brute Force)
module.exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: maxRequests, // 300 en prod, 1000 en dev
  standardHeaders: true, // Retorna info de límites en los headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita los headers `X-RateLimit-*`
  message: {
    status: 429,
    message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.'
  }
});
