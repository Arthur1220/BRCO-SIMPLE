/**
 * Ambiente de teste. Deve ser o PRIMEIRO require de cada arquivo de teste,
 * antes de qualquer módulo que leia process.env ou instancie o Prisma.
 */
const os = require('os');
const path = require('path');
const fs = require('fs');

const dbDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brco-test-'));

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = `file:${path.join(dbDir, 'test.db').replace(/\\/g, '/')}`;
process.env.PANEL_PASSWORD = 'senha-de-teste';
process.env.ADMIN_JWT_SECRET = 'segredo-de-teste-com-pelo-menos-32-caracteres';
delete process.env.NETLIFY_PROXY_SECRET;

module.exports = { dbDir };
