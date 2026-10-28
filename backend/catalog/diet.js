const { L } = require('../lib/i18n');

/**
 * Regras e constantes da formulação de dieta expostas ao frontend.
 * Antes ficavam espalhadas pelo dietStore e pelo DietResultsTable.
 */
const DIET_RULES = {
    maxIngredients: 10,
    allowDuplicates: false,
    // Diferença máxima (em %) entre fornecido e exigido para o nutriente ser "Ideal".
    tolerancePercent: 5,
    ingredientDefaults: { min: 0, max: 100, price: 0 },
    categories: [
        { code: 'VOLUMOSO', label: L('Volumoso', 'Roughage'), pluralLabel: L('Volumosos', 'Roughages') },
        { code: 'CONCENTRADO', label: L('Concentrado', 'Concentrate'), pluralLabel: L('Concentrados', 'Concentrates') },
        { code: 'SUPLEMENTO', label: L('Suplemento', 'Supplement'), pluralLabel: L('Suplementos', 'Supplements') },
    ],
    // Unidade em que os nutrientes dos alimentos (cadastrados e personalizados) são informados.
    foodNutrientUnit: 'g/kg MS',
    // Base do preço: o produtor costuma saber o preço por kg de matéria natural (MN).
    priceBases: [
        { code: 'MN', label: L('kg de matéria natural (como compra)', 'kg as fed (as purchased)'), unit: 'R$/kg MN' },
        { code: 'MS', label: L('kg de matéria seca', 'kg of dry matter'), unit: 'R$/kg MS' },
    ],
    defaultPriceBasis: 'MN',
    lotDefaults: { animals: 1, feedingsPerDay: 2 },
};

const PRICE_BASES = DIET_RULES.priceBases.map((b) => b.code);

const CATEGORY_CODES = DIET_RULES.categories.map((c) => c.code);

function findCategory(code) {
    return DIET_RULES.categories.find((c) => c.code === code);
}

module.exports = { DIET_RULES, CATEGORY_CODES, PRICE_BASES, findCategory };
