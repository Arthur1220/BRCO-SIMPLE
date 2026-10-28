require('./helpers/env');
const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateDiet } = require('../domain/dietService');
const { calculateAllRequirements } = require('../domain/requirementService');
const { DIET_SAFETY } = require('../catalog/dietSafety');

// Ovino macho inteiro e caprina leiteira
const animal = { especieId: 2, categoriaAnimalId: null, sexoId: 1, pesoInicial: 25, pesoFinal: 35, GMD: 200 };
const goat = { especieId: 1, categoriaAnimalId: 1, sexoId: 3, pesoInicial: 20, pesoFinal: 30, GMD: 150 };

// Alimentos do seed (g/kg MS)
const silagem = { name: 'Silagem de milho', category: 'VOLUMOSO', PB: 71.8, NDT: 632.2, FDNcp: 509.3, EE: 28.6, CNF: 333.9, Ca: 2.8, P: 1.9, min: 0, max: 100, price: 0.3 };
const milho = { name: 'Milho fubá', category: 'CONCENTRADO', PB: 92.3, NDT: 844.2, FDNcp: 91.7, EE: 39.1, CNF: 759.6, Ca: 0.4, P: 2.9, min: 0, max: 100, price: 1.2 };
const soja = { name: 'Farelo de soja', category: 'CONCENTRADO', PB: 487.9, NDT: 811.6, FDNcp: 131.8, EE: 19.4, CNF: 294.8, Ca: 3.4, P: 5.9, min: 0, max: 100, price: 2.5 };
const calcario = { name: 'Calcário', category: 'SUPLEMENTO', PB: 0, NDT: 0, FDNcp: 0, EE: 0, CNF: 0, Ca: 370.2, P: 0.2, Cu: 0, min: 0, max: 1.5, price: 0.5 };
const ureia = { name: 'Ureia', category: 'SUPLEMENTO', PB: 2819.2, NDT: 0, FDNcp: 0, EE: 0, CNF: 0.8, Ca: 0.2, P: 0.8, Cu: 0, min: 0, max: 100, price: 0.01 };

const foods = [silagem, milho, soja, calcario];
const sumPercent = (ingredients) => ingredients.reduce((sum, ing) => sum + ing.percent, 0);
const percentOf = (result, name) => result.optimizedIngredients.find((ing) => ing.name === name).percent;
const checkOf = (result, code) => result.safetyChecks.find((c) => c.code === code);
const codes = (result) => result.warnings.map((w) => w.code);

test('calculateDiet: encontra solução viável que fecha 100% da dieta', () => {
  const output = calculateDiet(animal, foods);
  assert.equal(output.hasConflict, false);
  assert.equal(output.result.isFeasible, true);
  assert.ok(Math.abs(sumPercent(output.result.optimizedIngredients) - 100) < 0.1);
});

test('calculateDiet: atende proteína e NDT exigidos', () => {
  const { result } = calculateDiet(animal, foods);
  assert.ok(result.dietBalance['Proteína Bruta'].diff >= -0.5);
  assert.ok(result.dietBalance['NDT'].diff >= -0.5);
});

test('calculateDiet: respeita os limites mínimo e máximo do usuário', () => {
  const { result } = calculateDiet(animal, [{ ...silagem, min: 40, max: 60 }, milho, soja, calcario]);
  const silagemPercent = result.optimizedIngredients[0].percent;
  assert.ok(silagemPercent >= 40 - 0.01 && silagemPercent <= 60 + 0.01);
});

test('calculateDiet: Ca e P em g/kg MS (sem confundir com %) e comparados à exigência dietética', () => {
  const { result } = calculateDiet(animal, foods);
  const requirements = calculateAllRequirements(animal);
  const cms = result.dietSupply['Consumo Estimado (g)'];
  const expectedCa = result.optimizedIngredients.reduce((sum, ing) => sum + cms * (ing.percent / 100) * (ing.Ca / 1000), 0);
  assert.ok(Math.abs(result.dietBalance['Cálcio'].supplied - expectedCa) < 0.02);
  assert.equal(result.dietBalance['Cálcio'].required, requirements['Cálcio Dietético'].valor_requerido);
  assert.equal(result.dietBalance['Fósforo'].required, requirements['Fósforo Dietético'].valor_requerido);
});

