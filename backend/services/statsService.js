const { listUsageLogsSince } = require('../repositories/usageLogsRepository');

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

/**
 * Total de cálculos e distribuição por tipo.
 */
async function getStats(period) {
  const logs = await listUsageLogsSince(getDateFilter(period));
  const countByType = new Map();
  for (const log of logs) countByType.set(log.calculationType, (countByType.get(log.calculationType) || 0) + 1);
  return {
    totalCalculations: logs.length,
    statsByType: Array.from(countByType, ([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
  };
}

/**
 * Últimos 100 registros de uso.
 */
async function getLogs(period) {
  const logs = await listUsageLogsSince(getDateFilter(period));
  return logs.reverse().slice(0, 100);
}

/**
 * Uso por dia (todos os dias do período, inclusive os sem uso).
 * Em 'all', começa no primeiro registro existente.
 */
async function getStatsOverTime(period = '30d') {
  let startDate = getDateFilter(period);
  const logs = await listUsageLogsSince(startDate);
  if (!startDate) {
    startDate = new Date(logs.length > 0 ? logs[0].createdAt : Date.now());
    startDate.setHours(0, 0, 0, 0);
  }

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
