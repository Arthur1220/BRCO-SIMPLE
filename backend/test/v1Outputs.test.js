require('./helpers/env');
const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateAllRequirements } = require('../domain/requirementService');
const { calculateNdt } = require('../domain/ndtService');
const { getCatalog } = require('../catalog');
const { requirementOutputs, ndtOutputs, REQUIREMENT_GROUPS, NDT_GROUPS, REQUIREMENT_HIGHLIGHTS, NDT_HIGHLIGHTS } = require('../catalog/outputs');
const { balanceStatus } = require('../presenters/calculations');
const { ndtCases } = require('./fixtures/goldenCases');

/**
 * Contrato: toda chave que o domínio produz precisa de metadado de apresentação.
 * Se uma fórmula nova criar uma chave sem metadado, este teste quebra
 * (era assim que os destaques sumiam da tela sem ninguém perceber).
 */
function allValidRequirementKeys() {
  const keys = new Set();
  for (const species of getCatalog().species) {
    const genotypes = species.genotypes.filter((g) => g.available);
    for (const genotype of genotypes.length ? genotypes : [{ id: null }]) {
      for (const sex of species.sexes) {
        const result = calculateAllRequirements({ especieId: species.id, categoriaAnimalId: genotype.id, sexoId: sex.id, pesoInicial: 20, pesoFinal: 30, GMD: 150 });
        Object.keys(result).forEach((key) => keys.add(key));
      }
    }
  }
  return keys;
}

test('contrato: toda chave de exigência do domínio tem metadado', () => {
  const mapped = new Set(requirementOutputs.map((o) => o.key));
  const orphans = [...allValidRequirementKeys()].filter((key) => !mapped.has(key));
  assert.deepEqual(orphans, []);
});

test('contrato: toda chave de NDT do domínio tem metadado', () => {
  const mapped = new Set(ndtOutputs.map((o) => o.key));
  const orphans = Object.keys(calculateNdt(ndtCases[0].input)).filter((key) => !mapped.has(key));
  assert.deepEqual(orphans, []);
});

test('contrato: codes únicos, grupos existentes e destaques válidos', () => {
  for (const [outputs, groups, highlights] of [
    [requirementOutputs, REQUIREMENT_GROUPS, REQUIREMENT_HIGHLIGHTS],
    [ndtOutputs, NDT_GROUPS, NDT_HIGHLIGHTS],
  ]) {
    const codes = outputs.map((o) => o.code);
    assert.equal(new Set(codes).size, codes.length, 'code duplicado');
    const groupCodes = new Set(groups.map((g) => g.code));
    for (const output of outputs) assert.ok(groupCodes.has(output.group), `grupo inexistente: ${output.group}`);
    for (const code of highlights) assert.ok(codes.includes(code), `destaque inexistente: ${code}`);
    for (const group of groups.filter((g) => g.summary)) assert.ok(codes.includes(group.summary), `resumo inexistente: ${group.summary}`);
  }
});

test('contrato: todo label existe em pt-BR e en', () => {
  for (const item of [...requirementOutputs, ...ndtOutputs, ...REQUIREMENT_GROUPS, ...NDT_GROUPS]) {
    assert.ok(item.label['pt-BR'] && item.label.en, `label incompleto: ${item.code}`);
  }
});

test('balanceStatus: mesma regra que o frontend aplicava (tolerância de 5%)', () => {
  assert.equal(balanceStatus(0, 10), 'info');
  assert.equal(balanceStatus(100, -5), 'ideal');
  assert.equal(balanceStatus(100, 5), 'ideal');
  assert.equal(balanceStatus(100, -6), 'deficit');
  assert.equal(balanceStatus(100, 6), 'excess');
  assert.equal(balanceStatus(1, 0.05), 'ideal'); // sobra < 0,1
});