test('calculateDiet: exigência mineral indisponível vira aviso, não "zero exigido"', () => {
  const requirements = calculateAllRequirements(goat);
  const { result } = calculateDiet(goat, foods);
  if (requirements['Fósforo Dietético'].valor_requerido > 0) return; // exigência já disponível
  assert.equal(result.dietBalance['Fósforo'].required, null);
  assert.equal(result.dietBalance['Fósforo'].diff, null);
  assert.ok(result.warnings.some((w) => w.code === 'requirement_unavailable' && w.params.nutrient === 'P'));
});

test('travas: EE, FDN, CNF e Ca:P de macho são respeitados', () => {
  const { result } = calculateDiet(animal, foods);
  for (const code of ['ee', 'fdn', 'cnf', 'ca_p']) assert.equal(checkOf(result, code).ok, true, code);
  assert.ok(checkOf(result, 'ca_p').value >= DIET_SAFETY.caPMinMale);
  assert.equal(checkOf(result, 'ca_p').limit, DIET_SAFETY.caPMinMale);
  assert.equal(checkOf(calculateDiet(goat, foods).result, 'ca_p').limit, null); // fêmea: sem limite
});

test('travas: macho sem fonte de cálcio não recebe dieta, e o bloqueio aponta a relação Ca:P', () => {
  const output = calculateDiet(animal, [silagem, milho, soja]);
  assert.equal(output.hasConflict, true);
  for (const option of [output.resultIdeal, output.resultRealistic]) {
    assert.equal(option.isFeasible, false);
    assert.equal(sumPercent(option.optimizedIngredients), 0);
    const blocked = option.warnings.find((w) => w.code === 'safety_infeasible');
    assert.deepEqual(blocked.params.checks, ['ca_p']);
  }
});

test('travas: ureia limitada a 1% da MS, mesmo que o usuário peça mais', () => {
  const { result } = calculateDiet(goat, [silagem, milho, soja, { ...ureia, min: 0.5 }]);
  assert.ok(percentOf(result, 'Ureia') >= 0.5 - 0.01);
  assert.equal(checkOf(result, 'urea').ok, true);
  assert.equal(checkOf(result, 'nnp_share').ok, true);
  assert.ok(codes(result).includes('urea_adaptation'));

  const tooMuch = calculateDiet(goat, [silagem, milho, soja, { ...ureia, min: 1.2 }]);
  assert.equal(tooMuch.resultRealistic.isFeasible, false);
  assert.ok(tooMuch.resultRealistic.warnings.find((w) => w.code === 'safety_infeasible').params.checks.includes('urea'));
});

test('cobre: ovinos limitados a 15 mg/kg MS', () => {
  const salBarato = { name: 'Sal com cobre', category: 'SUPLEMENTO', PB: 0, NDT: 0, FDNcp: 0, EE: 0, CNF: 0, Ca: 370, P: 0, Cu: 2000, min: 1.5, max: 1.5, price: 0.01 };
  const output = calculateDiet(animal, [silagem, milho, soja, salBarato]);
  // 1,5% de um sal com 2000 mg/kg = 30 mg/kg MS: acima do teto, então não há dieta com esse mínimo
  assert.equal(output.hasConflict, true);
  assert.equal(output.resultRealistic.isFeasible, false);
  assert.ok(output.resultRealistic.warnings.some((w) => w.code === 'safety_infeasible' && w.params.checks.includes('cu')));

  const { result } = calculateDiet(animal, [silagem, milho, soja, calcario, { ...salBarato, min: 0.5 }]);
  assert.ok(checkOf(result, 'cu').value <= DIET_SAFETY.copperMaxSheep);
  assert.equal(checkOf(calculateDiet(goat, [silagem, milho, soja, { ...salBarato, min: 0 }]).result, 'cu').limit, null);
});

