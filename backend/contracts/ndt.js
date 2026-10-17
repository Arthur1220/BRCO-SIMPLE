const { z } = require('./zod');
const { ndtFields, numberField } = require('./fields');
const { applyRules } = require('./rules');

// Campos opcionais em conjunto: sem eles o domínio usa a fórmula simplificada de PBvd.
const ndtOptionalGroups = [
    { code: 'fracoes_proteicas', label: 'Possui os valores de PIDN e PIDA?', fields: ['PIDN', 'PIDA'] },
];

const ndtRules = [
    {
        code: 'lignina_lte_fdn',
        message: 'A lignina não pode ser maior que a FDN.',
        fields: ['Lignina', 'FDN'],
        check: (d) => d.Lignina <= d.FDN,
    },
    {
        code: 'components_lte_mo',
        message: 'PB + EE + FDN não pode ultrapassar a matéria orgânica (CNF ficaria negativo).',
        fields: ['MO', 'PB', 'EE', 'FDN'],
        check: (d) => d.PB + d.EE + d.FDN <= d.MO,
    },
    {
        code: 'pidn_lte_pb',
        message: 'O PIDN não pode ser maior que a PB.',
        fields: ['PIDN', 'PB'],
        check: (d) => d.PIDN === undefined || d.PIDN <= d.PB,
    },
    {
        code: 'pida_lte_pidn',
        message: 'O PIDA não pode ser maior que o PIDN.',
        fields: ['PIDA', 'PIDN'],
        check: (d) => d.PIDA === undefined || d.PIDN === undefined || d.PIDA <= d.PIDN,
    },
    {
        code: 'fracoes_together',
        message: 'Informe PIDN e PIDA juntos, ou nenhum dos dois.',
        fields: ['PIDN', 'PIDA'],
        check: (d) => (d.PIDN === undefined) === (d.PIDA === undefined),
    },
];

/**
 * Entrada do cálculo de NDT na v1 (corrige o nome do campo "Ligrina" → "Lignina").
 */
const ndtInputSchema = z
    .object({
        PB: numberField(ndtFields.PB),
        EE: numberField(ndtFields.EE),
        FDN: numberField(ndtFields.FDN),
        Lignina: numberField(ndtFields.Lignina),
        MO: numberField(ndtFields.MO),
        PIDN: numberField(ndtFields.PIDN).optional(),
        PIDA: numberField(ndtFields.PIDA).optional(),
    })
    .superRefine(applyRules(ndtRules))
    .openapi('NdtInput');

module.exports = { ndtInputSchema, ndtRules, ndtOptionalGroups };
