const { L } = require('../lib/i18n');

/**
 * Metadados dos resultados do domínio: cada chave interna (texto livre gerado
 * pelas fórmulas) ganha um `code` estável, grupo, label traduzido e ordem.
 * O frontend nunca depende das chaves internas.
 * Um teste garante que toda chave produzida pelo domínio esteja mapeada aqui.
 */

// Notação de unidades padronizada (só a escrita muda, nunca o valor).
const UNIT_NOTATION = {
    'g/dia': 'g/d',
    'mg/dia': 'mg/d',
    'Mcal/dia': 'Mcal/d',
    'g/kgMS': 'g/kg MS',
    'mg/kgMS': 'mg/kg MS',
};

function normalizeUnit(unit) {
    return UNIT_NOTATION[unit] || unit;
}

// ------------------------------------------------------------------
// Exigências nutricionais
// ------------------------------------------------------------------

const REQUIREMENT_GROUPS = [
    { code: 'consumo', label: L('Consumo', 'Intake'), summary: 'cms_g_d' },
    { code: 'energia', label: L('Energia', 'Energy'), summary: 'ndt_g_d' },
    { code: 'proteina', label: L('Proteína', 'Protein'), summary: 'pmt_g_d' },
    { code: 'macrominerais', label: L('Macrominerais', 'Macrominerals') },
    { code: 'microminerais', label: L('Microminerais', 'Microminerals') },
];

const REQUIREMENT_HIGHLIGHTS = ['cms_g_d', 'emt_mcal_d', 'pb_g_d'];

const requirementOutputs = [
    { key: 'Consumo de matéria seca', code: 'cms_g_d', group: 'consumo', label: L('Consumo de matéria seca', 'Dry matter intake') },

    { key: 'Energia líquida de mantença', code: 'elm_mcal_d', group: 'energia', label: L('Energia líquida de mantença', 'Net energy for maintenance') },
    { key: 'Energia líquida de ganho', code: 'elg_mcal_d', group: 'energia', label: L('Energia líquida de ganho', 'Net energy for gain') },
    { key: 'Energia líquida total', code: 'elt_mcal_d', group: 'energia', label: L('Energia líquida total', 'Total net energy') },
    { key: 'Energia metabolizável de mantença', code: 'emm_mcal_d', group: 'energia', label: L('Energia metabolizável de mantença', 'Metabolizable energy for maintenance') },
    { key: 'Energia metabolizável de ganho', code: 'emg_mcal_d', group: 'energia', label: L('Energia metabolizável de ganho', 'Metabolizable energy for gain') },
    { key: 'Energia metabolizável total', code: 'emt_mcal_d', group: 'energia', label: L('Energia metabolizável total', 'Total metabolizable energy') },
    { key: 'Energia metabolizável', code: 'em_mcal_kg', group: 'energia', label: L('Energia metabolizável da dieta', 'Dietary metabolizable energy') },
    { key: 'Energia digestível', code: 'ed_mcal_kg', group: 'energia', label: L('Energia digestível da dieta', 'Dietary digestible energy') },
    { key: 'Energia digestível total', code: 'edt_mcal_d', group: 'energia', label: L('Energia digestível total', 'Total digestible energy') },
    { key: 'Nutrientes digestíveis totais1', code: 'ndt_g_d', group: 'energia', label: L('Nutrientes digestíveis totais', 'Total digestible nutrients') },
    { key: 'Nutrientes digestíveis totais', code: 'ndt_g_kg', group: 'energia', label: L('Nutrientes digestíveis totais da dieta', 'Dietary total digestible nutrients') },

    { key: 'Proteína líquida de mantença', code: 'plm_g_d', group: 'proteina', label: L('Proteína líquida de mantença', 'Net protein for maintenance') },
    { key: 'Proteína líquida de ganho', code: 'plg_g_d', group: 'proteina', label: L('Proteína líquida de ganho', 'Net protein for gain') },
    { key: 'Proteína líquida total', code: 'plt_g_d', group: 'proteina', label: L('Proteína líquida total', 'Total net protein') },
    { key: 'Proteína metabolizável de mantença', code: 'pmm_g_d', group: 'proteina', label: L('Proteína metabolizável de mantença', 'Metabolizable protein for maintenance') },
    { key: 'Proteína metabolizável de ganho', code: 'pmg_g_d', group: 'proteina', label: L('Proteína metabolizável de ganho', 'Metabolizable protein for gain') },
    { key: 'Proteína metabolizável total', code: 'pmt_g_d', group: 'proteina', label: L('Proteína metabolizável total', 'Total metabolizable protein') },
    { key: 'Proteína degradável no rúmen', code: 'pdr_g_d', group: 'proteina', label: L('Proteína degradável no rúmen', 'Rumen degradable protein') },
    { key: 'Proteína não degradável no rúmen', code: 'pndr_g_d', group: 'proteina', label: L('Proteína não degradável no rúmen', 'Rumen undegradable protein') },
    { key: 'Proteína bruta 1', code: 'pb_g_d', group: 'proteina', label: L('Proteína bruta', 'Crude protein') },
    { key: 'Proteína bruta', code: 'pb_g_kg', group: 'proteina', label: L('Proteína bruta da dieta', 'Dietary crude protein') },

    { key: 'Relação Ca:P', code: 'ca_p_ratio', group: 'macrominerais', label: L('Relação Ca:P', 'Ca:P ratio') },
];

