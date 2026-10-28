const { z } = require('zod');
const { TARGET_SPECIES_CODES } = require('../catalog/dietSafety');

const FOOD_CATEGORIES = ['VOLUMOSO', 'CONCENTRADO', 'SUPLEMENTO'];

// Nutrientes em g/kg de MS (mesma unidade do seed).
const nutrient = z.number().finite().min(0).max(1000000);

/**
 * Campos que podem ser gravados em um alimento.
 * Campos desconhecidos (id, createdAt, updatedAt...) são descartados pelo Zod,
 * evitando mass assignment.
 */
const foodSchema = z.object({
    name: z.string().trim().min(1).max(120),
    category: z.enum(FOOD_CATEGORIES),
    defaultMin: z.number().min(0).max(100).nullable().optional(),
    defaultMax: z.number().min(0).max(100).nullable().optional(),
    MS: nutrient,
    MO: nutrient,
    EE: nutrient,
    PB: nutrient,
    PDR: nutrient,
    PNDR: nutrient,
    NDT: nutrient,
    FDNcp: nutrient,
    CNF: nutrient,
    Ca: nutrient,
    P: nutrient,
    // Opcionais, usados pelas travas de segurança da dieta (Cu e Mo em mg/kg MS).
    NNP: nutrient.nullable().optional(),
    Cu: nutrient.nullable().optional(),
    Mo: nutrient.nullable().optional(),
    S: nutrient.nullable().optional(),
    targetSpecies: z.enum(TARGET_SPECIES_CODES).nullable().optional(),
});

const createFoodSchema = foodSchema;

// No update todos os campos são opcionais, mas pelo menos um precisa vir.
const updateFoodSchema = foodSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Informe pelo menos um campo para atualizar.' }
);

const foodIdSchema = z.coerce.number().int().positive();

module.exports = { FOOD_CATEGORIES, createFoodSchema, updateFoodSchema, foodIdSchema };
