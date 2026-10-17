const { z } = require('./zod');
const { L, t } = require('../lib/i18n');

/**
 * Definições dos campos numéricos dos formulários.
 * É a FONTE ÚNICA: a mesma definição gera a validação (Zod) e o que o
 * catálogo entrega ao frontend (label, unidade, limites, passo, exemplo).
 * Limites validados pela equipe de pesquisa.
 */
const requirementFields = {
    pesoInicial: { label: L('Peso Corporal Inicial', 'Initial Body Weight'), unit: 'kg', min: 0.1, max: 200, step: 0.1, placeholder: '20' },
    pesoFinal: { label: L('Peso Corporal Final', 'Final Body Weight'), unit: 'kg', min: 0.1, max: 200, step: 0.1, placeholder: '30' },
    GMD: { label: L('Ganho Médio Diário', 'Average Daily Gain'), unit: 'g/d', min: 1, max: 1000, step: 1, placeholder: '150' },
};

// Na dieta o GMD pode ser 0 (dieta de mantença).
const dietAnimalFields = {
    ...requirementFields,
    GMD: { ...requirementFields.GMD, min: 0 },
};

// Composição químico-bromatológica em % da matéria seca.
const ndtFields = {
    PB: { label: L('Proteína Bruta (PB)', 'Crude Protein (CP)'), unit: '%MS', min: 0, max: 100, step: 0.01, placeholder: '12.5' },
    EE: { label: L('Extrato Etéreo (EE)', 'Ether Extract (EE)'), unit: '%MS', min: 0, max: 100, step: 0.01, placeholder: '3.5' },
    FDN: { label: L('Fibra em Detergente Neutro (FDN)', 'Neutral Detergent Fiber (NDF)'), unit: '%MS', min: 0.01, max: 100, step: 0.01, placeholder: '60.0' },
    Lignina: { label: L('Lignina', 'Lignin'), unit: '%MS', min: 0, max: 100, step: 0.01, placeholder: '5.0' },
    MO: { label: L('Matéria Orgânica (MO)', 'Organic Matter (OM)'), unit: '%MS', min: 0, max: 100, step: 0.01, placeholder: '90' },
    PIDN: { label: L('Proteína Insolúvel em Detergente Neutro (PIDN)', 'Neutral Detergent Insoluble Protein (NDIP)'), unit: '%MS', min: 0, max: 100, step: 0.01, placeholder: '2.5' },
    PIDA: { label: L('Proteína Insolúvel em Detergente Ácido (PIDA)', 'Acid Detergent Insoluble Protein (ADIP)'), unit: '%MS', min: 0, max: 100, step: 0.01, placeholder: '1.0' },
};

// Ingredientes da dieta.
const ingredientFields = {
    min: { label: L('Inclusão mínima', 'Minimum inclusion'), unit: '%', min: 0, max: 100, step: 0.1, placeholder: '0' },
    max: { label: L('Inclusão máxima', 'Maximum inclusion'), unit: '%', min: 0, max: 100, step: 0.1, placeholder: '100' },
    price: { label: L('Preço', 'Price'), unit: 'R$/kg MS', min: 0, max: 100000, step: 0.01, placeholder: '1.50' },
};

// Composição de alimento personalizado, na mesma unidade dos alimentos cadastrados.
const customFoodFields = {
    MS: { label: L('Matéria Seca (MS)', 'Dry Matter (DM)'), unit: 'g/kg', min: 0, max: 1000, step: 0.1, placeholder: '880' },
    PB: { label: L('Proteína Bruta (PB)', 'Crude Protein (CP)'), unit: 'g/kg MS', min: 0, max: 3000, step: 0.1, placeholder: '120' },
    NDT: { label: L('Nutrientes Digestíveis Totais (NDT)', 'Total Digestible Nutrients (TDN)'), unit: 'g/kg MS', min: 0, max: 1000, step: 0.1, placeholder: '650' },
    FDNcp: { label: L('FDN corrigida para cinzas e proteína', 'Ash- and protein-corrected NDF'), unit: 'g/kg MS', min: 0, max: 1000, step: 0.1, placeholder: '450' },
    Ca: { label: L('Cálcio (Ca)', 'Calcium (Ca)'), unit: 'g/kg MS', min: 0, max: 1000, step: 0.01, placeholder: '5' },
    P: { label: L('Fósforo (P)', 'Phosphorus (P)'), unit: 'g/kg MS', min: 0, max: 1000, step: 0.01, placeholder: '3' },
};

const MESSAGES = {
    required: L('{label} é obrigatório.', '{label} is required.'),
    number: L('{label} deve ser um número.', '{label} must be a number.'),
    range: L('{label} deve estar entre {min} e {max} {unit}.', '{label} must be between {min} and {max} {unit}.'),
};

/**
 * Preenche os {placeholders} de uma mensagem.
 */
function format(template, values) {
    return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

/**
 * Cria o schema Zod de um campo numérico a partir da definição,
 * com mensagens prontas para exibição no idioma pedido.
 */
function numberField(def, locale) {
    const values = { label: t(def.label, locale), min: def.min, max: def.max, unit: def.unit };
    const range = format(t(MESSAGES.range, locale), values).replace(/ \./, '.');
    return z
        .number({
            required_error: format(t(MESSAGES.required, locale), values),
            invalid_type_error: format(t(MESSAGES.number, locale), values),
        })
        .finite()
        .min(def.min, range)
        .max(def.max, range);
}

/**
 * Representação pública de um campo (o que vai para o catálogo).
 */
function publicField(name, def, locale, extra = {}) {
    return {
        name,
        label: t(def.label, locale),
        unit: def.unit,
        min: def.min,
        max: def.max,
        step: def.step,
        placeholder: def.placeholder,
        required: true,
        ...extra,
    };
}

module.exports = {
    requirementFields, dietAnimalFields, ndtFields, ingredientFields, customFoodFields,
    numberField, publicField, format,
};