const MINERALS = [
    { name: 'Cálcio', code: 'ca', group: 'macrominerais', label: L('Cálcio', 'Calcium') },
    { name: 'Fósforo', code: 'p', group: 'macrominerais', label: L('Fósforo', 'Phosphorus') },
    { name: 'Magnésio', code: 'mg', group: 'macrominerais', label: L('Magnésio', 'Magnesium') },
    { name: 'Sódio', code: 'na', group: 'macrominerais', label: L('Sódio', 'Sodium') },
    { name: 'Potássio', code: 'k', group: 'macrominerais', label: L('Potássio', 'Potassium') },
    { name: 'Cobre', code: 'cu', group: 'microminerais', label: L('Cobre', 'Copper') },
    { name: 'Ferro', code: 'fe', group: 'microminerais', label: L('Ferro', 'Iron') },
    { name: 'Manganês', code: 'mn', group: 'microminerais', label: L('Manganês', 'Manganese') },
    { name: 'Zinco', code: 'zn', group: 'microminerais', label: L('Zinco', 'Zinc') },
    { name: 'Cobalto', code: 'co', group: 'microminerais', label: L('Cobalto', 'Cobalt') },
    { name: 'Cromo', code: 'cr', group: 'microminerais', label: L('Cromo', 'Chromium') },
];

const MINERAL_FRACTIONS = [
    { suffix: 'Mantença', code: 'mantenca', pt: 'de mantença', en: 'for maintenance' },
    { suffix: 'Ganho', code: 'ganho', pt: 'de ganho', en: 'for gain' },
    { suffix: 'Líquido Total', code: 'liquido_total', pt: 'líquido total', en: 'total net' },
    { suffix: 'Dietético', code: 'dietetico', pt: 'dietético', en: 'dietary' },
    { suffix: 'Total', code: 'total', pt: 'total na dieta', en: 'dietary concentration' },
];

for (const mineral of MINERALS) {
    for (const fraction of MINERAL_FRACTIONS) {
        requirementOutputs.push({
            key: `${mineral.name} ${fraction.suffix}`,
            code: `${mineral.code}_${fraction.code}`,
            group: mineral.group,
            label: L(`${mineral.label['pt-BR']} ${fraction.pt}`, `${mineral.label.en} ${fraction.en}`),
        });
    }
}

// ------------------------------------------------------------------
// NDT de alimentos
// ------------------------------------------------------------------

const NDT_GROUPS = [
    { code: 'energia', label: L('Energia', 'Energy'), summary: 'ndt_pct' },
    { code: 'fracoes_digestiveis', label: L('Frações digestíveis', 'Digestible fractions') },
];

const NDT_HIGHLIGHTS = ['ndt_pct', 'ed'];

const ndtOutputs = [
    { key: 'Nutrientes digestíveis totais', code: 'ndt_pct', group: 'energia', label: L('Nutrientes digestíveis totais', 'Total digestible nutrients') },
    { key: 'Energia digestivel', code: 'ed', group: 'energia', label: L('Energia digestível', 'Digestible energy') },
    { key: 'Energia metabolizável para caprinos', code: 'em_caprinos', group: 'energia', label: L('Energia metabolizável para caprinos', 'Metabolizable energy for goats') },
    { key: 'Energia metabolizável para ovinos', code: 'em_ovinos', group: 'energia', label: L('Energia metabolizável para ovinos', 'Metabolizable energy for sheep') },
    { key: 'Proteína bruta verdadeiramente digestível', code: 'pbvd_pct', group: 'fracoes_digestiveis', label: L('Proteína bruta verdadeiramente digestível', 'Truly digestible crude protein') },
    { key: 'Extrato etéreo verdadeiramente digestível', code: 'eevd_pct', group: 'fracoes_digestiveis', label: L('Extrato etéreo verdadeiramente digestível', 'Truly digestible ether extract') },
    { key: 'Fibra em detergente neutro digestível', code: 'fdnd_pct', group: 'fracoes_digestiveis', label: L('Fibra em detergente neutro digestível', 'Digestible neutral detergent fiber') },
    { key: 'Carboidratos não-fibrosos verdadeiramente digestíveis', code: 'cnfvd_pct', group: 'fracoes_digestiveis', label: L('Carboidratos não-fibrosos verdadeiramente digestíveis', 'Truly digestible non-fiber carbohydrates') },
];

