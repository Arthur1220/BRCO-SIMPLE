const crypto = require('crypto');
const { t, SUPPORTED_LOCALES } = require('../lib/i18n');
const { SPECIES } = require('./animals');
const { DIET_RULES } = require('./diet');
const {
    requirementFields, dietAnimalFields, ndtFields, ingredientFields, customFoodFields, foodSafetyFields, dietLotFields, publicField,
} = require('../contracts/fields');
const { requirementRules } = require('../contracts/requirements');
const { ndtRules, ndtOptionalGroups } = require('../contracts/ndt');
const { dietRules, customFoodOptionalGroups } = require('../contracts/diet');
const { TARGET_SPECIES } = require('./dietSafety');
const { publicRule } = require('../contracts/rules');

/**
 * Monta o formulário público a partir das definições de campos e regras.
 */
function buildForm(fields, rules, locale, optionalGroups = []) {
    const optionalFields = new Set(optionalGroups.flatMap((group) => group.fields));
    return {
        fields: Object.entries(fields).map(([name, def]) =>
            publicField(name, def, locale, { required: !optionalFields.has(name) })
        ),
        rules: rules.map((rule) => publicRule(rule, locale)),
        optionalGroups: optionalGroups.map((group) => ({ ...group, label: t(group.label, locale) })),
    };
}

function localizeOption(option, locale) {
    const result = { ...option, label: t(option.label, locale) };
    if (option.unavailableReason) result.unavailableReason = t(option.unavailableReason, locale);
    return result;
}

function buildCatalog(locale) {
    const content = {
        locale,
        locales: SUPPORTED_LOCALES,
        species: SPECIES.map((species) => ({
            ...localizeOption(species, locale),
            genotypes: species.genotypes.map((g) => localizeOption(g, locale)),
            sexes: species.sexes.map((s) => localizeOption(s, locale)),
        })),
        forms: {
            requirements: buildForm(requirementFields, requirementRules, locale),
            ndt: buildForm(ndtFields, ndtRules, locale, ndtOptionalGroups),
            dietAnimal: buildForm(dietAnimalFields, requirementRules, locale),
            dietIngredient: buildForm(ingredientFields, dietRules, locale),
            dietLot: buildForm(dietLotFields, [], locale),
            customFood: buildForm({ ...customFoodFields, ...foodSafetyFields }, [], locale, customFoodOptionalGroups),
        },
        diet: {
            ...DIET_RULES,
            categories: DIET_RULES.categories.map((c) => ({ code: c.code, label: t(c.label, locale), pluralLabel: t(c.pluralLabel, locale) })),
            targetSpecies: TARGET_SPECIES.map((s) => ({ code: s.code, label: t(s.label, locale) })),
            priceBases: DIET_RULES.priceBases.map((b) => ({ ...b, label: t(b.label, locale) })),
        },
    };
    const version = crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex').slice(0, 12);
    return { version, ...content };
}

const cache = new Map();

/**
 * Catálogo completo no idioma pedido (estático: calculado uma vez por idioma).
 * A `version` é um hash do conteúdo, então muda sozinha quando algo muda.
 */
function getCatalog(locale = 'pt-BR') {
    if (!cache.has(locale)) cache.set(locale, buildCatalog(locale));
    return cache.get(locale);
}

module.exports = { getCatalog };
