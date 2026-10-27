// Servidor local (desenvolvimento). Em produção a API roda na Lambda (ver lambda.js).

// Carrega as variáveis de ambiente
require('dotenv').config();

const { createApp } = require('./app');
const logger = require('./lib/logger');
const { validateEnvOrExit } = require('./lib/env');

const PORT = process.env.PORT || 3000;

validateEnvOrExit();

createApp().listen(PORT, () => {
    logger.info(`🚀 Servidor rodando na porta ${PORT}`);
    logger.info(`📝 Documentação disponível em http://localhost:${PORT}/api-docs/v1`);
});
