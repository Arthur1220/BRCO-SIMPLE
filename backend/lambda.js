// Entrada da AWS Lambda (Function URL). A mesma aplicação Express do servidor local.
const serverless = require('serverless-http');
const { createApp } = require('./app');
const { validateEnv } = require('./lib/env');

// Falha no cold start se faltar configuração: nenhuma requisição é atendida sem os segredos.
validateEnv();

module.exports.handler = serverless(createApp(), {
    // Imagens da Swagger UI (o resto das respostas é texto/JSON)
    binary: ['image/*'],
});
