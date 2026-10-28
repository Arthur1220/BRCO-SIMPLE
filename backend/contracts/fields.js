const { z } = require('./zod');
const { L, t } = require('../lib/i18n');

/**
 * Definições dos campos numéricos dos formulários.
 * É a FONTE ÚNICA: a mesma definição gera a validação (Zod) e o que o
 * catálogo entrega ao frontend (label, unidade, limites, passo, exemplo).
 * Limites validados pela equipe de pesquisa.
 */
const requirementFields = {
    pesoInicial: { label: L('Peso corporal inicial', 'Initial body weight'), unit: 'kg', min: 0.1, max: 200, step: 0.1, placeholder: '20' },
    pesoFinal: { label: L('Peso corporal final', 'Final body weight'), unit: 'kg', min: 0.1, max: 200, step: 0.1, placeholder: '30' },
    GMD: { label: L('Ganho médio diário', 'Average daily gain'), unit: 'g/d', min: 1, max: 1000, step: 1, placeholder: '150' },
};

// Na dieta o GMD pode ser 0 (dieta de mantença).
const dietAnimalFields = {
    ...requirementFields,
    GMD: { ...requirementFields.GMD, min: 0 },
};

// Composição químico-bromatológica em % da matéria seca.
const ndtFields = {
    PB: { label: L('Proteína bruta (PB)', 'Crude protein (CP)'), unit: '%MS', min: 0, max: 100, step: 0.01, placeholder: '12.5' },
    EE: { label: L('Extrato etéreo (EE)', 'Ether extract (EE)'), unit: '%MS', min: 0, max: 100, step: 0.01, placeholder: '3.5' },
    FDN: { label: L('Fibra em detergente neutro (FDN)', 'Neutral detergent fiber (NDF)'), unit: '%MS', min: 0.01, max: 100, step: 0.01, placeholder: '60.0' },
    Lignina: { label: L('Lignina', 'Lignin'), unit: '%MS', min: 0, max: 100, step: 0.01, placeholder: '5.0' },
    MO: { label: L('Matéria orgânica (MO)', 'Organic matter (OM)'), unit: '%MS', min: 0, max: 100, step: 0.01, placeholder: '90' },
    PIDN: { label: L('Proteína insolúvel em detergente neutro (PIDN)', 'Neutral detergent insoluble protein (NDIP)'), unit: '%MS', min: 0, max: 100, step: 0.01, placeholder: '2.5' },
    PIDA: { label: L('Proteína insolúvel em detergente ácido (PIDA)', 'Acid detergent insoluble protein (ADIP)'), unit: '%MS', min: 0, max: 100, step: 0.01, placeholder: '1.0' },
};

// Ingredientes da dieta.
const ingredientFields = {
    min: { label: L('Inclusão mínima', 'Minimum inclusion'), unit: '%', min: 0, max: 100, step: 0.1, placeholder: '0' },
    max: { label: L('Inclusão máxima', 'Maximum inclusion'), unit: '%', min: 0, max: 100, step: 0.1, placeholder: '100' },
    // A unidade depende de priceBasis (R$/kg MS ou R$/kg de matéria natural).
    price: { label: L('Preço', 'Price'), unit: 'R$/kg', min: 0, max: 100000, step: 0.01, placeholder: '1.50' },
};

// Composição de alimento personalizado, na mesma unidade dos alimentos cadastrados.
const customFoodFields = {
    MS: { label: L('Matéria seca (MS)', 'Dry matter (DM)'), unit: 'g/kg', min: 0, max: 1000, step: 0.1, placeholder: '880' },
    PB: { label: L('Proteína bruta (PB)', 'Crude protein (CP)'), unit: 'g/kg MS', min: 0, max: 3000, step: 0.1, placeholder: '120' },
    NDT: { label: L('Nutrientes digestíveis totais (NDT)', 'Total digestible nutrients (TDN)'), unit: 'g/kg MS', min: 0, max: 1000, step: 0.1, placeholder: '650' },
    FDNcp: { label: L('FDN corrigida para cinzas e proteína', 'Ash- and protein-corrected NDF'), unit: 'g/kg MS', min: 0, max: 1000, step: 0.1, placeholder: '450' },
    Ca: { label: L('Cálcio (Ca)', 'Calcium (Ca)'), unit: 'g/kg MS', min: 0, max: 1000, step: 0.01, placeholder: '5' },
    P: { label: L('Fósforo (P)', 'Phosphorus (P)'), unit: 'g/kg MS', min: 0, max: 1000, step: 0.01, placeholder: '3' },
};

