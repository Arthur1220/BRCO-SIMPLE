const { createUsageLog } = require('../repositories/usageLogsRepository');
const logger = require('./logger');

/**
 * Registra o uso de um cálculo (tipo, user agent e localização aproximada).
 * A localização vem do proxy do Netlify (ver verifyNetlifyProxy); sem ela, fica 'Unknown'.
 * Falhas no registro nunca devem quebrar a resposta do cálculo.
 */
async function logCalculation(req, calculationType) {
  try {
    await createUsageLog({
      calculationType,
      userAgent: req.headers['user-agent'],
      country: req.geo?.country || 'Unknown',
      region: req.geo?.region || 'Unknown',
    });
  } catch (error) {
    logger.error('Falha ao registrar uso do cálculo', { calculationType, error: error.message });
  }
}

module.exports = { logCalculation };
