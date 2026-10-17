require('./helpers/env');
const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { migrateTestDb, startServer } = require('./helpers/server');

const validFood = {
  name: 'Capim teste', category: 'VOLUMOSO',
  MS: 234.4, MO: 892.6, EE: 23.6, PB: 95.5, PDR: 47.93, PNDR: 47.57,
  NDT: 490.8, FDNcp: 635.4, CNF: 138.1, Ca: 5.9, P: 1.4,
};

let server;
let token;
const auth = () => ({ Authorization: `Bearer ${token}` });

test.before(async () => {
  migrateTestDb();
  server = await startServer();
});

test.after(async () => {
  await server.close();
  await require('../lib/prisma').$disconnect();
});

test('login: senha incorreta retorna 401 sem token', async () => {
  const res = await server.request('POST', '/api/admin/login', { body: { password: 'errada' } });
  assert.equal(res.status, 401);
  assert.equal(res.body.token, undefined);
});

test('login: senha correta retorna um token de admin válido', async () => {
  const res = await server.request('POST', '/api/admin/login', { body: { password: 'senha-de-teste' } });
  assert.equal(res.status, 200);
  const payload = jwt.verify(res.body.token, process.env.ADMIN_JWT_SECRET);
  assert.equal(payload.role, 'admin');
  assert.ok(payload.exp > payload.iat);
  token = res.body.token;
});

test('rotas admin: sem token, token inválido ou expirado retornam 401', async () => {
  assert.equal((await server.request('GET', '/api/admin/stats')).status, 401);

  const forged = jwt.sign({ role: 'admin' }, 'outro-segredo-qualquer-com-32-caracteres!!');
  assert.equal((await server.request('GET', '/api/admin/stats', { headers: { Authorization: `Bearer ${forged}` } })).status, 401);

  const expired = jwt.sign({ role: 'admin' }, process.env.ADMIN_JWT_SECRET, { expiresIn: -10 });
  assert.equal((await server.request('GET', '/api/admin/stats', { headers: { Authorization: `Bearer ${expired}` } })).status, 401);

  // A antiga chave x-api-key não dá mais acesso
  assert.equal((await server.request('GET', '/api/admin/stats', { headers: { 'x-api-key': 'qualquer' } })).status, 401);
});

test('rotas admin: token válido acessa as estatísticas', async () => {
  const res = await server.request('GET', '/api/admin/stats?period=7d', { headers: auth() });
  assert.equal(res.status, 200);
  assert.equal(typeof res.body.totalCalculations, 'number');
});

test('CRUD de alimentos: criar, atualizar e deletar com token', async () => {
  const created = await server.request('POST', '/api/admin/foods', {
    headers: auth(),
    body: { ...validFood, id: 9999, createdAt: '2000-01-01T00:00:00.000Z' },
  });
  assert.equal(created.status, 201);
  assert.notEqual(created.body.id, 9999); // id enviado pelo cliente é ignorado
  assert.notEqual(created.body.createdAt, '2000-01-01T00:00:00.000Z');

  const updated = await server.request('PUT', `/api/admin/foods/${created.body.id}`, {
    headers: auth(),
    body: { PB: 100, updatedAt: '2000-01-01T00:00:00.000Z' },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.PB, 100);

  const deleted = await server.request('DELETE', `/api/admin/foods/${created.body.id}`, { headers: auth() });
  assert.equal(deleted.status, 200);
  assert.deepEqual(deleted.body, { success: true });

  const deletedAgain = await server.request('DELETE', `/api/admin/foods/${created.body.id}`, { headers: auth() });
  assert.equal(deletedAgain.status, 404);
});

test('CRUD de alimentos: dados inválidos retornam 400', async () => {
  const res = await server.request('POST', '/api/admin/foods', { headers: auth(), body: { ...validFood, category: 'X' } });
  assert.equal(res.status, 400);

  const badId = await server.request('DELETE', '/api/admin/foods/abc', { headers: auth() });
  assert.equal(badId.status, 400);
});

test('CRUD de alimentos: sem token retorna 401', async () => {
  assert.equal((await server.request('POST', '/api/admin/foods', { body: validFood })).status, 401);
  assert.equal((await server.request('DELETE', '/api/admin/foods/1')).status, 401);
});