test('cobre: suplemento para bovinos é retirado da dieta de ovinos, não da de caprinos', () => {
  const salBovino = { ...calcario, name: 'Sal bovino', targetSpecies: 'BOVINO', Cu: null, min: 1, max: 1.5, price: 0.01 };
  const sheep = calculateDiet(animal, [silagem, milho, soja, calcario, salBovino]);
  const sheepResult = sheep.result ?? sheep.resultRealistic;
  assert.equal(percentOf(sheepResult, 'Sal bovino'), 0);
  assert.ok(codes(sheepResult).includes('supplement_blocked_species'));

  const goatResult = calculateDiet(goat, [silagem, milho, soja, salBovino]).result;
  assert.ok(percentOf(goatResult, 'Sal bovino') >= 1 - 0.01);
  assert.ok(!codes(goatResult).includes('supplement_blocked_species'));
});

test('avisos: dado de cobre ausente para ovinos e relação Cu:Mo fora da faixa', () => {
  const { result } = calculateDiet(animal, foods);
  const missingCu = result.warnings.find((w) => w.code === 'missing_data' && w.params.nutrient === 'Cu');
  assert.ok(missingCu.params.foods.includes('Silagem de milho'));
  assert.equal(checkOf(result, 'cu').incomplete, true);

  const withMo = [silagem, milho, soja, { ...calcario, Cu: 0, Mo: 300 }].map((f) => ({ ...f, Cu: f.Cu ?? 5 }));
  assert.ok(codes(calculateDiet(animal, withMo).result).includes('cu_mo_ratio'));
});

test('conflito: "priorizar a nutrição" ignora os limites do usuário; "respeitar limites" mantém as travas', () => {
  const output = calculateDiet(animal, [silagem, { ...milho, max: 1 }, { ...soja, max: 1 }, calcario]);
  assert.equal(output.hasConflict, true);

  const ideal = output.resultIdeal;
  assert.equal(ideal.isFeasible, true);
  assert.ok(ideal.dietBalance['NDT'].diff >= -0.5);
  // Teto de PB/NDT é preferência e pode ter sido relaxado (com aviso); as travas duras valem.
  const SOFT = ['pb_max', 'ndt_max'];
  assert.ok(ideal.safetyChecks.every((c) => SOFT.includes(c.code) || c.ok !== false));

  const realistic = output.resultRealistic;
  assert.equal(realistic.isFeasible, true);
  assert.ok(percentOf(realistic, 'Milho fubá') <= 1.01);
  assert.ok(realistic.safetyChecks.every((c) => SOFT.includes(c.code) || c.ok !== false));
});

test('balanço: PDR, PNDR e microminerais aparecem; micromineral sem dado fica sem fornecimento', () => {
  const withFractions = [silagem, milho, soja, calcario].map((f) => ({ ...f, PDR: f.PB * 0.6, PNDR: f.PB * 0.4 }));
  const { result } = calculateDiet(animal, withFractions);
  assert.ok(result.dietBalance['PDR'].required > 0);
  assert.ok(result.dietBalance['PNDR'].supplied > 0);
  assert.equal(result.dietBalance['Zinco'].supplied, null);
  const withZinc = calculateDiet(animal, withFractions.map((f) => ({ ...f, Zn: 30 }))).result;
  assert.ok(Math.abs(withZinc.dietBalance['Zinco'].supplied - withZinc.dietSupply['Consumo Estimado (g)'] / 1000 * 30) < 0.05);
});

test('enchimento: consumo de FDN acima de 1,4% do peso vivo gera aviso', () => {
  const capimRuim = { name: 'Capim seco', category: 'VOLUMOSO', PB: 40, NDT: 450, FDNcp: 800, EE: 15, CNF: 50, Ca: 3, P: 1.5, min: 90, max: 100, price: 0.1 };
  const output = calculateDiet(goat, [capimRuim, soja]);
  const result = output.result ?? output.resultRealistic;
  assert.ok(result.warnings.some((w) => w.code === 'intake_fill'));
});

