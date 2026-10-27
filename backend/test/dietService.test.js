require('./helpers/env');
const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateDiet } = require('../domain/dietService');

const animal = { especieId: 2, categoriaAnimalId: null, sexoId: 1, pesoInicial: 25, pesoFinal: 35, GMD: 200 };

// Alimentos do seed (g/kg MS)
const silagem = { name: 'Silagem de milho', category: 'VOLUMOSO', PB: 71.8, NDT: 632.2, FDNcp: 509.3, Ca: 2.8, P: 1.9, min: 0, max: 100, price: 0.3 };
const milho = { name: 'Milho fubá', category: 'CONCENTRADO', PB: 92.3, NDT: 844.2, FDNcp: 91.7, Ca: 0.4, P: 2.9, min: 0, max: 100, price: 1.2 };
const soja = { name: 'Farelo de soja', category: 'CONCENTRADO', PB: 487.9, NDT: 811.6, FDNcp: 131.8, Ca: 3.4, P: 5.9, min: 0, max: 100, price: 2.5 };

const sumPercent = (ingredients) => ingredients.reduce((sum, ing) => sum + ing.percent, 0);

test('calculateDiet: encontra solução viável que fecha 100% da dieta', () => {
  const output = calculateDiet(animal, [silagem, milho, soja]);
  assert.equal(output.hasConflict, false);
  assert.equal(output.result.isFeasible, true);
  assert.ok(Math.abs(sumPercent(output.result.optimizedIngredients) - 100) < 0.1);
});

test('calculateDiet: atende proteína e NDT exigidos', () => {
  const { result } = calculateDiet(animal, [silagem, milho, soja]);
  assert.ok(result.dietBalance['Proteína Bruta'].diff >= -0.5);
  assert.ok(result.dietBalance['NDT'].diff >= -0.5);
});

test('calculateDiet: respeita os limites mínimo e máximo do usuário', () => {
  const { result } = calculateDiet(animal, [{ ...silagem, min: 40, max: 60 }, milho, soja]);
  const silagemPercent = result.optimizedIngredients[0].percent;
  assert.ok(silagemPercent >= 40 - 0.01 && silagemPercent <= 60 + 0.01);
});

test('calculateDiet: sinaliza conflito quando os limites impedem atender a nutrição', () => {
  // Volumoso pobre + concentrado limitado a 1%: não atinge NDT/PB exigidos
  const output = calculateDiet(animal, [silagem, { ...milho, max: 1 }]);
  assert.equal(output.hasConflict, true);
  assert.equal(output.resultIdeal.isFeasible, false);
  assert.ok(output.resultRealistic);
});
