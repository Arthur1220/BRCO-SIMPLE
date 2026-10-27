require('./helpers/env');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { DatabaseSync } = require('node:sqlite');
const { setupTestTables } = require('./helpers/server');
const { listFoods, createFood } = require('../repositories/foodsRepository');
const { listUsageLogsSince } = require('../repositories/usageLogsRepository');
const { findValidCalculation } = require('../repositories/calculationsRepository');

const DAY_MS = 86400000;
const food = { MS: 880, MO: 930, EE: 30, PB: 92.3, PDR: 50, PNDR: 40, NDT: 844.2, FDNcp: 91.7, CNF: 300, Ca: 0.4, P: 2.9 };

/**
 * Cria um SQLite com o mesmo schema que as migrations do Prisma geravam
 * (DateTime gravado em milissegundos, como o Prisma faz no SQLite).
 */
function createLegacyDb() {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'brco-sqlite-')), 'dev.db');
  const sqlite = new DatabaseSync(file);
  sqlite.exec(`
    CREATE TABLE foods (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT NOT NULL,
      defaultMin REAL DEFAULT 0, defaultMax REAL DEFAULT 100, MS REAL NOT NULL, MO REAL NOT NULL, EE REAL NOT NULL,
      PB REAL NOT NULL, PDR REAL NOT NULL, PNDR REAL NOT NULL, NDT REAL NOT NULL, FDNcp REAL NOT NULL, CNF REAL NOT NULL,
      Ca REAL NOT NULL, P REAL NOT NULL, createdAt DATETIME NOT NULL, updatedAt DATETIME NOT NULL);
    CREATE TABLE calculation_logs (id TEXT PRIMARY KEY, calculationType TEXT NOT NULL, createdAt DATETIME NOT NULL,
      userAgent TEXT, country TEXT, region TEXT);
    CREATE TABLE calculations (id TEXT PRIMARY KEY, type TEXT NOT NULL, engineVersion TEXT NOT NULL, input TEXT NOT NULL,
      output TEXT NOT NULL, createdAt DATETIME NOT NULL, expiresAt DATETIME NOT NULL);
  `);

  const now = Date.now();
  const insertFood = sqlite.prepare(`INSERT INTO foods (id, name, category, defaultMin, defaultMax, MS, MO, EE, PB, PDR, PNDR, NDT, FDNcp, CNF, Ca, P, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const values = (f) => [f.MS, f.MO, f.EE, f.PB, f.PDR, f.PNDR, f.NDT, f.FDNcp, f.CNF, f.Ca, f.P];
  insertFood.run(3, 'Milho fubá', 'CONCENTRADO', 0, 100, ...values(food), now - 30 * DAY_MS, now - DAY_MS);
  insertFood.run(7, 'Ureia', 'SUPLEMENTO', 0, 1, ...values(food), now - 30 * DAY_MS, now - 30 * DAY_MS);

  const insertLog = sqlite.prepare('INSERT INTO calculation_logs VALUES (?, ?, ?, ?, ?, ?)');
  insertLog.run('log-1', 'diet_calculation', now - 40 * DAY_MS, 'Mozilla', 'BR', 'MG');
  insertLog.run('log-2', 'ndt_calculation', now - DAY_MS, null, 'Unknown', 'Unknown');

  const insertCalc = sqlite.prepare('INSERT INTO calculations VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertCalc.run('calc-valido', 'ndt', '1', '{"PB":1}', '{"NDT":2}', now - DAY_MS, now + 100 * DAY_MS);
  insertCalc.run('calc-vencido', 'ndt', '1', '{"PB":1}', '{"NDT":2}', now - 200 * DAY_MS, now - DAY_MS);
  sqlite.close();
  return file;
}

const runMigration = (file) => execFileSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'migrate-sqlite-to-dynamo.js'), file], {
  env: process.env,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});

test.before(async () => {
  await setupTestTables();
});

test('migração SQLite → DynamoDB: alimentos, uso e cálculos válidos, de forma idempotente', async () => {
  const file = createLegacyDb();
  runMigration(file);
  runMigration(file); // rodar de novo não duplica nada

  const foods = await listFoods();
  assert.deepEqual(foods.map((f) => [f.id, f.name]), [[3, 'Milho fubá'], [7, 'Ureia']]);
  assert.equal(foods[1].defaultMax, 1);
  assert.ok(foods[0].updatedAt > foods[0].createdAt);

  // Novos alimentos continuam a numeração depois do maior id importado
  assert.equal((await createFood({ name: 'Novo', category: 'VOLUMOSO', ...food })).id, 8);

  const logs = await listUsageLogsSince();
  assert.deepEqual(logs.map((log) => log.id), ['log-1', 'log-2']);
  assert.equal(logs[0].region, 'MG');
  assert.equal(logs[1].userAgent, null);
  assert.ok(Math.abs(logs[0].createdAt - (Date.now() - 40 * DAY_MS)) < 60000);

  assert.deepEqual((await findValidCalculation('calc-valido')).output, { NDT: 2 });
  assert.equal(await findValidCalculation('calc-vencido'), null);
});
