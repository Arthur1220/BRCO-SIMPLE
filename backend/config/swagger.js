const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./openapi.json'); // Importa o arquivo JSON diretamente
const logger = require('../lib/logger');

function setupSwagger(app) {
  // A rota agora usa o objeto JSON importado diretamente, sem parsers
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  logger.info('Swagger docs available at /api-docs');
}

module.exports = setupSwagger;