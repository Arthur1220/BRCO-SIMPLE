// backend/controllers/adminController.js
const prisma = require('../lib/prisma');
const logger = require('../lib/logger');

// --- FUNÇÃO AUXILIAR DE DATA ---
const getDateFilter = (period) => {
  const now = new Date();
  now.setHours(23, 59, 59, 999); 

  if (period === '7d') {
    const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
    sevenDaysAgo.setHours(0, 0, 0, 0);
    return sevenDaysAgo;
  }
  if (period === '30d') {
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    return thirtyDaysAgo;
  }
  return undefined;
};

// --- FUNÇÃO DE LOGIN ---
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

// --- FUNÇÃO DE ESTATÍSTICAS ---
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

// --- FUNÇÃO DE LOGS ---
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

// --- FUNÇÃO DE ESTATÍSTICAS AO LONGO DO TEMPO ---
async function getStatsOverTime(req, res) {
  try {
    const { period } = req.query;
    // Define 30 dias como padrão se nenhum período for fornecido
    const startDate = getDateFilter(period || '30d'); 
    
    // 1. Busca os logs dentro do período
    const logs = await prisma.calculationLog.findMany({
      where: { createdAt: { gte: startDate } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true } // Só precisamos da data
    });

    // 2. Inicializa um "mapa" com todos os dias no período, zerados.
    // Isso é crucial para preencher os dias sem cálculos.
    const countsByDay = new Map();
    let day = new Date(startDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    while (day <= today) {
      countsByDay.set(day.toISOString().split('T')[0], 0);
      day.setDate(day.getDate() + 1);
    }

    // 3. Preenche o mapa com as contagens reais dos logs
    for (const log of logs) {
      const dateString = log.createdAt.toISOString().split('T')[0];
      if (countsByDay.has(dateString)) {
        countsByDay.set(dateString, countsByDay.get(dateString) + 1);
      }
    }

    // 4. Converte o mapa em um array que o frontend possa usar
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