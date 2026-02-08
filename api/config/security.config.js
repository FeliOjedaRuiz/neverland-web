const rateLimit = require('express-rate-limit');

// 1. Limite general para toda la API (Protección básica DDoS/Brute Force)
module.exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 150, // Límite de peticiones por ventana por IP
  standardHeaders: true, // Retorna info de límites en los headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita los headers `X-RateLimit-*`
  message: {
    status: 429,
    message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.'
  }
});
