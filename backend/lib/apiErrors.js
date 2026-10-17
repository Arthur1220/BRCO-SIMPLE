const { ZodError } = require('zod');
const logger = require('./logger');

const isV1 = (req) => req.originalUrl.startsWith('/api/v1');

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
 * `{ error: { code, message, fields? } }`; a v0 mantém `{ error: message }`.
 */
function sendError(req, res, status, code, message, fields) {
    if (!isV1(req)) return res.status(status).json({ error: message });
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

module.exports = { sendError, zodToFields, v1NotFound, v1ErrorHandler };
