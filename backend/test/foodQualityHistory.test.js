require('./helpers/env');
const test = require('node:test');
const assert = require('node:assert/strict');
const { setupTestTables, startServer } = require('./helpers/server');
const { checkFoodQuality } = require('../validation/foodQuality');
const { diffFood } = require('../repositories/foodHistoryRepository');
const { initialFoods } = require('../scripts/seed-foods');

// Capim tanzânia do seed: PB + EE + CNF + FDNcp = MO e PDR + PNDR = PB.
const capim = { name: 'Capim teste', category: 'VOLUMOSO', MS: 234.4, MO: 892.6, EE: 23.6, PB: 95.5, PDR: 47.93, PNDR: 47.57, NDT: 490.8, FDNcp: 635.4, CNF: 138.1, Ca: 5.9, P: 1.4 };
const codes = (food) => checkFoodQuality(food).map((w) => w.code);

let server;
let auth;

test.before(async () => {
  await setupTestTables();
  server = await startServer();
  const login = await server.request('POST', '/api/v1/admin/login', { body: { password: 'senha-de-teste', name: 'Professora Ana' } });
  assert.equal(login.body.name, 'Professora Ana');
  auth = { Authorization: `Bearer ${login.body.token}` };
});

test.after(async () => {
  await server.close();
});

// ------------------------------------------------------------------
// Validação do cadastro
// ------------------------------------------------------------------

test('qualidade: alimento consistente não gera aviso', () => {
  assert.deepEqual(codes(capim), []);
});

test('qualidade: volumosos e concentrados do seed passam (suplementos só pedem Cu e espécie)', () => {
  for (const food of initialFoods.filter((f) => f.category !== 'SUPLEMENTO')) {
    // Achado real: no feno de Tifton do seed, PB + EE + CNF + FDNcp passa a MO em 7%.
    const expected = food.name === 'Feno de Tifton' ? ['composition_sum'] : [];
    assert.deepEqual(codes(food), expected, food.name);
  }
  assert.deepEqual(codes(initialFoods.find((f) => f.name === 'Calcáreo')), ['supplement_no_copper', 'supplement_no_species']);
});

test('qualidade: composição que não fecha com a MO', () => {
  assert.ok(codes({ ...capim, FDNcp: 735.4 }).includes('composition_sum'));
  assert.ok(!codes({ ...capim, FDNcp: 650 }).includes('composition_sum')); // dentro de 5%
});

test('qualidade: PDR + PNDR longe da PB', () => {
  assert.ok(codes({ ...capim, PDR: 80 }).includes('protein_fractions'));
});

test('qualidade: Ca e P fora da faixa (típico de valor em % no lugar de g/kg)', () => {
  assert.ok(codes({ ...capim, Ca: 0.29 }).includes('ca_range'));
  assert.ok(codes({ ...capim, P: 14 }).includes('p_range'));
  assert.ok(!codes({ ...capim, Ca: 38.8 }).includes('ca_range')); // palma forrageira
});

test('qualidade: MS baixa, NDT zerado e suplemento com cobre e espécie', () => {
  assert.ok(codes({ ...capim, category: 'CONCENTRADO', MS: 88 }).includes('ms_low'));
  assert.ok(codes({ ...capim, NDT: 0 }).includes('ndt_missing'));
  const sal = { name: 'Sal', category: 'SUPLEMENTO', MS: 990, Ca: 145, P: 85, Cu: 10, targetSpecies: 'OVINO' };
  assert.deepEqual(codes(sal), []);
});

test('API: verifica sem salvar e devolve a mensagem traduzida', async () => {
  const res = await server.request('POST', '/api/v1/admin/foods/check?lang=en', { body: { ...capim, Ca: 0.29 }, headers: auth });
  assert.equal(res.status, 200);
  assert.equal(res.body.quality[0].code, 'ca_range');
  assert.match(res.body.quality[0].message, /Calcium of 0.29 g\/kg DM/);

  const anon = await server.request('POST', '/api/v1/admin/foods/check', { body: capim });
  assert.equal(anon.status, 401);
});

// ------------------------------------------------------------------
// Histórico de alterações
// ------------------------------------------------------------------

test('histórico: diferença só com os campos que mudaram', () => {
  assert.deepEqual(diffFood({ PB: 90, EE: 20, updatedAt: 'a' }, { PB: 95, EE: 20, updatedAt: 'b' }), [{ field: 'PB', before: 90, after: 95 }]);
});

test('API: cadastro, alteração e exclusão ficam no histórico com quem fez', async () => {
  const created = await server.request('POST', '/api/v1/admin/foods', { body: capim, headers: auth });
  assert.equal(created.status, 201);
  assert.deepEqual(created.body.quality, []);
  const { id } = created.body;

  const updated = await server.request('PUT', `/api/v1/admin/foods/${id}`, { body: { PB: 100, Ca: 0.3 }, headers: auth });
  assert.equal(updated.status, 200);
  assert.ok(updated.body.quality.some((w) => w.code === 'ca_range'));

  // Salvar sem mudar nada não gera registro
  await server.request('PUT', `/api/v1/admin/foods/${id}`, { body: { PB: 100 }, headers: auth });

  const history = await server.request('GET', `/api/v1/admin/foods/${id}/history`, { headers: auth });
  assert.equal(history.status, 200);
  assert.deepEqual(history.body.map((h) => h.action), ['update', 'create']);
  assert.equal(history.body[0].actor, 'Professora Ana');
  assert.equal(history.body[0].actionLabel, 'Alteração');
  assert.deepEqual(history.body[0].changes, [{ field: 'Ca', before: 5.9, after: 0.3 }, { field: 'PB', before: 95.5, after: 100 }]);

  assert.equal((await server.request('DELETE', `/api/v1/admin/foods/${id}`, { headers: auth })).status, 204);
  const recent = await server.request('GET', '/api/v1/admin/history', { headers: auth });
  assert.equal(recent.body[0].action, 'delete');
  assert.equal(recent.body[0].foodName, 'Capim teste');
  assert.ok(recent.body[0].changes.some((c) => c.field === 'PB' && c.before === 100 && c.after === null));
});

test('API: lista de qualidade de todos os alimentos', async () => {
  await server.request('POST', '/api/v1/admin/foods', { body: { ...capim, name: 'Capim com erro', Ca: 0.29 }, headers: auth });
  const res = await server.request('GET', '/api/v1/admin/foods/quality', { headers: auth });
  assert.equal(res.status, 200);
  const item = res.body.find((f) => f.name === 'Capim com erro');
  assert.deepEqual(item.quality.map((w) => w.code), ['ca_range']);
});
