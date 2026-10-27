/**
 * Internacionalização da API v1.
 * Idiomas suportados: pt-BR (padrão) e en.
 * Escolha: ?lang=xx tem prioridade; depois o header Accept-Language.
 */
const SUPPORTED_LOCALES = ['pt-BR', 'en'];
const DEFAULT_LOCALE = 'pt-BR';

/**
 * Texto traduzido: L('texto em português', 'text in English').
 */
function L(ptBR, en) {
    return { 'pt-BR': ptBR, en };
}

/**
 * Normaliza um código de idioma ('pt', 'pt-br', 'en-US'...) para um suportado.
 */
function normalizeLocale(value) {
    if (typeof value !== 'string') return undefined;
    const lower = value.trim().toLowerCase();
    if (lower.startsWith('pt')) return 'pt-BR';
    if (lower.startsWith('en')) return 'en';
    return undefined;
}

/**
 * Idioma da requisição.
 */
function resolveLocale(req) {
    const fromQuery = normalizeLocale(req.query?.lang);
    if (fromQuery) return fromQuery;

    const accepted = req.acceptsLanguages ? req.acceptsLanguages('pt-BR', 'pt', 'en') : false;
    return normalizeLocale(accepted || undefined) || DEFAULT_LOCALE;
}

/**
 * Resolve um texto: aceita string simples ou objeto criado com L().
 */
function t(text, locale) {
    if (text === null || text === undefined || typeof text === 'string') return text;
    return text[locale] ?? text[DEFAULT_LOCALE];
}

/**
 * Middleware da v1: define req.locale e os headers de idioma da resposta.
 */
function localeMiddleware(req, res, next) {
    req.locale = resolveLocale(req);
    res.set('Content-Language', req.locale);
    res.vary('Accept-Language');
    next();
}

module.exports = { SUPPORTED_LOCALES, DEFAULT_LOCALE, L, t, normalizeLocale, resolveLocale, localeMiddleware };
