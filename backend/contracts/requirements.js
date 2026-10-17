const { z } = require('./zod');
const { requirementFields, numberField } = require('./fields');
const { applyRules } = require('./rules');
const { SPECIES, findSpecies } = require('../catalog/animals');

const requirementRules = [
    {
        code: 'final_gt_initial',
        message: 'O peso final deve ser maior que o peso inicial.',
        fields: ['pesoFinal', 'pesoInicial'],
        check: (data) => data.pesoFinal > data.pesoInicial,
    },
    {
        code: 'valid_genotype',
        message: 'Genótipo inválido ou indisponível para a espécie.',
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
        message: 'Sexo não disponível para a espécie.',
        fields: ['sexo'],
        check: (data) => findSpecies(data.especie).sexes.some((s) => s.code === data.sexo),
    },
];

/**
 * Entrada do cálculo de exigências na v1 (usa codes do catálogo em vez de ids).
 * Usado pelo endpoint de cálculo da Fase 2; já definido aqui para que o
 * catálogo e a validação venham da mesma fonte.
 */
const requirementsInputSchema = z
    .object({
        especie: z.enum(SPECIES.map((s) => s.code)),
        genotipo: z.string().nullable().optional(),
        sexo: z.string(),
        pesoInicial: numberField(requirementFields.pesoInicial),
        pesoFinal: numberField(requirementFields.pesoFinal),
        GMD: numberField(requirementFields.GMD),
    })
    .superRefine(applyRules(requirementRules))
    .openapi('RequirementsInput');

module.exports = { requirementsInputSchema, requirementRules };
