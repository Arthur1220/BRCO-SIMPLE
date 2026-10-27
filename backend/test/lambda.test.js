require('./helpers/env');
const test = require('node:test');
const assert = require('node:assert/strict');
const { setupTestTables } = require('./helpers/server');

/**
 * Evento no formato da Lambda Function URL (payload 2.0).
 */
function functionUrlEvent(method, rawPath, { body, headers = {}, rawQueryString = '' } = {}) {
  return {
    version: '2.0',
    routeKey: '$default',
    rawPath,
    rawQueryString,
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '200.128.0.1', ...headers },
    requestContext: {
      http: { method, path: rawPath, protocol: 'HTTP/1.1', sourceIp: '200.128.0.1', userAgent: 'node-test' },
      timeEpoch: Date.now(),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    isBase64Encoded: false,
  };
}

let handler;

test.before(async () => {
  await setupTestTables();
  ({ handler } = require('../lambda'));
});

test('lambda: health check e catálogo pelo evento da Function URL', async () => {
  const health = await handler(functionUrlEvent('GET', '/'), {});
  assert.equal(health.statusCode, 200);
  assert.equal(JSON.parse(health.body).status, 'success');

  const catalog = await handler(functionUrlEvent('GET', '/api/v1/catalog', { rawQueryString: 'lang=en' }), {});
  assert.equal(catalog.statusCode, 200);
  assert.equal(catalog.headers['content-language'], 'en');
});

test('lambda: cálculo é salvo e pode ser lido e exportado em CSV', async () => {
  const body = { PB: 9.55, EE: 2.36, FDN: 63.54, Lignina: 5.2, MO: 89.26, PIDN: 2.1, PIDA: 0.9 };
  const created = await handler(functionUrlEvent('POST', '/api/v1/calculations/ndt', { body }), {});
  assert.equal(created.statusCode, 201);
  const { calculationId } = JSON.parse(created.body);

  const fetched = await handler(functionUrlEvent('GET', `/api/v1/calculations/${calculationId}`), {});
  assert.equal(fetched.statusCode, 200);
  assert.equal(JSON.parse(fetched.body).calculationId, calculationId);

  const csv = await handler(functionUrlEvent('GET', `/api/v1/calculations/${calculationId}/export.csv`), {});
  assert.equal(csv.statusCode, 200);
  assert.match(csv.headers['content-type'], /text\/csv/);
});
