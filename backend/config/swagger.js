const swaggerUi = require('swagger-ui-express');
const { buildOpenApiDocument } = require('../contracts/openapi');

function setupSwagger(app) {
  // v1: documento gerado a partir dos schemas Zod (sempre igual ao código)
  const v1Document = buildOpenApiDocument();
  app.get('/api-docs/v1.json', (req, res) => res.json(v1Document));
  app.use('/api-docs/v1', swaggerUi.serveFiles(v1Document), swaggerUi.setup(v1Document));
}

module.exports = setupSwagger;
