// Carrega as variáveis de ambiente
require('dotenv').config();

const { createApp } = require('./app');
const logger = require('./lib/logger');
const { purgeExpiredCalculations } = require('./services/calculationService');

const PORT = process.env.PORT || 3000;

// =========================================================
// ==             VALIDAÇÃO DAS VARIÁVEIS                 ==
// =========================================================

/**
 * Em produção, o servidor não sobe sem os segredos obrigatórios (fail closed).
 */
function validateEnv() {
    const missing = ['PANEL_PASSWORD', 'ADMIN_JWT_SECRET', 'DATABASE_URL']
        .filter((name) => !process.env[name]);

    if (process.env.NODE_ENV === 'production' && !process.env.NETLIFY_PROXY_SECRET) {
        missing.push('NETLIFY_PROXY_SECRET');
    }

    if (missing.length > 0) {
        logger.error(`Variáveis de ambiente obrigatórias ausentes: ${missing.join(', ')}`);
        process.exit(1);
    }

    if (process.env.ADMIN_JWT_SECRET.length < 32) {
        logger.error('ADMIN_JWT_SECRET deve ter pelo menos 32 caracteres.');
        process.exit(1);
    }
}

// =========================================================
// ==                   INICIALIZAÇÃO                     ==
// =========================================================

validateEnv();

createApp().listen(PORT, () => {
    logger.info(`🚀 Servidor rodando na porta ${PORT}`);
    logger.info(`📝 Documentação disponível em http://localhost:${PORT}/api-docs/v1`);
});

// =========================================================
// ==        RETENÇÃO: apaga cálculos com mais de 6 meses  ==
// =========================================================

async function runPurge() {
    try {
        const removed = await purgeExpiredCalculations();
        if (removed > 0) logger.info(`Retenção: ${removed} cálculo(s) vencido(s) removido(s).`);
    } catch (error) {
        logger.error('Falha ao remover cálculos vencidos', { error: error.message });
    }
}

runPurge();
setInterval(runPurge, 24 * 60 * 60 * 1000).unref();
