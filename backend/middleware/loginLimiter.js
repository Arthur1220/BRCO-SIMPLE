const rateLimit = require('express-rate-limit');
const { getClientIp } = require('./authMiddleware');
const { sendError } = require('../lib/apiErrors');

/**
 * Limita tentativas de login (força bruta na senha do painel).
 * Instância única compartilhada pela v0 e pela v1: o contador é o mesmo.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: (req, res) => sendError(req, res, 429, 'RATE_LIMITED', 'Muitas tentativas. Tente novamente em alguns minutos.'),
});

module.exports = { loginLimiter };
