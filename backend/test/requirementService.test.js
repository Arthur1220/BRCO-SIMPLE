require('./helpers/env');
const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateAllRequirements } = require('../services/requirementService');
const { requirementCases } = require('./fixtures/goldenCases');
const golden = require('./fixtures/golden.json');

test('calculateAllRequirements: resultados batem com os valores de referência (golden)', async (t) => {
  for (const { name, input } of requirementCases) {
    await t.test(name, () => {
      assert.deepEqual(calculateAllRequirements(input), golden.requirements[name]);
    });
  }
});

test('calculateAllRequirements: todos os valores são números finitos e não negativos', () => {
  for (const { input } of requirementCases) {
    const result = calculateAllRequirements(input);
    for (const [key, item] of Object.entries(result)) {
      assert.ok(Number.isFinite(item.valor_requerido), `${key} não é finito`);
      assert.ok(item.valor_requerido >= 0, `${key} é negativo`);
    }
  }
});

test('calculateAllRequirements: maior ganho de peso exige mais energia e proteína', () => {
  const base = { especieId: 2, categoriaAnimalId: null, sexoId: 1, pesoInicial: 25, pesoFinal: 35 };
  const low = calculateAllRequirements({ ...base, GMD: 100 });
  const high = calculateAllRequirements({ ...base, GMD: 250 });
  assert.ok(high['Energia metabolizável total'].valor_requerido > low['Energia metabolizável total'].valor_requerido);
  assert.ok(high['Proteína bruta 1'].valor_requerido > low['Proteína bruta 1'].valor_requerido);
});

test.todo('caprinos com genótipo 2 (nativa) ou 3 (corte) não devem quebrar', () => {
  // Hoje lança "Cannot read properties of undefined (reading 'ELg_FACTOR')":
  // as constantes NATIVA/CORTE não são divididas por sexo, mas _getSexoConfig espera que sejam.
  for (const categoriaAnimalId of [2, 3]) {
    calculateAllRequirements({ especieId: 1, categoriaAnimalId, sexoId: 1, pesoInicial: 20, pesoFinal: 30, GMD: 150 });
  }
});
