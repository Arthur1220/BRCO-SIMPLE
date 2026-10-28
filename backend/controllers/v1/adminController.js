const { z } = require('zod');
const logger = require('../../lib/logger');
const { L, t } = require('../../lib/i18n');
const { errorMapFor } = require('../../contracts/localized');
const { sendError } = require('../../lib/apiErrors');
const { safeEqual, issueAdminToken } = require('../../middleware/authMiddleware');
const statsService = require('../../services/statsService');

const periodSchema = z.enum(['7d', '30d', 'all']).default('all');
const parsePeriod = (req) => periodSchema.parse(req.query.period, { errorMap: errorMapFor(req.locale) });

const WRONG_PASSWORD = L('Senha incorreta.', 'Incorrect password.');

// Labels dos tipos registrados em calculation_logs.
const USAGE_TYPE_LABELS = {
    requirement_especie_1: L('Exigências · Caprino', 'Requirements · Goat'),
    requirement_especie_2: L('Exigências · Ovino', 'Requirements · Sheep'),
    ndt_calculation: L('NDT de alimento', 'Feed TDN'),
    diet_calculation: L('Formulação de dieta', 'Diet formulation'),
};
const usageLabel = (type, locale) => (USAGE_TYPE_LABELS[type] ? t(USAGE_TYPE_LABELS[type], locale) : type);

/**
 * POST /api/v1/admin/login
 */
async function login(req, res) {
    const { password, name } = req.body || {};
    if (process.env.PANEL_PASSWORD && safeEqual(password, process.env.PANEL_PASSWORD)) {
        // Nome de quem entrou: identifica as alterações no histórico do cadastro.
        const editor = typeof name === 'string' && name.trim() ? name.trim().slice(0, 60) : null;
        return res.json({ token: issueAdminToken(editor), expiresIn: 2 * 60 * 60, name: editor });
    }
    logger.warn('Tentativa de login no painel com senha incorreta.');
    return sendError(req, res, 401, 'UNAUTHORIZED', 'Senha incorreta.', undefined, WRONG_PASSWORD);
}

/**
 * GET /api/v1/admin/stats?period=7d|30d|all
 */
async function getStats(req, res) {
    const stats = await statsService.getStats(parsePeriod(req));
    res.json({
        totalCalculations: stats.totalCalculations,
        statsByType: stats.statsByType.map((item) => ({ ...item, label: usageLabel(item.type, req.locale) })),
    });
}

/**
 * GET /api/v1/admin/logs?period=7d|30d|all
 */
async function getLogs(req, res) {
    const logs = await statsService.getLogs(parsePeriod(req));
    res.json(logs.map((log) => ({
        id: log.id,
        type: log.calculationType,
        label: usageLabel(log.calculationType, req.locale),
        createdAt: log.createdAt.toISOString(),
        country: log.country,
        region: log.region,
        userAgent: log.userAgent,
    })));
}

/**
 * GET /api/v1/admin/stats/over-time?period=7d|30d|all
 */
async function getStatsOverTime(req, res) {
    res.json(await statsService.getStatsOverTime(parsePeriod(req)));
}

module.exports = { login, getStats, getLogs, getStatsOverTime };
