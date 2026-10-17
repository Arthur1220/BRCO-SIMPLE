const crypto = require('crypto');
const { SPECIES } = require('./animals');
const { DIET_RULES } = require('./diet');
const { requirementFields, ndtFields, publicField } = require('../contracts/fields');
const { requirementRules } = require('../contracts/requirements');
const { ndtRules, ndtOptionalGroups } = require('../contracts/ndt');
const { publicRule } = require('../contracts/rules');

/**
 * Monta o formulário público a partir das definições de campos e regras.
 */
function buildForm(fields, rules, optionalGroups = []) {
    const optionalFields = new Set(optionalGroups.flatMap((group) => group.fields));
    return {
        fields: Object.entries(fields).map(([name, def]) =>
            publicField(name, def, { required: !optionalFields.has(name) })
        ),
        rules: rules.map(publicRule),
        optionalGroups,
    };
}

let cached;

/**
 * Catálogo completo (estático: calculado uma vez por processo).
 * A `version` é um hash do conteúdo, então muda sozinha quando algo muda.
 */
function getCatalog() {
    if (cached) return cached;

    const content = {
        species: SPECIES,
        forms: {
            requirements: buildForm(requirementFields, requirementRules),
            ndt: buildForm(ndtFields, ndtRules, ndtOptionalGroups),
        },
        diet: DIET_RULES,
    };
    const version = crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex').slice(0, 12);

    cached = { version, ...content };
    return cached;
}

module.exports = { getCatalog };
