const { ZodError } = require('zod');
const logger = require('./logger');
const { L, t, resolveLocale } = require('./i18n');

// Mensagens padrão da v1 por código de erro.
const V1_MESSAGES = {
    VALIDATION: L('Dados de entrada inválidos.', 'Invalid input data.'),
    NOT_FOUND: L('Recurso não encontrado.', 'Resource not found.'),
    UNAUTHORIZED: L('Acesso não autorizado.', 'Unauthorized.'),
    FORBIDDEN: L('Acesso não autorizado.', 'Access denied.'),
    RATE_LIMITED: L('Muitas requisições. Tente novamente em alguns minutos.', 'Too many requests. Try again in a few minutes.'),
    INTERNAL: L('Ocorreu um erro inesperado no servidor.', 'An unexpected server error occurred.'),
};

// Toda a API (/api) usa o formato da v1; o formato antigo só sobra para rotas fora de /api.
const isV1 = (req) => req.originalUrl.startsWith('/api');

/**
 * Converte os issues do Zod no formato `fields` da v1.
 * Para regras entre campos, o `code` é o código da regra (ex.: final_gt_initial).
 */
function zodToFields(error) {
    return error.issues.map((issue) => ({
        path: issue.path.join('.'),
        code: issue.params?.rule || issue.code,
        message: issue.message,
    }));
}

/**
 * Envia um erro no formato da versão da rota: v1 usa o envelope padrão
 * `{ error: { code, message, fields? } }` no idioma da requisição; a v0 mantém
 * `{ error: message }` com a mensagem em português.
 * `v1Message` (texto ou L()) substitui a mensagem padrão do código na v1.
 */
function sendError(req, res, status, code, v0Message, fields, v1Message) {
    if (!isV1(req)) return res.status(status).json({ error: v0Message });
    const locale = req.locale || resolveLocale(req);
    const message = t(v1Message || V1_MESSAGES[code], locale);
    return res.status(status).json({ error: { code, message, ...(fields ? { fields } : {}) } });
}

/**
 * 404 da v1 (rota inexistente).
 */
function v1NotFound(req, res) {
    sendError(req, res, 404, 'NOT_FOUND', 'Recurso não encontrado.');
}

/**
 * Tratador de erros da v1 (montado no router da v1).
 */
// eslint-disable-next-line no-unused-vars
function v1ErrorHandler(err, req, res, next) {
    if (err instanceof ZodError) {
        return sendError(req, res, 400, 'VALIDATION', 'Dados de entrada inválidos.', zodToFields(err));
    }
    if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
        return sendError(req, res, err.status || 400, 'VALIDATION', 'Corpo da requisição inválido.');
    }

    logger.error({ message: err.message, stack: err.stack, path: req.path, method: req.method });
    return sendError(req, res, 500, 'INTERNAL', 'Ocorreu um erro inesperado no servidor.');
}

module.exports = { V1_MESSAGES, sendError, zodToFields, v1NotFound, v1ErrorHandler };
