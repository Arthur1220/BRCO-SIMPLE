/**
 * Cria as tabelas no DynamoDB Local (desenvolvimento). Em produção elas vêm do template.yaml.
 * Uso: npm run db:create-tables
 */
require('dotenv').config();
const { createTables } = require('../lib/tables');

createTables()
  .then(() => console.log('Tabelas prontas.'))
  .catch((error) => {
    console.error('Falha ao criar as tabelas:', error);
    process.exitCode = 1;
  });
