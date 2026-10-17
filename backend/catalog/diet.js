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
        { code: 'VOLUMOSO', label: 'Volumoso', pluralLabel: 'Volumosos' },
        { code: 'CONCENTRADO', label: 'Concentrado', pluralLabel: 'Concentrados' },
        { code: 'SUPLEMENTO', label: 'Suplemento', pluralLabel: 'Suplementos' },
    ],
    // Unidade em que os nutrientes dos alimentos cadastrados estão armazenados.
    foodNutrientUnit: 'g/kg MS',
};

module.exports = { DIET_RULES };
