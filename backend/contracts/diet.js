const { z } = require('./zod');
const { dietAnimalFields, ingredientFields, customFoodFields, numberField } = require('./fields');
const { animalSchema } = require('./requirements');
const { perLocale } = require('./localized');
const { L, t } = require('../lib/i18n');
const { DIET_RULES, CATEGORY_CODES } = require('../catalog/diet');

const MESSAGES = {
    oneSource: L('Informe um alimento cadastrado (foodId) ou um alimento personalizado (custom).', 'Provide either a registered food (foodId) or a custom food (custom).'),
    minLteMax: L('A inclusão mínima não pode ser maior que a máxima.', 'Minimum inclusion cannot exceed maximum inclusion.'),
    tooMany: L('Use no máximo {max} alimentos.', 'Use at most {max} foods.'),
    atLeastOne: L('Adicione pelo menos um alimento.', 'Add at least one food.'),
    duplicate: L('Este alimento já foi adicionado.', 'This food has already been added.'),
    name: L('Informe o nome do alimento.', 'Provide the food name.'),
};

// Regras publicadas no catálogo (a validação está nos schemas abaixo).
const dietRules = [
    { code: 'one_food_source', message: MESSAGES.oneSource, fields: ['ingredients'] },
    { code: 'min_lte_max', message: MESSAGES.minLteMax, fields: ['min', 'max'] },
    { code: 'max_ingredients', message: L(`Use no máximo ${DIET_RULES.maxIngredients} alimentos.`, `Use at most ${DIET_RULES.maxIngredients} foods.`), fields: ['ingredients'] },
    { code: 'no_duplicates', message: MESSAGES.duplicate, fields: ['ingredients'] },
];

function customFoodSchema(locale) {
    const nutrients = Object.fromEntries(
        Object.entries(customFoodFields).map(([name, def]) => [name, numberField(def, locale)])
    );
    return z.object({
        name: z.string().trim().min(1, t(MESSAGES.name, locale)).max(120),
        category: z.enum(CATEGORY_CODES),
        ...nutrients,
    });
}

/**
 * min/max/price são opcionais: sem eles valem os padrões do alimento cadastrado
 * (defaultMin/defaultMax) ou os do catálogo (DIET_RULES.ingredientDefaults).
 */
function ingredientSchema(locale) {
    return z
        .object({
            foodId: z.number().int().positive().optional(),
            custom: customFoodSchema(locale).optional(),
            min: numberField(ingredientFields.min, locale).optional(),
            max: numberField(ingredientFields.max, locale).optional(),
            price: numberField(ingredientFields.price, locale).optional(),
        })
        .superRefine((ing, ctx) => {
            if ((ing.foodId === undefined) === (ing.custom === undefined)) {
                ctx.addIssue({ code: 'custom', path: ['foodId'], message: t(MESSAGES.oneSource, locale), params: { rule: 'one_food_source' } });
            }
            if (ing.min !== undefined && ing.max !== undefined && ing.min > ing.max) {
                ctx.addIssue({ code: 'custom', path: ['min'], message: t(MESSAGES.minLteMax, locale), params: { rule: 'min_lte_max' } });
            }
        });
}

/**
 * Entrada de POST /api/v1/calculations/diet.
 * Alimentos cadastrados são referenciados por `foodId`: a composição vem do banco,
 * nunca do cliente. Alimentos personalizados informam a composição em g/kg MS.
 */
const getDietInputSchema = perLocale((locale) =>
    z
        .object({
            animal: animalSchema(dietAnimalFields, locale),
            ingredients: z
                .array(ingredientSchema(locale))
                .min(1, t(MESSAGES.atLeastOne, locale))
                .max(DIET_RULES.maxIngredients, t(MESSAGES.tooMany, locale).replace('{max}', DIET_RULES.maxIngredients)),
        })
        .superRefine((data, ctx) => {
            const seen = new Set();
            data.ingredients.forEach((ing, index) => {
                if (ing.foodId === undefined) return;
                if (seen.has(ing.foodId)) {
                    ctx.addIssue({ code: 'custom', path: ['ingredients', index, 'foodId'], message: t(MESSAGES.duplicate, locale), params: { rule: 'no_duplicates' } });
                }
                seen.add(ing.foodId);
            });
        })
        .openapi('DietInput')
);

module.exports = { getDietInputSchema, dietRules };
