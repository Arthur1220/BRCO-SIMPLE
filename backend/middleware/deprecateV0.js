const logger = require('../lib/logger');

/**
 * Marca as rotas da v0 (/api/* fora de /api/v1) como depreciadas e registra o uso.
 * Quando os logs ficarem ~14 dias sem "Uso da API v0", a v0 pode ser removida.
 */
function deprecateV0(req, res, next) {
  if (req.originalUrl.startsWith('/api/v1')) return next();

  res.set('Deprecation', 'true');
  res.set('Link', '</api-docs/v1>; rel="successor-version"');
  logger.info('Uso da API v0', { method: req.method, path: req.path });
  return next();
}

module.exports = { deprecateV0 };
