const { PrismaClient } = require('@prisma/client');

/**
 * Instância única do PrismaClient para evitar múltiplas conexões
 * durante o desenvolvimento (hot-reload).
 */
const prisma = new PrismaClient();

module.exports = prisma;