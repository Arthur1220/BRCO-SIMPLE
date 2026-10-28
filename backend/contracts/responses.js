const { z } = require('./zod');

/**
 * Schemas das RESPOSTAS da v1 (documentação OpenAPI e testes de contrato).
 */
const resultItemSchema = z
    .object({
        code: z.string().openapi({ example: 'cms_g_d', description: 'Identificador estável (não muda com o idioma).' }),
        label: z.string(),
        value: z.number(),
        max: z.number().optional().openapi({ description: 'Valor máximo recomendado, quando existir.' }),
        unit: z.string(),
        decimals: z.number().int(),
    })
    .openapi('ResultItem');

const resultGroupSchema = z
    .object({
        code: z.string(),
        label: z.string(),
        order: z.number().int(),
        summary: resultItemSchema.optional().openapi({ description: 'Valor principal do grupo, para exibir no cabeçalho.' }),
        items: z.array(resultItemSchema),
    })
    .openapi('ResultGroup');

const groupedResultSchema = z.object({
    highlights: z.array(resultItemSchema),
    groups: z.array(resultGroupSchema),
});

const headerSchema = z.object({
    calculationId: z.string(),
    type: z.enum(['requirements', 'ndt', 'diet']),
    engineVersion: z.string(),
    createdAt: z.string().datetime(),
    expiresAt: z.string().datetime().openapi({ description: 'Após esta data o cálculo é apagado (6 meses).' }),
    input: z.record(z.any()).openapi({ description: 'Entrada validada e normalizada.' }),
});

const groupedCalculationSchema = headerSchema.merge(groupedResultSchema).openapi('GroupedCalculation');

const dietSolutionSchema = z
    .object({
        feasible: z.boolean(),
        ingredients: z.array(z.object({
            foodId: z.number().int().nullable(),
            name: z.string(),
            category: z.string(),
            categoryLabel: z.string(),
            percent: z.number(),
            kgPerDay: z.number().openapi({ description: 'kg de matéria seca por animal por dia.' }),
            kgAsFedPerDay: z.number().nullable().openapi({ description: 'kg de matéria natural por animal por dia (null sem MS do alimento).' }),
            costPerDay: z.number(),
            min: z.number(),
            max: z.number(),
            price: z.number().openapi({ description: 'R$/kg MS.' }),
            priceAsFed: z.number().nullable().openapi({ description: 'R$/kg de matéria natural.' }),
            dryMatter: z.number().nullable().openapi({ description: 'MS do alimento, g/kg de matéria natural.' }),
        })),
        totals: z.object({
            intakeKgPerDay: z.number(),
            intakeKgAsFedPerDay: z.number().nullable(),
            costPerDay: z.number(),
            costPerKgGain: z.number().nullable().openapi({ description: 'R$ por kg de ganho (null com GMD 0).' }),
        }),
        priceBasis: z.enum(['MS', 'MN']),
        feeding: z.object({
            animals: z.number().int(),
            feedingsPerDay: z.number().int(),
            kgDryMatterPerDay: z.number(),
            kgAsFedPerDay: z.number().nullable(),
            costPerDay: z.number(),
            perFeeding: z.array(z.object({ foodId: z.number().int().nullable(), name: z.string(), kgAsFed: z.number().nullable(), kgDryMatter: z.number() })),
        }).openapi({ description: 'Trato do lote: quantidades por dia e por trato.' }),
        balance: z.array(z.object({
            code: z.string(),
            label: z.string(),
            unit: z.string(),
            required: z.number().nullable().openapi({ description: 'null quando a exigência não está disponível para o animal.' }),
            supplied: z.number().nullable().openapi({ description: 'null quando nenhum alimento da dieta tem o dado.' }),
            diff: z.number().nullable(),
            status: z.enum(['ideal', 'deficit', 'excess', 'info']),
            statusLabel: z.string(),
        })),
        safetyChecks: z.array(z.object({
            code: z.string(),
            label: z.string(),
            unit: z.string(),
            value: z.number().nullable().openapi({ description: 'null quando nenhum alimento da dieta tem o dado.' }),
            limit: z.number().nullable().openapi({ description: 'null quando não há limite para este animal.' }),
            kind: z.enum(['min', 'max']),
            ok: z.boolean().nullable(),
            incomplete: z.boolean().openapi({ description: 'Algum alimento da dieta não tem o dado.' }),
        })).openapi({ description: 'Travas de segurança da dieta (catalog/dietSafety).' }),
        warnings: z.array(z.object({
            code: z.string(),
            severity: z.enum(['info', 'warning', 'blocked']),
            severityLabel: z.string(),
            message: z.string(),
        })),
        costInsights: z.object({
            limiting: z.array(z.object({ kind: z.enum(['nutrient', 'max', 'min', 'safety']), message: z.string() }).passthrough()),
            unusedFoods: z.array(z.object({ foodName: z.string(), price: z.number(), breakEvenPrice: z.number().nullable(), message: z.string() }).passthrough()),
        }).nullable().openapi({ description: 'O que encarece a dieta e a que preço os alimentos não usados entrariam (só na solução ótima).' }),
    })
    .openapi('DietSolution');

const dietCalculationSchema = headerSchema
    .extend({
        status: z.enum(['optimal', 'conflict']),
        statusLabel: z.string(),
        solution: dietSolutionSchema.optional().openapi({ description: 'Presente quando status = optimal.' }),
        options: z
            .array(z.object({ code: z.enum(['ideal', 'realistic']), label: z.string(), description: z.string(), solution: dietSolutionSchema }))
            .optional()
            .openapi({ description: 'Presente quando status = conflict: o usuário escolhe uma opção.' }),
        requirements: groupedResultSchema,
    })
    .openapi('DietCalculation');

const foodSchema = z
    .object({
        id: z.number().int(),
        name: z.string(),
        category: z.string(),
        categoryLabel: z.string(),
        defaultMin: z.number().nullable(),
        defaultMax: z.number().nullable(),
        unit: z.string().openapi({ example: 'g/kg MS' }),
        MS: z.number(), MO: z.number(), EE: z.number(), PB: z.number(), PDR: z.number(), PNDR: z.number(),
        NDT: z.number(), FDNcp: z.number(), CNF: z.number(), Ca: z.number(), P: z.number(),
        NNP: z.number().nullable(), Cu: z.number().nullable(), Mo: z.number().nullable(), S: z.number().nullable(),
        Zn: z.number().nullable(), Mn: z.number().nullable(), Fe: z.number().nullable(), Co: z.number().nullable(),
        targetSpecies: z.string().nullable().openapi({ description: 'Espécie de destino (suplementos). BOVINO não entra em dieta de ovino.' }),
        updatedAt: z.string().datetime(),
    })
    .openapi('Food');

const statsSchema = z
    .object({
        totalCalculations: z.number().int(),
        statsByType: z.array(z.object({ type: z.string(), label: z.string(), count: z.number().int() })),
    })
    .openapi('AdminStats');

const usageLogSchema = z
    .object({
        id: z.string(),
        type: z.string(),
        label: z.string(),
        createdAt: z.string().datetime(),
        country: z.string().nullable(),
        region: z.string().nullable(),
        userAgent: z.string().nullable(),
    })
    .openapi('UsageLog');

const usagePointSchema = z.object({ date: z.string(), count: z.number().int() }).openapi('UsagePoint');

module.exports = {
    groupedCalculationSchema, dietCalculationSchema, dietSolutionSchema,
    foodSchema, statsSchema, usageLogSchema, usagePointSchema,
};
