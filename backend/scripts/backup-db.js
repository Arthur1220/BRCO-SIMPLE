/**
 * Gera um backup consistente do banco SQLite (VACUUM INTO) e mantém os mais recentes.
 * Uso: npm run backup   (no container: docker compose exec backend npm run backup)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const prisma = require('../lib/prisma');

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '..', 'data', 'backups');
const KEEP = Number(process.env.BACKUP_KEEP || 7);

async function main() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(BACKUP_DIR, `brco-${stamp}.db`);

  // VACUUM INTO gera uma cópia íntegra mesmo com o servidor em execução.
  await prisma.$executeRawUnsafe(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
  console.log(`Backup criado: ${target}`);

  const backups = fs.readdirSync(BACKUP_DIR)
    .filter((file) => /^brco-.*\.db$/.test(file))
    .sort()
    .reverse();
  for (const old of backups.slice(KEEP)) {
    fs.unlinkSync(path.join(BACKUP_DIR, old));
    console.log(`Backup antigo removido: ${old}`);
  }
}

main()
  .catch((error) => {
    console.error('Falha no backup:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
