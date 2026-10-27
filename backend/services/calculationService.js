const { ZodError } = require('zod');
const foodsRepository = require('../repositories/foodsRepository');
const calculationsRepository = require('../repositories/calculationsRepository');
const { L, t } = require('../lib/i18n');
const { ENGINE_VERSION } = require('../domain/version');
const { calculateAllRequirements } = require('../domain/requirementService');
const { calculateNdt } = require('../domain/ndtService');
const { calculateDiet } = require('../domain/dietService');
const { toDomainAnimal } = require('../catalog/animals');
const { DIET_RULES } = require('../catalog/diet');
const { toDomainNdt } = require('../contracts/ndt');

// Decisão do projeto: cálculos ficam guardados por no máximo 6 meses.
const RETENTION_DAYS = 180;
const DAY_MS = 24 * 60 * 60 * 1000;

const FOOD_NOT_FOUND = L('Alimento não encontrado.', 'Food not found.');

// Tipo registrado em calculation_logs (estatísticas do admin), igual ao da v0.
function usageType(type, input) {
    if (type === 'requirements') return `requirement_especie_${toDomainAnimal(input).especieId}`;
    return `${type}_calculation`;
}

// ------------------------------------------------------------------
// Execução (domínio)
// ------------------------------------------------------------------

function runRequirements(input) {
    return calculateAllRequirements(toDomainAnimal(input));
}

function runNdt(input) {
    return calculateNdt(toDomainNdt(input));
}

/**
 * Monta os ingredientes do domínio: alimentos cadastrados vêm do banco
 * (a composição nunca vem do cliente); personalizados vêm da requisição.
 */
async function resolveIngredients(ingredients, locale) {
    const ids = ingredients.filter((ing) => ing.foodId !== undefined).map((ing) => ing.foodId);
    const foods = await foodsRepository.findFoodsByIds(ids);
    const foodsById = new Map(foods.map((food) => [food.id, food]));

    const missing = [];
    const resolved = ingredients.map((ing, index) => {
        const defaults = DIET_RULES.ingredientDefaults;
        const limits = (food) => ({
            min: ing.min ?? food?.defaultMin ?? defaults.min,
            max: ing.max ?? food?.defaultMax ?? defaults.max,
            price: ing.price ?? defaults.price,
        });

        if (ing.custom) {
            return { foodId: null, ...ing.custom, ...limits(null) };
        }

        const food = foodsById.get(ing.foodId);
        if (!food) {
            missing.push({ code: 'custom', path: ['ingredients', index, 'foodId'], message: t(FOOD_NOT_FOUND, locale), params: { rule: 'food_not_found' } });
            return null;
        }
        const { id, name, category, MS, PB, NDT, FDNcp, Ca, P } = food;
        return { foodId: id, name, category, MS, PB, NDT, FDNcp, Ca, P, ...limits(food) };
    });

    if (missing.length > 0) throw new ZodError(missing);
    return resolved;
}

async function runDiet(input, locale) {
    const ingredients = await resolveIngredients(input.ingredients, locale);
    return calculateDiet(toDomainAnimal(input.animal), ingredients);
}

// ------------------------------------------------------------------
// Persistência
// ------------------------------------------------------------------

// A remoção dos vencidos é feita pelo TTL do DynamoDB (atributo `ttl`).
async function saveCalculation(type, input, output) {
    const now = new Date();
    return calculationsRepository.saveCalculation({
        type,
        engineVersion: ENGINE_VERSION,
        input,
        output,
        createdAt: now,
        expiresAt: new Date(now.getTime() + RETENTION_DAYS * DAY_MS),
    });
}

/**
 * Busca um cálculo ainda dentro da validade (null se não existe ou expirou).
 */
function findCalculation(id) {
    return calculationsRepository.findValidCalculation(id);
}

module.exports = {
    RETENTION_DAYS,
    usageType,
    runRequirements,
    runNdt,
    runDiet,
    saveCalculation,
    findCalculation,
};