test('custo: aponta o limite do usuário que encarece e o preço em que um alimento entraria', () => {
  const trigo = { name: 'Farelo de trigo', category: 'CONCENTRADO', PB: 174.5, NDT: 700.5, FDNcp: 383.4, EE: 38.1, CNF: 344.6, Ca: 1.7, P: 10.4, min: 0, max: 100, price: 3 };
  const { result } = calculateDiet(animal, [silagem, { ...milho, max: 20 }, soja, calcario, trigo]);
  const milhoMax = result.costInsights.limiting.find((item) => item.kind === 'max' && item.foodName === 'Milho fubá');
  assert.ok(milhoMax.deltaPerDay < 0);
  const unused = result.costInsights.unusedFoods.find((item) => item.foodName === 'Farelo de trigo');
  assert.ok(unused.breakEvenPrice > 0 && unused.breakEvenPrice < 3);
  // No preço de equilíbrio (um pouco abaixo), o farelo entra na dieta
  const cheaper = calculateDiet(animal, [silagem, { ...milho, max: 20 }, soja, calcario, { ...trigo, price: unused.breakEvenPrice * 0.98 }]).result;
  assert.ok(percentOf(cheaper, 'Farelo de trigo') > 0);
});

test('PDR/PNDR: fora da formulação por padrão (aguardando revisão técnica)', () => {
  assert.equal(DIET_SAFETY.proteinFractionsInFormulation, false);
});

test('arredondamento: trava no limite não aparece como fora (Ca:P = 2,00, não 1,99)', () => {
  const goatMale = { ...goat, sexoId: 1 };
  const free = [silagem, milho, soja, calcario, ureia].map((f) => ({ ...f, price: 0 }));
  const { result } = calculateDiet(goatMale, free);
  const caP = checkOf(result, 'ca_p');
  assert.ok(caP.value >= DIET_SAFETY.caPMinMale);
  assert.equal(caP.ok, true);
});

test('preços: sem nenhum preço avisa e não explica custo; preço parcial lista os alimentos', () => {
  const free = calculateDiet(animal, foods.map((f) => ({ ...f, price: 0 }))).result;
  assert.ok(codes(free).includes('prices_missing_all'));
  assert.equal(free.costInsights, null);

  const partial = calculateDiet(animal, [silagem, milho, soja, { ...calcario, price: 0 }]).result;
  const warning = partial.warnings.find((w) => w.code === 'prices_missing');
  assert.deepEqual(warning.params.foods, ['Calcário']);
  assert.ok(partial.costInsights);
});

test('teto: PB e NDT ficam até 10% acima da exigência, mesmo sem preços', () => {
  const trigo = { name: 'Farelo de trigo', category: 'CONCENTRADO', PB: 174.5, NDT: 700.5, FDNcp: 383.4, EE: 38.1, CNF: 344.6, Ca: 1.7, P: 10.4, min: 0, max: 100, price: 0 };
  const free = [silagem, milho, soja, calcario, trigo].map((f) => ({ ...f, price: 0 }));
  // Caso do PDF (caprino leiteiro macho): antes o NDT ficava 19% acima.
  const { result } = calculateDiet({ ...goat, sexoId: 1 }, free);
  for (const [key, code] of [['Proteína Bruta', 'pb_max'], ['NDT', 'ndt_max']]) {
    const { required, supplied } = result.dietBalance[key];
    assert.ok(supplied <= required * 1.1 + 0.05, `${key}: ${supplied} > 110% de ${required}`);
    assert.equal(checkOf(result, code).ok, true);
    assert.equal(checkOf(result, code).limit, 110);
  }
  assert.ok(!codes(result).some((code) => code.startsWith('excess_unavoidable')));
});

test('teto: é preferência; quando os alimentos forçam excesso, a dieta sai sem o teto e avisa', () => {
  // Com só silagem, milho, soja e calcário, a energia exigida obriga a PB a passar de 110%.
  const { hasConflict, result } = calculateDiet(animal, foods);
  assert.equal(hasConflict, false);
  const warning = result.warnings.find((w) => w.code === 'excess_unavoidable');
  assert.deepEqual(warning.params.checks, ['pb_max']); // só o que passou de 110%
  assert.equal(warning.params.percent, 120);           // o teto sobe aos poucos, não some
  const pb = result.dietBalance['Proteína Bruta'];
  assert.ok(pb.supplied <= pb.required * 1.2 + 0.05);
  assert.equal(checkOf(result, 'pb_max').ok, false);   // o excesso continua visível nas travas
});
