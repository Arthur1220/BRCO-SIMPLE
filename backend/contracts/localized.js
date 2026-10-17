const { L, t, SUPPORTED_LOCALES } = require('../lib/i18n');

/**
 * Cria um schema por idioma (as mensagens ficam embutidas no schema) e
 * guarda em cache. Uso: const getSchema = perLocale((locale) => z.object(...));
 */
function perLocale(factory) {
    const cache = new Map();
    return (locale) => {
        if (!cache.has(locale)) cache.set(locale, factory(locale));
        return cache.get(locale);
    };
}

const GENERIC = {
    required: L('Campo obrigatório.', 'Required field.'),
    invalidType: L('Tipo de valor inválido.', 'Invalid value type.'),
    invalidOption: L('Opção inválida. Valores aceitos: {options}.', 'Invalid option. Accepted values: {options}.'),
    tooSmall: L('Valor abaixo do mínimo permitido.', 'Value below the allowed minimum.'),
    tooBig: L('Valor acima do máximo permitido.', 'Value above the allowed maximum.'),
    invalid: L('Valor inválido.', 'Invalid value.'),
};

/**
 * Mensagens genéricas do Zod no idioma pedido, para os casos em que o schema
 * não define uma mensagem específica.
 */
function errorMapFor(locale) {
    return (issue, ctx) => {
        switch (issue.code) {
            case 'invalid_type':
                return { message: t(issue.received === 'undefined' ? GENERIC.required : GENERIC.invalidType, locale) };
            case 'invalid_enum_value':
            case 'invalid_union_discriminator':
                return { message: t(GENERIC.invalidOption, locale).replace('{options}', (issue.options || []).join(', ')) };
            case 'too_small':
                return { message: t(GENERIC.tooSmall, locale) };
            case 'too_big':
                return { message: t(GENERIC.tooBig, locale) };
            default:
                return { message: t(GENERIC.invalid, locale) || ctx.defaultError };
        }
    };
}

/**
 * Valida `data` com o schema do idioma, usando as mensagens genéricas traduzidas.
 * Lança ZodError (tratado pelo v1ErrorHandler).
 */
function parseLocalized(getSchema, data, locale) {
    return getSchema(locale).parse(data, { errorMap: errorMapFor(locale) });
}

module.exports = { perLocale, errorMapFor, parseLocalized, SUPPORTED_LOCALES };
