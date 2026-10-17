// Regenera golden.json a partir do código atual. Uso: npm run test:update-golden
const fs = require('fs');
const path = require('path');
const { calculateAllRequirements } = require('../../domain/requirementService');
const { calculateNdt } = require('../../domain/ndtService');
const { requirementCases, ndtCases } = require('./goldenCases');

const golden = {
  requirements: Object.fromEntries(requirementCases.map((c) => [c.name, calculateAllRequirements(c.input)])),
  ndt: Object.fromEntries(ndtCases.map((c) => [c.name, calculateNdt(c.input)])),
};

fs.writeFileSync(path.join(__dirname, 'golden.json'), JSON.stringify(golden, null, 2) + '\n');
console.log('golden.json atualizado.');
