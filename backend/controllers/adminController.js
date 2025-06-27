// backend/controllers/adminController.js
const prisma = require('../lib/prisma');
const logger = require('../lib/logger');

async function login(req, res) {
  const { password } = req.body;
  
  if (password && password === process.env.PANEL_PASSWORD) {
    // Se a senha bate com a do .env, retorna sucesso.
    res.json({ success: true, message: 'Login bem-sucedido.' });
  } else {
    // Senão, retorna um erro de não autorizado.
    res.status(401).json({ success: false, message: 'Senha incorreta.' });
  }
}

const getDateFilter = (period) => {
  const now = new Date();
  if (period === '7d') {
    return new Date(now.setDate(now.getDate() - 7));
  }
  if (period === '30d') {
    return new Date(now.setDate(now.getDate() - 30));
  }
  // Para outros casos como 'all', não retorna nada, resultando em nenhum filtro de data.
  return undefined;
};

async function getStats(req, res) {
  try {
    // Pega o período da query string (ex: /stats?period=7d)
    const { period } = req.query;
    const startDate = getDateFilter(period);

    // Cria a cláusula 'where' para o Prisma. Se startDate não existir, o objeto fica vazio.
    const whereClause = startDate ? { createdAt: { gte: startDate } } : {};

    const totalCalculations = await prisma.calculationLog.count({ where: whereClause });
    
    const countByType = await prisma.calculationLog.groupBy({
      by: ['calculationType'],
      where: whereClause, // Aplica o mesmo filtro aqui
      _count: { calculationType: true, },
      orderBy: { _count: { calculationType: 'desc' } },
    });

    const statsByType = countByType.map(item => ({
      type: item.calculationType,
      count: item._count.calculationType,
    }));

    res.json({ totalCalculations, statsByType });

  } catch (error) {
    logger.error("Error fetching admin stats:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas." });
  }
}

async function getLogs(req, res) {
  try {
    const { period } = req.query;
    const startDate = getDateFilter(period);
    const whereClause = startDate ? { createdAt: { gte: startDate } } : {};

    const logs = await prisma.calculationLog.findMany({
      take: 100, // Continua pegando no máximo 100, mas agora filtrados pelo período
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    logger.error("Error fetching admin logs:", error);
    res.status(500).json({ error: "Erro ao buscar logs." });
  }
}

module.exports = { 
  login,
  getStats,
  getLogs 
};