// ------------------------------------------------------------------
// Dieta
// ------------------------------------------------------------------

const DIET_BALANCE = [
    { key: 'Proteína Bruta', code: 'pb', label: L('Proteína bruta', 'Crude protein') },
    { key: 'NDT', code: 'ndt', label: L('Nutrientes digestíveis totais', 'Total digestible nutrients') },
    { key: 'PDR', code: 'pdr', label: L('Proteína degradável no rúmen', 'Rumen-degradable protein') },
    { key: 'PNDR', code: 'pndr', label: L('Proteína não degradável no rúmen', 'Rumen-undegradable protein') },
    { key: 'Cálcio', code: 'ca', label: L('Cálcio', 'Calcium') },
    { key: 'Fósforo', code: 'p', label: L('Fósforo', 'Phosphorus') },
    { key: 'Cobre', code: 'cu', label: L('Cobre', 'Copper') },
    { key: 'Zinco', code: 'zn', label: L('Zinco', 'Zinc') },
    { key: 'Manganês', code: 'mn', label: L('Manganês', 'Manganese') },
    { key: 'Ferro', code: 'fe', label: L('Ferro', 'Iron') },
    { key: 'Cobalto', code: 'co', label: L('Cobalto', 'Cobalt') },
];

// Explicação do custo da dieta (costInsights do dietService).
const COST_INSIGHTS = {
    nutrient: L('Exigência de {label}: cada 1% a mais custaria {value}/animal/dia.', '{label} requirement: each extra 1% would cost {value}/animal/day.'),
    max: L('{food} está no limite máximo ({limit}%): 1 ponto a mais de folga economizaria {value}/animal/dia.', '{food} is at its maximum ({limit}%): 1 more point would save {value}/animal/day.'),
    min: L('{food} está no limite mínimo ({limit}%): 1 ponto a menos economizaria {value}/animal/dia.', '{food} is at its minimum ({limit}%): 1 point less would save {value}/animal/day.'),
    safety: L('Trava no limite: {label}.', 'Safety limit reached: {label}.'),
    unusedEnters: L('{food} entraria na dieta custando até {price} (hoje {current}).', '{food} would enter the diet at up to {price} (now {current}).'),
    unusedNever: L('{food} não entra na dieta nem de graça com as exigências e limites atuais.', '{food} would not enter the diet even for free with the current requirements and limits.'),
};
const NUTRIENT_SHORT = {
    PB: L('proteína bruta', 'crude protein'),
    NDT: L('NDT', 'TDN'),
    PDR: L('PDR', 'RDP'),
    PNDR: L('PNDR', 'RUP'),
};

const BALANCE_STATUS = {
    ideal: L('Ideal', 'Ideal'),
    deficit: L('Déficit', 'Deficit'),
    excess: L('Excesso', 'Excess'),
    info: L('Informativo', 'Informative'),
};

const DIET_OPTIONS = {
    ideal: {
        label: L('Priorizar a nutrição', 'Prioritize nutrition'),
        description: L(
            'Atende as exigências nutricionais ignorando os limites de inclusão que você definiu (valem só os padrões de cada alimento e as travas de segurança).',
            'Meets nutritional requirements ignoring the inclusion limits you set (only each food\'s defaults and the safety limits apply).'
        ),
    },
    realistic: {
        label: L('Respeitar meus limites', 'Respect my limits'),
        description: L(
            'Respeita os seus limites de inclusão e as travas de segurança, mas não atende todas as exigências nutricionais.',
            'Respects your inclusion limits and the safety limits but does not meet all nutritional requirements.'
        ),
    },
};

const DIET_STATUS = {
    optimal: L('Solução ótima encontrada.', 'Optimal solution found.'),
    conflict: L(
        'Não é possível atender a nutrição respeitando todos os limites. Escolha uma das opções.',
        'Nutrition cannot be met within all limits. Choose one of the options.'
    ),
    blocked: L(
        'Não há dieta segura com estes alimentos. Veja o motivo abaixo e ajuste os alimentos.',
        'There is no safe diet with these foods. See the reason below and adjust the foods.'
    ),
};

module.exports = {
    normalizeUnit,
    REQUIREMENT_GROUPS, REQUIREMENT_HIGHLIGHTS, requirementOutputs,
    NDT_GROUPS, NDT_HIGHLIGHTS, ndtOutputs,
    DIET_BALANCE, BALANCE_STATUS, DIET_OPTIONS, DIET_STATUS, COST_INSIGHTS, NUTRIENT_SHORT,
};
