require('./helpers/env');
const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateNdt } = require('../services/ndtService');
const { NDT } = require('../services/calculationConstants');
const { ndtCases } = require('./fixtures/goldenCases');
const golden = require('./fixtures/golden.json');

test('calculateNdt: resultados batem com os valores de referência (golden)', async (t) => {
  for (const { name, input } of ndtCases) {
    await t.test(name, () => {
      assert.deepEqual(calculateNdt(input), golden.ndt[name]);
    });
  }
});

test('calculateNdt: usa a fórmula simplificada de PBvd quando PIDN e PIDA são 0', () => {
  const result = calculateNdt({ PB: 10, EE: 3, FDN: 40, Ligrina: 5, MO: 90, PIDN: 0, PIDA: 0 });
  const expected = Math.round((NDT.PBvd.NO_PIDN_PIDA_FACTOR * 10 - 0.44) * 100) / 100;
  assert.equal(result['Proteína bruta verdadeiramente digestível'].valor, expected);
});

test('calculateNdt: NDT total é a soma das frações digestíveis', () => {
  const result = calculateNdt(ndtCases[0].input);
  const sum =
    result['Proteína bruta verdadeiramente digestível'].valor +
    result['Extrato etéreo verdadeiramente digestível'].valor +
    result['Fibra em detergente neutro digestível'].valor +
    result['Carboidratos não-fibrosos verdadeiramente digestíveis'].valor;
  assert.ok(Math.abs(sum - result['Nutrientes digestíveis totais'].valor) <= 0.02);
});
