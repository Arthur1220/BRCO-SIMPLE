const statsService = require('../services/statsService');
const logger = require('../lib/logger');
const { safeEqual, issueAdminToken } = require('../middleware/authMiddleware');

/**
 * Realiza o login do admin verificando a senha e devolve um token de sessão.
 */
async function login(req, res) {
  const { password } = req.body || {};

  if (process.env.PANEL_PASSWORD && safeEqual(password, process.env.PANEL_PASSWORD)) {
    res.json({ success: true, message: 'Login bem-sucedido.', token: issueAdminToken() });
  } else {
    logger.warn('Tentativa de login no painel com senha incorreta.');
    res.status(401).json({ success: false, message: 'Senha incorreta.' });
  }
}

/**
 * Retorna estatísticas gerais de uso (total e por tipo).
 */
async function getStats(req, res) {
  try {
    res.json(await statsService.getStats(req.query.period));
  } catch (error) {
    logger.error("Error fetching admin stats:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas." });
  }
}

/**
 * Retorna a lista de logs recentes.
 */
async function getLogs(req, res) {
  try {
    res.json(await statsService.getLogs(req.query.period));
  } catch (error) {
    logger.error("Error fetching admin logs:", error);
    res.status(500).json({ error: "Erro ao buscar logs." });
  }
}

/**
 * Retorna dados para o gráfico de uso ao longo do tempo.
 */
async function getStatsOverTime(req, res) {
  try {
    res.json(await statsService.getStatsOverTime(req.query.period));
  } catch (error) {
    logger.error("Error fetching over-time stats:", error);
    res.status(500).json({ error: "Erro ao buscar dados para o gráfico." });
  }
}

module.exports = { 
  login,
  getStats,
  getLogs,
  getStatsOverTime
};