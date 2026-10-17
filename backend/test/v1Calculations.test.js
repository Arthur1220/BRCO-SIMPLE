require('./helpers/env');
const test = require('node:test');
const assert = require('node:assert/strict');
const { migrateTestDb, startServer } = require('./helpers/server');
const { calculateAllRequirements } = require('../domain/requirementService');
const { calculateNdt } = require('../domain/ndtService');

let server;
let prisma;
const foodIds = {};

const requirementsInput = { especie: 'caprino', genotipo: 'leiteiro', sexo: 'femea', pesoInicial: 20, pesoFinal: 30, GMD: 150 };
const ndtInput = { PB: 9.55, EE: 2.36, FDN: 63.54, Lignina: 5.2, MO: 89.26, PIDN: 2.1, PIDA: 0.9 };
const animal = { especie: 'ovino', sexo: 'inteiro', pesoInicial: 25, pesoFinal: 35, GMD: 200 };

test.before(async () => {
  migrateTestDb();
  prisma = require('../lib/prisma');
  const base = { MS: 880, MO: 930, EE: 30, PDR: 50, PNDR: 40, CNF: 300 };
  const foods = [
    { key: 'silagem', name: 'Silagem de milho', category: 'VOLUMOSO', PB: 71.8, NDT: 632.2, FDNcp: 509.3, Ca: 2.8, P: 1.9 },
    { key: 'milho', name: 'Milho fubá', category: 'CONCENTRADO', PB: 92.3, NDT: 844.2, FDNcp: 91.7, Ca: 0.4, P: 2.9 },
    { key: 'soja', name: 'Farelo de soja', category: 'CONCENTRADO', PB: 487.9, NDT: 811.6, FDNcp: 131.8, Ca: 3.4, P: 5.9, defaultMax: 30 },
  ];
  for (const { key, ...food } of foods) {
    foodIds[key] = (await prisma.food.create({ data: { ...base, ...food } })).id;
  }
  server = await startServer();
});

test.after(async () => {
  await server.close();
  await prisma.$disconnect();
});

// ------------------------------------------------------------------
// Exigências
// ------------------------------------------------------------------

test('requirements: responde 201 com highlights, grupos e Location', async () => {
  const res = await server.request('POST', '/api/v1/calculations/requirements', { body: requirementsInput });
  assert.equal(res.status, 201);
  assert.equal(res.headers.get('location'), `/api/v1/calculations/${res.body.calculationId}`);
  assert.equal(res.body.type, 'requirements');
  assert.deepEqual(res.body.input, requirementsInput);

  // Destaques que antes quebravam no frontend (PB nunca aparecia)
  assert.deepEqual(res.body.highlights.map((h) => h.code), ['cms_g_d', 'emt_mcal_d', 'pb_g_d']);
  assert.deepEqual(res.body.groups.map((g) => g.code), ['consumo', 'energia', 'proteina', 'macrominerais']);
  assert.equal(res.body.groups.find((g) => g.code === 'energia').summary.code, 'ndt_g_d');

  // Valores idênticos aos do domínio (a v1 só reorganiza, não recalcula)
  const domain = calculateAllRequirements({ especieId: 1, categoriaAnimalId: 1, sexoId: 3, pesoInicial: 20, pesoFinal: 30, GMD: 150 });
  const pb = res.body.highlights.find((h) => h.code === 'pb_g_d');
  assert.equal(pb.value, domain['Proteína bruta 1'].valor_requerido);
  assert.equal(pb.unit, 'g/d'); // notação padronizada ('g/dia' no domínio)
});

test('requirements: ovino inclui microminerais; inglês traduz labels', async () => {
  const res = await server.request('POST', '/api/v1/calculations/requirements?lang=en', {
    body: { especie: 'ovino', sexo: 'castrado', pesoInicial: 25, pesoFinal: 35, GMD: 200 },
  });
  assert.equal(res.status, 201);
  assert.ok(res.body.groups.some((g) => g.code === 'microminerais'));
  assert.equal(res.body.highlights[0].label, 'Dry matter intake');
});

