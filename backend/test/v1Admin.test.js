require('./helpers/env');
const test = require('node:test');
const assert = require('node:assert/strict');
const { setupTestTables, startServer } = require('./helpers/server');
const { createUsageLog } = require('../repositories/usageLogsRepository');

const validFood = {
  name: 'Capim teste', category: 'VOLUMOSO',
  MS: 234.4, MO: 892.6, EE: 23.6, PB: 95.5, PDR: 47.93, PNDR: 47.57,
  NDT: 490.8, FDNcp: 635.4, CNF: 138.1, Ca: 5.9, P: 1.4,
};

let server;
let auth;

test.before(async () => {
  await setupTestTables();
  server = await startServer();
});

test.after(async () => {
  await server.close();
});

test('v1 login: senha errada responde 401 no formato v1 e no idioma pedido', async () => {
  const res = await server.request('POST', '/api/v1/admin/login?lang=en', { body: { password: 'errada' } });
  assert.equal(res.status, 401);
  assert.deepEqual(res.body, { error: { code: 'UNAUTHORIZED', message: 'Incorrect password.' } });
});

test('v1 login: senha correta devolve token e validade', async () => {
  const res = await server.request('POST', '/api/v1/admin/login', { body: { password: 'senha-de-teste' } });
  assert.equal(res.status, 200);
  assert.equal(res.body.expiresIn, 7200);
  auth = { Authorization: `Bearer ${res.body.token}` };
});

test('v1 admin: sem token responde 401 no formato v1', async () => {
  const res = await server.request('GET', '/api/v1/admin/stats');
  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, 'UNAUTHORIZED');
});

test('v1 admin: estatísticas com labels dos tipos e período validado', async () => {
  await createUsageLog({ calculationType: 'requirement_especie_2', country: 'BR' });

  const stats = await server.request('GET', '/api/v1/admin/stats?period=7d&lang=en', { headers: auth });
  assert.equal(stats.status, 200);
  assert.deepEqual(stats.body.statsByType.find((s) => s.type === 'requirement_especie_2').label, 'Requirements · Sheep');

  const logs = await server.request('GET', '/api/v1/admin/logs', { headers: auth });
  assert.equal(logs.body[0].label, 'Exigências · Ovino');

  const invalid = await server.request('GET', '/api/v1/admin/stats?period=99d', { headers: auth });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.error.fields[0].code, 'invalid_enum_value');
});

test('v1 admin: gráfico em "all" começa no primeiro registro (antes vinha vazio)', async () => {
  const tenDaysAgo = new Date(Date.now() - 10 * 86400000);
  await createUsageLog({ calculationType: 'ndt_calculation', createdAt: tenDaysAgo });

  const res = await server.request('GET', '/api/v1/admin/stats/over-time?period=all', { headers: auth });
  assert.equal(res.status, 200);
  assert.ok(res.body.length >= 10);
  assert.ok(res.body.reduce((sum, point) => sum + point.count, 0) >= 2);

  // Em 30d o registro de 10 dias atrás entra; em 7d não
  const last30 = await server.request('GET', '/api/v1/admin/stats?period=30d', { headers: auth });
  const last7 = await server.request('GET', '/api/v1/admin/stats?period=7d', { headers: auth });
  assert.equal(last30.body.totalCalculations - last7.body.totalCalculations, 1);
});

test('v1 foods: CRUD com label de categoria, unidade explícita e 204 no delete', async () => {
  const created = await server.request('POST', '/api/v1/admin/foods?lang=en', { headers: auth, body: { ...validFood, id: 999 } });
  assert.equal(created.status, 201);
  assert.notEqual(created.body.id, 999);
  assert.equal(created.body.categoryLabel, 'Roughage');
  assert.equal(created.body.unit, 'g/kg MS');

  const list = await server.request('GET', '/api/v1/foods');
  assert.ok(list.body.some((f) => f.id === created.body.id && f.categoryLabel === 'Volumoso'));

  const updated = await server.request('PUT', `/api/v1/admin/foods/${created.body.id}`, { headers: auth, body: { PB: 100 } });
  assert.equal(updated.body.PB, 100);

  const deleted = await server.request('DELETE', `/api/v1/admin/foods/${created.body.id}`, { headers: auth });
  assert.equal(deleted.status, 204);

  const again = await server.request('DELETE', `/api/v1/admin/foods/${created.body.id}`, { headers: auth });
  assert.equal(again.status, 404);
  assert.equal(again.body.error.code, 'NOT_FOUND');
});

test('v1 foods: validação com erros por campo', async () => {
  const res = await server.request('POST', '/api/v1/admin/foods', { headers: auth, body: { ...validFood, category: 'X', PB: -1 } });
  assert.equal(res.status, 400);
  assert.deepEqual(res.body.error.fields.map((f) => f.path).sort(), ['PB', 'category']);
});

test('OpenAPI v1: toda rota da v1 está documentada', async () => {
  const doc = (await server.request('GET', '/api-docs/v1.json')).body;
  const documented = new Set(
    Object.entries(doc.paths).flatMap(([path, methods]) => Object.keys(methods).map((m) => `${m.toUpperCase()} ${path.replace(/\{(\w+)\}/g, ':$1')}`))
  );

  const router = require('../routes/v1');
  const routes = [];
  const collect = (stack, prefix) => {
    for (const layer of stack) {
      if (layer.route) {
        for (const method of Object.keys(layer.route.methods)) routes.push(`${method.toUpperCase()} /api/v1${prefix}${layer.route.path}`);
      } else if (layer.name === 'router' && layer.handle.stack) {
        const mount = layer.regexp.source.match(/\^\\\/(\w+)/);
        collect(layer.handle.stack, mount ? `${prefix}/${mount[1]}` : prefix);
      }
    }
  };
  collect(router.stack, '');

  assert.ok(routes.length >= 14);
  const undocumented = routes.filter((route) => !documented.has(route));
  assert.deepEqual(undocumented, []);
});
