/**
 * Ambiente de teste. Deve ser o PRIMEIRO require de cada arquivo de teste,
 * antes de qualquer módulo que leia process.env ou crie o cliente do DynamoDB.
 *
 * Os testes usam o DynamoDB Local (`docker compose up -d` na raiz do projeto).
 * Cada arquivo de teste usa tabelas próprias (prefixo aleatório), então não há interferência.
 */
const crypto = require('crypto');

const prefix = `test-${crypto.randomBytes(4).toString('hex')}`;

process.env.NODE_ENV = 'test';
process.env.DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000';
process.env.FOODS_TABLE = `${prefix}-foods`;
process.env.CALCULATIONS_TABLE = `${prefix}-calculations`;
process.env.USAGE_LOGS_TABLE = `${prefix}-usage-logs`;
process.env.PANEL_PASSWORD = 'senha-de-teste';
process.env.ADMIN_JWT_SECRET = 'segredo-de-teste-com-pelo-menos-32-caracteres';
delete process.env.NETLIFY_PROXY_SECRET;

module.exports = { prefix };
