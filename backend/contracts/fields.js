const { z } = require('./zod');

/**
 * Definições dos campos numéricos dos formulários.
 * É a FONTE ÚNICA: a mesma definição gera a validação (Zod) e o que o
 * catálogo entrega ao frontend (label, unidade, limites, passo, exemplo).
 *
 * ATENÇÃO: os limites de peso e GMD são técnicos/provisórios (evitam entradas
 * absurdas) e devem ser validados pela equipe de pesquisa.
 */
const requirementFields = {
    pesoInicial: { label: 'Peso Corporal Inicial', unit: 'kg', min: 0.1, max: 200, step: 0.1, placeholder: '20' },
    pesoFinal: { label: 'Peso Corporal Final', unit: 'kg', min: 0.1, max: 200, step: 0.1, placeholder: '30' },
    GMD: { label: 'Ganho Médio Diário', unit: 'g/d', min: 1, max: 1000, step: 1, placeholder: '150' },
};

// Composição químico-bromatológica em % da matéria seca.
const ndtFields = {
    PB: { label: 'Proteína Bruta (PB)', unit: '%MS', min: 0, max: 100, step: 0.01, placeholder: '12.5' },
    EE: { label: 'Extrato Etéreo (EE)', unit: '%MS', min: 0, max: 100, step: 0.01, placeholder: '3.5' },
    FDN: { label: 'Fibra em Detergente Neutro (FDN)', unit: '%MS', min: 0.01, max: 100, step: 0.01, placeholder: '60.0' },
    Lignina: { label: 'Lignina', unit: '%MS', min: 0, max: 100, step: 0.01, placeholder: '5.0' },
    MO: { label: 'Matéria Orgânica (MO)', unit: '%MS', min: 0, max: 100, step: 0.01, placeholder: '90' },
    PIDN: { label: 'Proteína Insolúvel em Detergente Neutro (PIDN)', unit: '%MS', min: 0, max: 100, step: 0.01, placeholder: '2.5' },
    PIDA: { label: 'Proteína Insolúvel em Detergente Ácido (PIDA)', unit: '%MS', min: 0, max: 100, step: 0.01, placeholder: '1.0' },
};

/**
 * Cria o schema Zod de um campo numérico a partir da definição,
 * com mensagens prontas para exibição.
 */
function numberField(def) {
    const range = `${def.min} e ${def.max} ${def.unit}`;
    return z
        .number({
            required_error: `${def.label} é obrigatório.`,
            invalid_type_error: `${def.label} deve ser um número.`,
        })
        .finite()
        .min(def.min, `${def.label} deve estar entre ${range}.`)
        .max(def.max, `${def.label} deve estar entre ${range}.`);
}

/**
 * Representação pública de um campo (o que vai para o catálogo).
 */
function publicField(name, def, extra = {}) {
    return { name, label: def.label, unit: def.unit, min: def.min, max: def.max, step: def.step, placeholder: def.placeholder, required: true, ...extra };
}

module.exports = { requirementFields, ndtFields, numberField, publicField };
