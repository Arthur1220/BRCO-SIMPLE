const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./openapi.json');
const logger = require('../lib/logger');

function setupSwagger(app) {
  // A rota agora usa o objeto JSON importado diretamente, sem parsers
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  logger.info('Swagger docs available at /api-docs');
}

module.exports = setupSwagger;