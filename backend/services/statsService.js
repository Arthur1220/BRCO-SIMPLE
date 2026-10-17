const prisma = require('../lib/prisma');

/**
 * Data de início do filtro de período ('7d', '30d' ou 'all'/indefinido = sem filtro).
 */
function getDateFilter(period) {
  const days = { '7d': 7, '30d': 30 }[period];
  if (!days) return undefined;
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

const whereFor = (period) => {
  const startDate = getDateFilter(period);
  return startDate ? { createdAt: { gte: startDate } } : {};
};

/**
 * Total de cálculos e distribuição por tipo.
 */
async function getStats(period) {
  const where = whereFor(period);
  const totalCalculations = await prisma.calculationLog.count({ where });
  const rawCountByType = await prisma.calculationLog.groupBy({
    by: ['calculationType'],
    where,
    _count: { calculationType: true },
    orderBy: { _count: { calculationType: 'desc' } },
  });
  return {
    totalCalculations,
    statsByType: rawCountByType.map((item) => ({ type: item.calculationType, count: item._count.calculationType })),
  };
}

/**
 * Últimos 100 registros de uso.
 */
async function getLogs(period) {
  return prisma.calculationLog.findMany({ take: 100, where: whereFor(period), orderBy: { createdAt: 'desc' } });
}

/**
 * Uso por dia (todos os dias do período, inclusive os sem uso).
 * Em 'all', começa no primeiro registro existente.
 */
async function getStatsOverTime(period = '30d') {
  let startDate = getDateFilter(period);
  if (!startDate) {
    const first = await prisma.calculationLog.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } });
    startDate = new Date(first ? first.createdAt : Date.now());
    startDate.setHours(0, 0, 0, 0);
  }

  const logs = await prisma.calculationLog.findMany({
    where: { createdAt: { gte: startDate } },
    select: { createdAt: true },
  });

  const countsByDay = new Map();
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  for (const day = new Date(startDate); day <= today; day.setDate(day.getDate() + 1)) {
    countsByDay.set(day.toISOString().split('T')[0], 0);
  }

  for (const log of logs) {
    const dateString = log.createdAt.toISOString().split('T')[0];
    if (countsByDay.has(dateString)) countsByDay.set(dateString, countsByDay.get(dateString) + 1);
  }

  return Array.from(countsByDay, ([date, count]) => ({ date, count }));
}

module.exports = { getDateFilter, getStats, getLogs, getStatsOverTime };
