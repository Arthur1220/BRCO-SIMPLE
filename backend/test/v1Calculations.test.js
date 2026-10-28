require('./helpers/env');
const test = require('node:test');
const assert = require('node:assert/strict');
const { UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { setupTestTables, startServer } = require('./helpers/server');
const { db, TABLES } = require('../lib/dynamo');
const { createFood } = require('../repositories/foodsRepository');
const { listUsageLogsSince } = require('../repositories/usageLogsRepository');
const { calculateAllRequirements } = require('../domain/requirementService');
const { calculateNdt } = require('../domain/ndtService');

let server;
const foodIds = {};

const requirementsInput = { especie: 'caprino', genotipo: 'leiteiro', sexo: 'femea', pesoInicial: 20, pesoFinal: 30, GMD: 150 };
const ndtInput = { PB: 9.55, EE: 2.36, FDN: 63.54, Lignina: 5.2, MO: 89.26, PIDN: 2.1, PIDA: 0.9 };
const animal = { especie: 'ovino', sexo: 'inteiro', pesoInicial: 25, pesoFinal: 35, GMD: 200 };

test.before(async () => {
  await setupTestTables();
  const base = { MS: 880, MO: 930, EE: 30, PDR: 50, PNDR: 40, CNF: 300 };
  const foods = [
    { key: 'silagem', name: 'Silagem de milho', category: 'VOLUMOSO', PB: 71.8, NDT: 632.2, FDNcp: 509.3, Ca: 2.8, P: 1.9 },
    { key: 'milho', name: 'Milho fubá', category: 'CONCENTRADO', PB: 92.3, NDT: 844.2, FDNcp: 91.7, Ca: 0.4, P: 2.9 },
    { key: 'soja', name: 'Farelo de soja', category: 'CONCENTRADO', PB: 487.9, NDT: 811.6, FDNcp: 131.8, Ca: 3.4, P: 5.9, defaultMax: 30 },
    { key: 'calcario', name: 'Calcário', category: 'SUPLEMENTO', MS: 992, MO: 0, EE: 0, PDR: 0, PNDR: 0, CNF: 0, PB: 0, NDT: 0, FDNcp: 0, Ca: 370.2, P: 0.2, Cu: 0, defaultMax: 1.5 },
    { key: 'salBovino', name: 'Sal mineral bovino', category: 'SUPLEMENTO', MS: 990, MO: 0, EE: 0, PDR: 0, PNDR: 0, CNF: 0, PB: 0, NDT: 0, FDNcp: 0, Ca: 145, P: 85, Cu: 1500, targetSpecies: 'BOVINO', defaultMax: 1.5 },
  ];
  for (const { key, ...food } of foods) {
    foodIds[key] = (await createFood({ ...base, ...food })).id;
  }
  server = await startServer();
});

test.after(async () => {
  await server.close();
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
        { foodId: foodIds.calcario, price: 0.5 },
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

  assert.deepEqual(solution.balance.map((b) => b.code), ['pb', 'ndt', 'pdr', 'pndr', 'ca', 'p', 'cu', 'zn', 'mn', 'fe', 'co']);
  assert.equal(solution.balance.find((b) => b.code === 'zn').supplied, null); // nenhum alimento com Zn
  assert.ok(solution.balance.every((b) => ['ideal', 'deficit', 'excess', 'info'].includes(b.status)));
  assert.equal(res.body.requirements.highlights[0].code, 'cms_g_d');

  // Travas de segurança e avisos já traduzidos
  const caP = solution.safetyChecks.find((c) => c.code === 'ca_p');
  assert.equal(caP.label, 'Relação cálcio:fósforo');
  assert.equal(caP.ok, true);
  assert.ok(solution.warnings.every((w) => w.message && w.severityLabel));
  assert.ok(solution.warnings.some((w) => w.code === 'missing_data' && w.message.includes('cobre')));
});

test('diet: preço por kg de matéria natural, trato do lote e custo por kg de ganho', async () => {
  const body = (priceBasis) => ({
    animal,
    priceBasis,
    lot: { animals: 20, feedingsPerDay: 2 },
    ingredients: [
      { foodId: foodIds.silagem, price: 0.1 },
      { foodId: foodIds.milho, price: 1.0 },
      { foodId: foodIds.soja, price: 2.0 },
      { foodId: foodIds.calcario, price: 0.5 },
    ],
  });
  const res = await server.request('POST', '/api/v1/calculations/diet', { body: body('MN') });
  assert.equal(res.status, 201);
  const { solution } = res.body;
  assert.equal(solution.priceBasis, 'MN');

  // R$/kg MN informado → R$/kg MS no cálculo (MS do cadastro: 880 g/kg)
  const milho = solution.ingredients.find((ing) => ing.foodId === foodIds.milho);
  assert.ok(Math.abs(milho.price - 1.0 / 0.88) < 0.001);
  assert.equal(milho.priceAsFed, 1);
  assert.ok(Math.abs(milho.kgAsFedPerDay - milho.kgPerDay / 0.88) < 0.002);

  // Lote: 20 animais, 2 tratos
  const { feeding, totals } = solution;
  assert.equal(feeding.animals, 20);
  assert.ok(Math.abs(feeding.kgDryMatterPerDay - totals.intakeKgPerDay * 20) < 0.02);
  // Quantidades pequenas por trato não somem no arredondamento (calcário: poucos gramas)
  const calcarioTrato = feeding.perFeeding.find((item) => item.foodId === foodIds.calcario);
  assert.ok(calcarioTrato.kgAsFed > 0 && calcarioTrato.kgAsFed < 1);
  const milhoTrato = feeding.perFeeding.find((item) => item.foodId === foodIds.milho);
  assert.ok(Math.abs(milhoTrato.kgAsFed - (milho.kgAsFedPerDay * 20) / 2) < 0.02);
  assert.ok(Math.abs(totals.costPerKgGain - totals.costPerDay / 0.2) < 0.02); // GMD 200 g/d

  // Mesmos números informados como R$/kg MS mudam o preço usado
  const ms = await server.request('POST', '/api/v1/calculations/diet', { body: body('MS') });
  assert.equal(ms.body.solution.ingredients.find((ing) => ing.foodId === foodIds.milho).price, 1);

  // Explicação do custo
  assert.ok(Array.isArray(solution.costInsights.limiting));
  assert.ok(solution.costInsights.limiting.every((item) => item.message));
});

test('diet: preço por matéria natural exige MS no alimento personalizado', async () => {
  const res = await server.request('POST', '/api/v1/calculations/diet', {
    body: {
      animal,
      priceBasis: 'MN',
      ingredients: [{ custom: { name: 'Sem MS', category: 'VOLUMOSO', MS: 0, PB: 80, NDT: 550, FDNcp: 600, Ca: 4, P: 2 }, price: 0.2 }, { foodId: foodIds.milho }],
    },
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.fields[0].code, 'ms_required_for_mn_price');
});

test('diet: sal mineral de bovino é retirado da dieta de ovinos', async () => {
  const res = await server.request('POST', '/api/v1/calculations/diet', {
    body: { animal, ingredients: [{ foodId: foodIds.silagem }, { foodId: foodIds.milho }, { foodId: foodIds.soja }, { foodId: foodIds.calcario }, { foodId: foodIds.salBovino, min: 1 }] },
  });
  assert.equal(res.status, 201);
  const solution = res.body.solution ?? res.body.options[1].solution;
  assert.equal(solution.ingredients.find((ing) => ing.foodId === foodIds.salBovino).percent, 0);
  const blocked = solution.warnings.find((w) => w.code === 'supplement_blocked_species');
  assert.equal(blocked.severity, 'blocked');
  assert.match(blocked.message, /Sal mineral bovino/);
});

test('diet: sem fonte de cálcio, macho não recebe dieta e o motivo é explicado', async () => {
  const res = await server.request('POST', '/api/v1/calculations/diet', {
    body: { animal, ingredients: [{ foodId: foodIds.silagem }, { foodId: foodIds.milho }, { foodId: foodIds.soja }] },
  });
  assert.equal(res.body.status, 'conflict');
  assert.match(res.body.statusLabel, /Não há dieta segura/);
  for (const option of res.body.options) {
    assert.equal(option.solution.feasible, false);
    const blocked = option.solution.warnings.find((w) => w.code === 'safety_infeasible');
    assert.match(blocked.message, /Relação cálcio:fósforo/);
  }
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
    body: { animal, ingredients: [{ foodId: foodIds.silagem }, { foodId: foodIds.milho, max: 1 }, { foodId: foodIds.calcario }] },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.status, 'conflict');
  assert.deepEqual(res.body.options.map((o) => o.code), ['ideal', 'realistic']);
  assert.ok(res.body.options.every((o) => o.label && o.description && o.solution.balance.length === 11));
});

test('diet: alimento personalizado em g/kg MS (mesma unidade do banco)', async () => {
  const res = await server.request('POST', '/api/v1/calculations/diet', {
    body: {
      animal,
      ingredients: [
        { custom: { name: 'Capim local', category: 'VOLUMOSO', MS: 300, PB: 80, NDT: 550, FDNcp: 600, Ca: 4, P: 2 } },
        { foodId: foodIds.milho },
        { foodId: foodIds.soja },
        { custom: { name: 'Calcário local', category: 'SUPLEMENTO', MS: 990, PB: 0, NDT: 0, FDNcp: 0, Ca: 380, P: 0, Cu: 0, EE: 0, CNF: 0 } },
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

test('cálculo salvo: inexistente ou vencido responde 404; o TTL do DynamoDB fica em 6 meses', async () => {
  const missing = await server.request('GET', '/api/v1/calculations/nao-existe');
  assert.equal(missing.status, 404);
  assert.equal(missing.body.error.code, 'NOT_FOUND');

  const created = await server.request('POST', '/api/v1/calculations/ndt', { body: ndtInput });
  const key = { id: created.body.calculationId };
  const { Item } = await db.send(new GetCommand({ TableName: TABLES.calculations, Key: key }));
  const { RETENTION_DAYS } = require('../services/calculationService');
  assert.equal(Item.ttl, Math.floor(Date.parse(Item.expiresAt) / 1000));
  assert.equal(Math.round((Date.parse(Item.expiresAt) - Date.parse(Item.createdAt)) / 86400000), RETENTION_DAYS);

  // Vencido mas ainda não apagado pelo TTL (o DynamoDB pode levar dias): já responde 404
  await db.send(new UpdateCommand({
    TableName: TABLES.calculations,
    Key: key,
    UpdateExpression: 'SET expiresAt = :past',
    ExpressionAttributeValues: { ':past': new Date(Date.now() - 1000).toISOString() },
  }));
  assert.equal((await server.request('GET', `/api/v1/calculations/${created.body.calculationId}`)).status, 404);
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
  const countDiet = async () => (await listUsageLogsSince()).filter((log) => log.calculationType === 'diet_calculation').length;
  const before = await countDiet();
  await server.request('POST', '/api/v1/calculations/diet', { body: { animal, ingredients: [{ foodId: foodIds.silagem }, { foodId: foodIds.milho }] } });
  assert.equal(await countDiet(), before + 1);
});

test('JSON malformado na v1 responde no formato de erro da v1', async () => {
  const res = await fetch(`${server.baseUrl}/api/v1/calculations/ndt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"PB":' });
  const body = await res.json();
  assert.equal(res.status, 400);
  assert.equal(body.error.code, 'VALIDATION');
});
