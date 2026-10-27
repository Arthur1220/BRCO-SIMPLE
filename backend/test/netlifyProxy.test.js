require('./helpers/env');
const PROXY_SECRET = 'segredo-do-proxy-netlify-para-testes';
process.env.NETLIFY_PROXY_SECRET = PROXY_SECRET;

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { setupTestTables, startServer } = require('./helpers/server');
const { listUsageLogsSince } = require('../repositories/usageLogsRepository');

const ndtInput = { PB: 9.55, EE: 2.36, FDN: 63.54, Lignina: 5.2, MO: 89.26, PIDN: 2.1, PIDA: 0.9 };
const netlifySign = (secret = PROXY_SECRET, claims = {}) =>
  jwt.sign({ netlify_id: 'site-id', site_url: 'https://brco.netlify.app', ...claims }, secret, { issuer: 'netlify' });

let server;

test.before(async () => {
  await setupTestTables();
  server = await startServer();
});

test.after(async () => {
  await server.close();
});

test('API: requisição sem assinatura do Netlify é bloqueada (403)', async () => {
  const res = await server.request('POST', '/api/v1/calculations/ndt', { body: ndtInput });
  assert.equal(res.status, 403);
  assert.deepEqual(res.body, { error: { code: 'FORBIDDEN', message: 'Acesso não autorizado.' } });
});

test('API: assinatura com segredo errado ou emissor errado é bloqueada (403)', async () => {
  const wrongSecret = await server.request('POST', '/api/v1/calculations/ndt', {
    body: ndtInput, headers: { 'x-nf-sign': netlifySign('segredo-errado') },
  });
  assert.equal(wrongSecret.status, 403);

  const wrongIssuer = jwt.sign({}, PROXY_SECRET, { issuer: 'outro' });
  const res = await server.request('POST', '/api/v1/calculations/ndt', { body: ndtInput, headers: { 'x-nf-sign': wrongIssuer } });
  assert.equal(res.status, 403);
});

test('API: requisição assinada é aceita e o uso guarda a localização enviada pelo Netlify', async () => {
  const geo = Buffer.from(JSON.stringify({ country: { code: 'BR' }, subdivision: { code: 'MG' } })).toString('base64');
  const res = await server.request('POST', '/api/v1/calculations/ndt', {
    body: ndtInput,
    headers: { 'x-nf-sign': netlifySign(), 'x-nf-client-connection-ip': '200.128.0.1', 'x-nf-geo': geo },
  });
  assert.equal(res.status, 201);
  assert.ok(res.body.calculationId);

  const [log] = (await listUsageLogsSince()).filter((item) => item.calculationType === 'ndt_calculation');
  assert.equal(log.country, 'BR');
  assert.equal(log.region, 'MG');
});

test('API: a antiga x-api-key pública não substitui a assinatura', async () => {
  const res = await server.request('GET', '/api/v1/foods', { headers: { 'x-api-key': 'SENHA-VITE-PUBLICA' } });
  assert.equal(res.status, 403);
});

test('API: a v0 foi removida (404 no formato da v1)', async () => {
  const res = await server.request('GET', '/api/foods', { headers: { 'x-nf-sign': netlifySign() } });
  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'NOT_FOUND');
});

test('v1: requisição assinada acessa o catálogo', async () => {
  const res = await server.request('GET', '/api/v1/catalog', { headers: { 'x-nf-sign': netlifySign() } });
  assert.equal(res.status, 200);
});

test('Health check continua público', async () => {
  const res = await server.request('GET', '/');
  assert.equal(res.status, 200);
});
