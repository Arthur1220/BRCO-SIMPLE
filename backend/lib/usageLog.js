const geoip = require('geoip-lite');
const prisma = require('./prisma');
const logger = require('./logger');
const { getClientIp } = require('../middleware/authMiddleware');

/**
 * Registra o uso de um cálculo (tipo, user agent e localização aproximada).
 * Falhas no registro nunca devem quebrar a resposta do cálculo.
 */
async function logCalculation(req, calculationType) {
  try {
    const geo = geoip.lookup(getClientIp(req));
    await prisma.calculationLog.create({
      data: {
        calculationType,
        userAgent: req.headers['user-agent'],
        country: geo ? geo.country : 'Unknown',
        region: geo ? geo.region : 'Unknown',
      },
    });
  } catch (error) {
    logger.error('Falha ao registrar uso do cálculo', { calculationType, error: error.message });
  }
}

module.exports = { logCalculation };