// Dados opcionais usados pelas travas de segurança da dieta (catalog/dietSafety).
const foodSafetyFields = {
    EE: { label: L('Extrato etéreo (EE)', 'Ether extract (EE)'), unit: 'g/kg MS', min: 0, max: 1000, step: 0.1, placeholder: '30' },
    CNF: { label: L('Carboidratos não fibrosos (CNF)', 'Non-fiber carbohydrates (NFC)'), unit: 'g/kg MS', min: 0, max: 1000, step: 0.1, placeholder: '300' },
    NNP: { label: L('Nitrogênio não proteico (NNP), em equivalente de PB', 'Non-protein nitrogen (NPN), as CP equivalent'), unit: 'g/kg MS', min: 0, max: 3000, step: 0.1, placeholder: '0' },
    Cu: { label: L('Cobre (Cu)', 'Copper (Cu)'), unit: 'mg/kg MS', min: 0, max: 100000, step: 0.1, placeholder: '10' },
    Mo: { label: L('Molibdênio (Mo)', 'Molybdenum (Mo)'), unit: 'mg/kg MS', min: 0, max: 100000, step: 0.01, placeholder: '1' },
    S: { label: L('Enxofre (S)', 'Sulfur (S)'), unit: 'g/kg MS', min: 0, max: 1000, step: 0.01, placeholder: '2' },
    PDR: { label: L('Proteína degradável no rúmen (PDR)', 'Rumen-degradable protein (RDP)'), unit: 'g/kg MS', min: 0, max: 3000, step: 0.1, placeholder: '70' },
    PNDR: { label: L('Proteína não degradável no rúmen (PNDR)', 'Rumen-undegradable protein (RUP)'), unit: 'g/kg MS', min: 0, max: 3000, step: 0.1, placeholder: '40' },
    Zn: { label: L('Zinco (Zn)', 'Zinc (Zn)'), unit: 'mg/kg MS', min: 0, max: 100000, step: 0.1, placeholder: '30' },
    Mn: { label: L('Manganês (Mn)', 'Manganese (Mn)'), unit: 'mg/kg MS', min: 0, max: 100000, step: 0.1, placeholder: '40' },
    Fe: { label: L('Ferro (Fe)', 'Iron (Fe)'), unit: 'mg/kg MS', min: 0, max: 100000, step: 0.1, placeholder: '100' },
    Co: { label: L('Cobalto (Co)', 'Cobalt (Co)'), unit: 'mg/kg MS', min: 0, max: 100000, step: 0.01, placeholder: '0.2' },
};

// Lote e trato (dieta no cocho).
const dietLotFields = {
    animals: { label: L('Animais no lote', 'Animals in the group'), unit: 'animais', min: 1, max: 100000, step: 1, placeholder: '20' },
    feedingsPerDay: { label: L('Tratos por dia', 'Feedings per day'), unit: 'tratos/d', min: 1, max: 6, step: 1, placeholder: '2' },
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
            // Vazio (ausente ou null) é "obrigatório"; qualquer outro tipo é "deve ser um número".
            errorMap: (issue, ctx) => {
                if (issue.code !== 'invalid_type') return { message: ctx.defaultError };
                const empty = issue.received === 'undefined' || issue.received === 'null';
                return { message: format(t(empty ? MESSAGES.required : MESSAGES.number, locale), values) };
            },
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
    requirementFields, dietAnimalFields, ndtFields, ingredientFields, customFoodFields, foodSafetyFields, dietLotFields,
    numberField, publicField, format,
};