test('requirements: erros por campo, com código da regra e no idioma pedido', async () => {
  const res = await server.request('POST', '/api/v1/calculations/requirements', {
    body: { ...requirementsInput, pesoFinal: 15, GMD: 5000 },
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION');
  const byPath = Object.fromEntries(res.body.error.fields.map((f) => [f.path, f]));
  assert.equal(byPath.GMD.code, 'too_big');
  assert.equal(byPath.GMD.message, 'Ganho médio diário deve estar entre 1 e 1000 g/d.');

  const en = await server.request('POST', '/api/v1/calculations/requirements?lang=en', { body: { ...requirementsInput, pesoFinal: 15 } });
  assert.deepEqual(en.body.error.fields, [{ path: 'pesoFinal', code: 'final_gt_initial', message: 'Final weight must be greater than initial weight.' }]);
});

test('requirements: genótipo em revisão e combinação inválida são recusados', async () => {
  const nativa = await server.request('POST', '/api/v1/calculations/requirements', { body: { ...requirementsInput, genotipo: 'nativa' } });
  assert.equal(nativa.status, 400);
  assert.equal(nativa.body.error.fields[0].code, 'valid_genotype');

  const ovinaFemea = await server.request('POST', '/api/v1/calculations/requirements', { body: { ...animal, sexo: 'femea' } });
  assert.equal(ovinaFemea.body.error.fields[0].code, 'valid_sex');

  const especie = await server.request('POST', '/api/v1/calculations/requirements', { body: { ...requirementsInput, especie: 'bovino' } });
  assert.equal(especie.body.error.fields[0].path, 'especie');
  assert.match(especie.body.error.fields[0].message, /caprino, ovino/);
});

// ------------------------------------------------------------------
// NDT
// ------------------------------------------------------------------

test('ndt: calcula com Lignina (nome corrigido) e PIDN/PIDA opcionais', async () => {
  const full = await server.request('POST', '/api/v1/calculations/ndt', { body: ndtInput });
  assert.equal(full.status, 201);
  const domain = calculateNdt({ ...ndtInput, Ligrina: ndtInput.Lignina });
  assert.equal(full.body.highlights[0].code, 'ndt_pct');
  assert.equal(full.body.highlights[0].value, domain['Nutrientes digestíveis totais'].valor);

  const { PIDN, PIDA, ...withoutFractions } = ndtInput;
  const simple = await server.request('POST', '/api/v1/calculations/ndt', { body: withoutFractions });
  assert.equal(simple.status, 201);
  const simpleDomain = calculateNdt({ ...withoutFractions, Ligrina: ndtInput.Lignina, PIDN: 0, PIDA: 0 });
  assert.equal(simple.body.highlights[0].value, simpleDomain['Nutrientes digestíveis totais'].valor);
});

test('ndt: regras de composição', async () => {
  const res = await server.request('POST', '/api/v1/calculations/ndt', { body: { ...ndtInput, Lignina: 80 } });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.fields[0].code, 'lignina_lte_fdn');
});

// ------------------------------------------------------------------
// Dieta
// ------------------------------------------------------------------

test('diet: solução ótima com kg, custo e status do balanço calculados no servidor', async () => {
  const res = await server.request('POST', '/api/v1/calculations/diet', {
    body: {
      animal,
      ingredients: [
        { foodId: foodIds.silagem, price: 0.3 },
        { foodId: foodIds.milho, price: 1.2 },
        { foodId: foodIds.soja, price: 2.5 },
      ],
    },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.status, 'optimal');
  const { solution } = res.body;
  const totalPercent = solution.ingredients.reduce((sum, ing) => sum + ing.percent, 0);
  assert.ok(Math.abs(totalPercent - 100) < 0.1);

  const soja = solution.ingredients.find((ing) => ing.foodId === foodIds.soja);
  assert.equal(soja.max, 30); // padrão do alimento cadastrado (defaultMax)
  assert.ok(soja.percent <= 30.01);
  assert.equal(soja.categoryLabel, 'Concentrado');

  const expectedKg = Math.round(solution.totals.intakeKgPerDay * soja.percent / 100 * 1000) / 1000;
  assert.ok(Math.abs(soja.kgPerDay - expectedKg) <= 0.002);

  assert.deepEqual(solution.balance.map((b) => b.code), ['pb', 'ndt', 'ca', 'p']);
  assert.ok(solution.balance.every((b) => ['ideal', 'deficit', 'excess', 'info'].includes(b.status)));
  assert.equal(res.body.requirements.highlights[0].code, 'cms_g_d');
});

test('diet: a composição de alimentos cadastrados vem do banco, não do cliente', async () => {
  const res = await server.request('POST', '/api/v1/calculations/diet', {
    body: { animal, ingredients: [{ foodId: foodIds.silagem, PB: 9999, NDT: 9999 }, { foodId: foodIds.milho }] },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.input.ingredients[0].PB, undefined); // campo desconhecido descartado
});

test('diet: conflito devolve as duas opções para o usuário escolher', async () => {
  const res = await server.request('POST', '/api/v1/calculations/diet', {
    body: { animal, ingredients: [{ foodId: foodIds.silagem }, { foodId: foodIds.milho, max: 1 }] },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.status, 'conflict');
  assert.deepEqual(res.body.options.map((o) => o.code), ['ideal', 'realistic']);
  assert.ok(res.body.options.every((o) => o.label && o.description && o.solution.balance.length === 4));
});

test('diet: alimento personalizado em g/kg MS (mesma unidade do banco)', async () => {
  const res = await server.request('POST', '/api/v1/calculations/diet', {
    body: {
      animal,
      ingredients: [
        { custom: { name: 'Capim local', category: 'VOLUMOSO', MS: 300, PB: 80, NDT: 550, FDNcp: 600, Ca: 4, P: 2 } },
        { foodId: foodIds.milho },
        { foodId: foodIds.soja },
      ],
    },
  });
  assert.equal(res.status, 201);
  const custom = (res.body.solution || res.body.options[0].solution).ingredients[0];
  assert.equal(custom.foodId, null);
  assert.equal(custom.name, 'Capim local');
});

test('diet: validações (alimento inexistente, duplicado, fonte, limites, quantidade)', async () => {
  const post = (ingredients) => server.request('POST', '/api/v1/calculations/diet', { body: { animal, ingredients } });

  const missing = await post([{ foodId: 99999 }]);
  assert.equal(missing.status, 400);
  assert.deepEqual(missing.body.error.fields.map((f) => [f.path, f.code]), [['ingredients.0.foodId', 'food_not_found']]);

  const duplicate = await post([{ foodId: foodIds.milho }, { foodId: foodIds.milho }]);
  assert.equal(duplicate.body.error.fields[0].code, 'no_duplicates');

  const noSource = await post([{ price: 1 }]);
  assert.equal(noSource.body.error.fields[0].code, 'one_food_source');

  const limits = await post([{ foodId: foodIds.milho, min: 60, max: 40 }]);
  assert.equal(limits.body.error.fields[0].code, 'min_lte_max');

  const tooMany = await post(Array.from({ length: 11 }, () => ({ foodId: foodIds.milho })));
  assert.equal(tooMany.body.error.fields[0].path, 'ingredients');

  const maintenance = await server.request('POST', '/api/v1/calculations/diet', {
    body: { animal: { ...animal, GMD: 0 }, ingredients: [{ foodId: foodIds.silagem }, { foodId: foodIds.milho }] },
  });
  assert.equal(maintenance.status, 201); // GMD 0 (mantença) é válido na dieta
});

// ------------------------------------------------------------------
// Persistência, compartilhamento e exportação
// ------------------------------------------------------------------

test('cálculo salvo: GET por id em outro idioma e validade de 6 meses', async () => {
  const created = await server.request('POST', '/api/v1/calculations/requirements', { body: requirementsInput });
  const { calculationId, createdAt, expiresAt } = created.body;
  const days = (new Date(expiresAt) - new Date(createdAt)) / 86400000;
  assert.equal(days, 180);

  const fetched = await server.request('GET', `/api/v1/calculations/${calculationId}?lang=en`);
  assert.equal(fetched.status, 200);
  assert.equal(fetched.body.highlights[0].label, 'Dry matter intake');
  assert.deepEqual(fetched.body.highlights.map((h) => h.value), created.body.highlights.map((h) => h.value));
});

test('cálculo salvo: inexistente ou vencido responde 404; o expurgo remove os vencidos', async () => {
  const missing = await server.request('GET', '/api/v1/calculations/nao-existe');
  assert.equal(missing.status, 404);
  assert.equal(missing.body.error.code, 'NOT_FOUND');

  const created = await server.request('POST', '/api/v1/calculations/ndt', { body: ndtInput });
  await prisma.calculation.update({ where: { id: created.body.calculationId }, data: { expiresAt: new Date(Date.now() - 1000) } });
  assert.equal((await server.request('GET', `/api/v1/calculations/${created.body.calculationId}`)).status, 404);

  const { purgeExpiredCalculations } = require('../services/calculationService');
  assert.ok((await purgeExpiredCalculations()) >= 1);
  assert.equal(await prisma.calculation.count({ where: { id: created.body.calculationId } }), 0);
});

test('exportação CSV: gerada do cálculo salvo, no idioma pedido', async () => {
  const created = await server.request('POST', '/api/v1/calculations/requirements', { body: requirementsInput });
  const res = await server.request('GET', `/api/v1/calculations/${created.body.calculationId}/export.csv`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/csv/);
  assert.match(res.headers.get('content-disposition'), new RegExp(`brco-requirements-${created.body.calculationId}\\.csv`));
  assert.ok(res.text.startsWith('Seção,Item,Código,Valor,Referência,Unidade,Status')); // fetch remove o BOM ao decodificar
  const raw = await server.rawGet(`/api/v1/calculations/${created.body.calculationId}/export.csv`);
  assert.ok(raw.text.startsWith(String.fromCharCode(0xfeff)), 'CSV deve começar com BOM UTF-8 (Excel)');
  assert.ok(res.text.includes('Proteína bruta,pb_g_d,'));

  const en = await server.request('GET', `/api/v1/calculations/${created.body.calculationId}/export.csv?lang=en`);
  assert.ok(en.text.startsWith('Section,Item,Code,Value,Reference,Unit,Status'));

  const diet = await server.request('POST', '/api/v1/calculations/diet', { body: { animal, ingredients: [{ foodId: foodIds.silagem }, { foodId: foodIds.milho, max: 1 }] } });
  const dietCsv = await server.request('GET', `/api/v1/calculations/${diet.body.calculationId}/export.csv`);
  assert.ok(dietCsv.text.includes('Priorizar a nutrição - Ingredientes'));
  assert.ok(dietCsv.text.includes('Respeitar meus limites - Balanço nutricional'));
});

test('uso continua registrado para as estatísticas do admin', async () => {
  const before = await prisma.calculationLog.count({ where: { calculationType: 'diet_calculation' } });
  await server.request('POST', '/api/v1/calculations/diet', { body: { animal, ingredients: [{ foodId: foodIds.silagem }, { foodId: foodIds.milho }] } });
  assert.equal(await prisma.calculationLog.count({ where: { calculationType: 'diet_calculation' } }), before + 1);
});

test('JSON malformado na v1 responde no formato de erro da v1', async () => {
  const res = await fetch(`${server.baseUrl}/api/v1/calculations/ndt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"PB":' });
  const body = await res.json();
  assert.equal(res.status, 400);
  assert.equal(body.error.code, 'VALIDATION');
});
