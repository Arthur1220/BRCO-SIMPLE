const { z } = require('./zod');
const { ndtFields, numberField } = require('./fields');
const { applyRules } = require('./rules');
const { perLocale } = require('./localized');
const { L } = require('../lib/i18n');

// Campos opcionais em conjunto: sem eles o domínio usa a fórmula simplificada de PBvd.
const ndtOptionalGroups = [
    {
        code: 'fracoes_proteicas',
        label: L('Possui os valores de PIDN e PIDA?', 'Do you have NDIP and ADIP values?'),
        fields: ['PIDN', 'PIDA'],
    },
];

const ndtRules = [
    {
        code: 'lignina_lte_fdn',
        message: L('A lignina não pode ser maior que a FDN.', 'Lignin cannot be greater than NDF.'),
        fields: ['Lignina', 'FDN'],
        check: (d) => d.Lignina <= d.FDN,
    },
    {
        code: 'components_lte_mo',
        message: L(
            'PB + EE + FDN não pode ultrapassar a matéria orgânica (CNF ficaria negativo).',
            'CP + EE + NDF cannot exceed organic matter (NFC would be negative).'
        ),
        fields: ['MO', 'PB', 'EE', 'FDN'],
        check: (d) => d.PB + d.EE + d.FDN <= d.MO,
    },
    {
        code: 'pidn_lte_pb',
        message: L('O PIDN não pode ser maior que a PB.', 'NDIP cannot be greater than CP.'),
        fields: ['PIDN', 'PB'],
        check: (d) => d.PIDN === undefined || d.PIDN <= d.PB,
    },
    {
        code: 'pida_lte_pidn',
        message: L('O PIDA não pode ser maior que o PIDN.', 'ADIP cannot be greater than NDIP.'),
        fields: ['PIDA', 'PIDN'],
        check: (d) => d.PIDA === undefined || d.PIDN === undefined || d.PIDA <= d.PIDN,
    },
    {
        code: 'fracoes_together',
        message: L('Informe PIDN e PIDA juntos, ou nenhum dos dois.', 'Provide both NDIP and ADIP, or neither.'),
        fields: ['PIDN', 'PIDA'],
        check: (d) => (d.PIDN === undefined) === (d.PIDA === undefined),
    },
];

/**
 * Entrada de POST /api/v1/calculations/ndt (corrige o nome do campo "Ligrina" → "Lignina").
 */
const getNdtInputSchema = perLocale((locale) =>
    z
        .object({
            PB: numberField(ndtFields.PB, locale),
            EE: numberField(ndtFields.EE, locale),
            FDN: numberField(ndtFields.FDN, locale),
            Lignina: numberField(ndtFields.Lignina, locale),
            MO: numberField(ndtFields.MO, locale),
            PIDN: numberField(ndtFields.PIDN, locale).optional(),
            PIDA: numberField(ndtFields.PIDA, locale).optional(),
        })
        .superRefine(applyRules(ndtRules, locale))
        .openapi('NdtInput')
);

/**
 * Converte a entrada da v1 para o formato do domínio (ndtService).
 */
function toDomainNdt({ PB, EE, FDN, Lignina, MO, PIDN, PIDA }) {
    return { PB, EE, FDN, Ligrina: Lignina, MO, PIDN: PIDN ?? 0, PIDA: PIDA ?? 0 };
}

module.exports = { getNdtInputSchema, ndtRules, ndtOptionalGroups, toDomainNdt };
