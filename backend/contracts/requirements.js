const { z } = require('./zod');
const { requirementFields, numberField } = require('./fields');
const { applyRules } = require('./rules');
const { perLocale } = require('./localized');
const { L } = require('../lib/i18n');
const { SPECIES, SEXES, findSpecies } = require('../catalog/animals');

const requirementRules = [
    {
        code: 'final_gt_initial',
        message: L('O peso final deve ser maior que o peso inicial.', 'Final weight must be greater than initial weight.'),
        fields: ['pesoFinal', 'pesoInicial'],
        check: (data) => data.pesoFinal > data.pesoInicial,
    },
    {
        code: 'valid_genotype',
        message: L('Genótipo inválido ou indisponível para a espécie.', 'Genotype is invalid or unavailable for this species.'),
        fields: ['genotipo'],
        check: (data) => {
            const species = findSpecies(data.especie);
            if (species.genotypes.length === 0) return data.genotipo === undefined || data.genotipo === null;
            const genotype = species.genotypes.find((g) => g.code === data.genotipo);
            return Boolean(genotype && genotype.available);
        },
    },
    {
        code: 'valid_sex',
        message: L('Sexo não disponível para a espécie.', 'Sex is not available for this species.'),
        fields: ['sexo'],
        check: (data) => findSpecies(data.especie).sexes.some((s) => s.code === data.sexo),
    },
];

/**
 * Objeto "animal" (espécie, genótipo, sexo, pesos e GMD) com as regras aplicadas.
 * Reaproveitado pela dieta, que usa limites próprios para o GMD.
 */
function animalSchema(fields, locale) {
    return z
        .object({
            especie: z.enum(SPECIES.map((s) => s.code)),
            genotipo: z.string().nullable().optional(),
            sexo: z.enum(Object.keys(SEXES)),
            pesoInicial: numberField(fields.pesoInicial, locale),
            pesoFinal: numberField(fields.pesoFinal, locale),
            GMD: numberField(fields.GMD, locale),
        })
        .superRefine(applyRules(requirementRules, locale));
}

/**
 * Entrada de POST /api/v1/calculations/requirements (codes do catálogo em vez de ids).
 */
const getRequirementsInputSchema = perLocale((locale) =>
    animalSchema(requirementFields, locale).openapi('RequirementsInput')
);

module.exports = { getRequirementsInputSchema, animalSchema, requirementRules };
