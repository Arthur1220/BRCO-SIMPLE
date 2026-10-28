const logger = require('./logger');

/**
 * Em produção, a aplicação não sobe sem os segredos obrigatórios (fail closed).
 * Usado pelo servidor local (index.js) e pela Lambda (lambda.js).
 */
function validateEnv() {
    const missing = ['PANEL_PASSWORD', 'ADMIN_JWT_SECRET']
        .filter((name) => !process.env[name]);

    if (process.env.NODE_ENV === 'production') {
        for (const name of ['NETLIFY_PROXY_SECRET', 'FOODS_TABLE', 'CALCULATIONS_TABLE', 'USAGE_LOGS_TABLE', 'FOOD_HISTORY_TABLE']) {
            if (!process.env[name]) missing.push(name);
        }
    }

    if (missing.length > 0) {
        throw new Error(`Variáveis de ambiente obrigatórias ausentes: ${missing.join(', ')}`);
    }

    if (process.env.ADMIN_JWT_SECRET.length < 32) {
        throw new Error('ADMIN_JWT_SECRET deve ter pelo menos 32 caracteres.');
    }
}

/**
 * Valida o ambiente e encerra o processo em caso de erro (servidor local).
 */
function validateEnvOrExit() {
    try {
        validateEnv();
    } catch (error) {
        logger.error(error.message);
        process.exit(1);
    }
}

module.exports = { validateEnv, validateEnvOrExit };
