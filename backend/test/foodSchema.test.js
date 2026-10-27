require('./helpers/env');
const test = require('node:test');
const assert = require('node:assert/strict');
const { createFoodSchema, updateFoodSchema, foodIdSchema } = require('../validation/foodSchema');

const validFood = {
  name: 'Capim teste', category: 'VOLUMOSO',
  MS: 234.4, MO: 892.6, EE: 23.6, PB: 95.5, PDR: 47.93, PNDR: 47.57,
  NDT: 490.8, FDNcp: 635.4, CNF: 138.1, Ca: 5.9, P: 1.4,
};

test('createFoodSchema: aceita um alimento válido', () => {
  assert.deepEqual(createFoodSchema.parse(validFood), validFood);
});

test('createFoodSchema: descarta campos não permitidos (mass assignment)', () => {
  const parsed = createFoodSchema.parse({ ...validFood, id: 999, createdAt: '2020-01-01', isAdmin: true });
  assert.equal(parsed.id, undefined);
  assert.equal(parsed.createdAt, undefined);
  assert.equal(parsed.isAdmin, undefined);
});

test('createFoodSchema: rejeita categoria inválida, nutriente negativo ou texto', () => {
  assert.throws(() => createFoodSchema.parse({ ...validFood, category: 'OUTRA' }));
  assert.throws(() => createFoodSchema.parse({ ...validFood, PB: -1 }));
  assert.throws(() => createFoodSchema.parse({ ...validFood, PB: '95' }));
  assert.throws(() => createFoodSchema.parse({ ...validFood, name: '' }));
});

test('updateFoodSchema: aceita atualização parcial e exige ao menos um campo', () => {
  assert.deepEqual(updateFoodSchema.parse({ PB: 100 }), { PB: 100 });
  assert.throws(() => updateFoodSchema.parse({}));
  assert.throws(() => updateFoodSchema.parse({ id: 5 })); // só campos descartados
});

test('foodIdSchema: aceita apenas inteiros positivos', () => {
  assert.equal(foodIdSchema.parse('7'), 7);
  assert.throws(() => foodIdSchema.parse('abc'));
  assert.throws(() => foodIdSchema.parse('-1'));
  assert.throws(() => foodIdSchema.parse('1.5'));
});
