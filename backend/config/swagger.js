const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./openapi.json');
const { buildOpenApiDocument } = require('../contracts/openapi');
const logger = require('../lib/logger');

function setupSwagger(app) {
  // v1: documento gerado a partir dos schemas Zod (sempre igual ao código)
  const v1Document = buildOpenApiDocument();
  app.get('/api-docs/v1.json', (req, res) => res.json(v1Document));
  app.use('/api-docs/v1', swaggerUi.serveFiles(v1Document), swaggerUi.setup(v1Document));

  // v0 (legado): documento escrito à mão, removido junto com a v0
  app.use('/api-docs', swaggerUi.serveFiles(swaggerDocument), swaggerUi.setup(swaggerDocument));

  logger.info('Swagger docs available at /api-docs (v0) and /api-docs/v1');
}

module.exports = setupSwagger;
