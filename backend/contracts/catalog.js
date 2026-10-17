const { z } = require('./zod');

/**
 * Schema da RESPOSTA de GET /api/v1/catalog.
 * Documenta o contrato no OpenAPI e é verificado nos testes.
 */
const optionSchema = z.object({
    id: z.number().int(),
    code: z.string(),
    label: z.string(),
});

const genotypeSchema = optionSchema.extend({
    available: z.boolean(),
    unavailableReason: z.string().optional(),
});

const speciesSchema = optionSchema
    .extend({
        genotypes: z.array(genotypeSchema).openapi({ description: 'Vazio quando a espécie não usa genótipo.' }),
        sexes: z.array(optionSchema),
    })
    .openapi('CatalogSpecies');

const fieldSchema = z
    .object({
        name: z.string(),
        label: z.string(),
        unit: z.string(),
        min: z.number(),
        max: z.number(),
        step: z.number(),
        placeholder: z.string(),
        required: z.boolean(),
    })
    .openapi('CatalogField');

const ruleSchema = z
    .object({
        code: z.string(),
        message: z.string(),
        fields: z.array(z.string()).openapi({ description: 'O primeiro campo é onde o erro é exibido.' }),
    })
    .openapi('CatalogRule');

const optionalGroupSchema = z.object({
    code: z.string(),
    label: z.string(),
    fields: z.array(z.string()),
});

const formSchema = z
    .object({
        fields: z.array(fieldSchema),
        rules: z.array(ruleSchema),
        optionalGroups: z.array(optionalGroupSchema),
    })
    .openapi('CatalogForm');

const catalogSchema = z
    .object({
        version: z.string().openapi({ description: 'Muda sempre que o conteúdo do catálogo muda (também usado no ETag).' }),
        species: z.array(speciesSchema),
        forms: z.object({
            requirements: formSchema,
            ndt: formSchema,
        }),
        diet: z.object({
            maxIngredients: z.number().int(),
            allowDuplicates: z.boolean(),
            tolerancePercent: z.number(),
            ingredientDefaults: z.object({ min: z.number(), max: z.number(), price: z.number() }),
            categories: z.array(z.object({ code: z.string(), label: z.string(), pluralLabel: z.string() })),
            foodNutrientUnit: z.string(),
        }),
    })
    .openapi('Catalog');

module.exports = { catalogSchema };
