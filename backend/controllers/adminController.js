const prisma = require('../lib/prisma');
const logger = require('../lib/logger');

/**
 * Auxiliar: Cria um objeto Date para filtrar logs baseado no período.
 * @param {string} period - '7d', '30d' ou undefined (all)
 * @returns {Date|undefined} - Data de início do filtro ou undefined.
 */
const getDateFilter = (period) => {
  const now = new Date();
  now.setHours(23, 59, 59, 999); 

  if (period === '7d') {
    const date = new Date(now);
    date.setDate(date.getDate() - 7);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  if (period === '30d') {
    const date = new Date(now);
    date.setDate(date.getDate() - 30);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  return undefined;
};

/**
 * Realiza o login do admin verificando a senha.
 */
async function login(req, res) {
  const { password } = req.body;
  
  if (password && password === process.env.PANEL_PASSWORD) {
    res.json({ success: true, message: 'Login bem-sucedido.' });
  } else {
    res.status(401).json({ success: false, message: 'Senha incorreta.' });
  }
}

/**
 * Retorna estatísticas gerais de uso (total e por tipo).
 */
async function getStats(req, res) {
  try {
    const { period } = req.query;
    const startDate = getDateFilter(period);
    const whereClause = startDate ? { createdAt: { gte: startDate } } : {};

    const totalCalculations = await prisma.calculationLog.count({ where: whereClause });
    
    const rawCountByType = await prisma.calculationLog.groupBy({
      by: ['calculationType'],
      where: whereClause,
      _count: { calculationType: true },
      orderBy: { _count: { calculationType: 'desc' } },
    });

    const statsByType = rawCountByType.map(item => ({
      type: item.calculationType,
      count: item._count.calculationType,
    }));

    res.json({ totalCalculations, statsByType });
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
    const { period } = req.query;
    const startDate = getDateFilter(period);
    const whereClause = startDate ? { createdAt: { gte: startDate } } : {};

    const logs = await prisma.calculationLog.findMany({
      take: 100,
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
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
    const { period } = req.query;
    const startDate = getDateFilter(period || '30d'); 
    
    const logs = await prisma.calculationLog.findMany({
      where: { createdAt: { gte: startDate } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true } 
    });

    const countsByDay = new Map();
    let day = new Date(startDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    while (day <= today) {
      countsByDay.set(day.toISOString().split('T')[0], 0);
      day.setDate(day.getDate() + 1);
    }

    for (const log of logs) {
      const dateString = log.createdAt.toISOString().split('T')[0];
      if (countsByDay.has(dateString)) {
        countsByDay.set(dateString, countsByDay.get(dateString) + 1);
      }
    }

    const chartData = Array.from(countsByDay, ([date, count]) => ({
      date,
      count
    }));

    res.json(chartData);

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