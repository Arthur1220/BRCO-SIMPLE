const { L, t } = require('../lib/i18n');

/**
 * Verificações de consistência do cadastro de alimentos (não bloqueiam o salvamento).
 * Erro de dado no cadastro vira erro de dieta, então o painel avisa o que parece errado.
 * Todos os nutrientes em g/kg MS (MS em g/kg de matéria natural; microminerais em mg/kg MS).
 */
const LIMITS = {
    compositionTolerance: 0.05,  // PB + EE + CNF + FDNcp deve fechar com a MO (± 5%)
    fractionsTolerance: 0.10,    // PDR + PNDR deve ficar perto da PB (± 10%)
    // Faixas plausíveis de Ca e P (g/kg MS) por categoria. Palma chega a ~80 g Ca/kg MS.
    ca: { VOLUMOSO: [0.5, 90], CONCENTRADO: [0.1, 25], SUPLEMENTO: [0, 400] },
    p: { VOLUMOSO: [0.3, 8], CONCENTRADO: [0.5, 20], SUPLEMENTO: [0, 250] },
    msMin: { VOLUMOSO: 80, CONCENTRADO: 700, SUPLEMENTO: 800 },
};

const MESSAGES = {
    composition_sum: L(
        'PB + EE + CNF + FDNcp = {sum} g/kg MS, mas a MO é {mo} g/kg MS (diferença de {diff}%). Confira os valores: a soma deve fechar com a matéria orgânica.',
        'CP + EE + NFC + NDFcp = {sum} g/kg DM, but OM is {mo} g/kg DM ({diff}% off). Check the values: the sum should match organic matter.'
    ),
    protein_fractions: L(
        'PDR + PNDR = {sum} g/kg MS, mas a PB é {pb} g/kg MS (diferença de {diff}%). PDR e PNDR são frações da proteína bruta.',
        'RDP + RUP = {sum} g/kg DM, but CP is {pb} g/kg DM ({diff}% off). RDP and RUP are fractions of crude protein.'
    ),
    ca_range: L(
        'Cálcio de {value} g/kg MS está fora da faixa comum para {category} ({min} a {max}). Confira a unidade (g/kg MS, não %).',
        'Calcium of {value} g/kg DM is outside the usual range for {category} ({min} to {max}). Check the unit (g/kg DM, not %).'
    ),
    p_range: L(
        'Fósforo de {value} g/kg MS está fora da faixa comum para {category} ({min} a {max}). Confira a unidade (g/kg MS, não %).',
        'Phosphorus of {value} g/kg DM is outside the usual range for {category} ({min} to {max}). Check the unit (g/kg DM, not %).'
    ),
    ms_low: L(
        'MS de {value} g/kg parece baixa para {category} (esperado acima de {min}). A MS é em g/kg de matéria natural.',
        'DM of {value} g/kg looks low for {category} (expected above {min}). DM is in g/kg as fed.'
    ),
    ndt_missing: L('NDT zerado: o alimento não contribui com energia na dieta.', 'TDN is zero: the feed adds no energy to the diet.'),
    ndt_above_mo: L('NDT ({ndt}) maior que a MO ({mo}) só é possível com muita gordura. Confira.', 'TDN ({ndt}) above OM ({mo}) is only possible with a lot of fat. Check it.'),
    supplement_no_copper: L(
        'Suplemento sem teor de cobre: em dietas de ovinos a trava de cobre fica incompleta. Informe o Cu do rótulo.',
        'Supplement without copper content: the copper limit is incomplete in sheep diets. Enter Cu from the label.'
    ),
    supplement_no_species: L(
        'Suplemento sem espécie de destino. Se for mistura para bovinos, marque "Bovinos" para que não entre em dieta de ovinos.',
        'Supplement without a target species. If it is a cattle mix, mark "Cattle" so it is never used in sheep diets.'
    ),
};

const CATEGORY_LABELS = {
    VOLUMOSO: L('volumoso', 'roughage'),
    CONCENTRADO: L('concentrado', 'concentrate'),
    SUPLEMENTO: L('suplemento', 'supplement'),
};

const num = (value) => (value === null || value === undefined || value === '' ? null : Number(value));
const percentOff = (value, reference) => Math.round((Math.abs(value - reference) / reference) * 1000) / 10;

/**
 * Lista de avisos ({ code, severity, params }) de um alimento.
 */
function checkFoodQuality(food) {
    const warnings = [];
    const add = (code, params = {}, severity = 'warning') => warnings.push({ code, severity, params });
    const category = food.category;
    const isSupplement = category === 'SUPLEMENTO';
    const [MS, MO, PB, EE, CNF, FDN, PDR, PNDR, NDT, Ca, P] =
        ['MS', 'MO', 'PB', 'EE', 'CNF', 'FDNcp', 'PDR', 'PNDR', 'NDT', 'Ca', 'P'].map((k) => num(food[k]));

    if (!isSupplement && [MO, PB, EE, CNF, FDN].every((v) => v !== null) && MO > 0) {
        const sum = PB + EE + CNF + FDN;
        if (Math.abs(sum - MO) / MO > LIMITS.compositionTolerance) add('composition_sum', { sum: Math.round(sum * 10) / 10, mo: MO, diff: percentOff(sum, MO) });
    }

    if (PB !== null && PB > 0 && PDR !== null && PNDR !== null) {
        const sum = PDR + PNDR;
        if (Math.abs(sum - PB) / PB > LIMITS.fractionsTolerance) add('protein_fractions', { sum: Math.round(sum * 10) / 10, pb: PB, diff: percentOff(sum, PB) });
    }

    for (const [key, value] of [['ca', Ca], ['p', P]]) {
        const range = LIMITS[key][category];
        if (range && value !== null && (value < range[0] || value > range[1])) {
            add(`${key}_range`, { value, category, min: range[0], max: range[1] });
        }
    }

    const msMin = LIMITS.msMin[category];
    if (msMin && MS !== null && MS < msMin) add('ms_low', { value: MS, category, min: msMin });

    if (!isSupplement && NDT !== null) {
        if (NDT === 0) add('ndt_missing');
        else if (MO !== null && EE !== null && NDT > MO && EE < 60) add('ndt_above_mo', { ndt: NDT, mo: MO });
    }

    if (isSupplement) {
        if (num(food.Cu) === null) add('supplement_no_copper');
        if (!food.targetSpecies) add('supplement_no_species', {}, 'info');
    }
    return warnings;
}

/**
 * Avisos no idioma pedido.
 */
function presentFoodQuality(warnings, locale) {
    return warnings.map(({ code, severity, params }) => {
        const values = { ...params, category: params.category ? t(CATEGORY_LABELS[params.category], locale) : undefined };
        const message = t(MESSAGES[code], locale).replace(/\{(\w+)\}/g, (_, key) => {
            const value = values[key];
            return typeof value === 'number' ? value.toLocaleString(locale) : String(value ?? '');
        });
        return { code, severity, message };
    });
}

module.exports = { checkFoodQuality, presentFoodQuality, LIMITS };
