/**
 * Importa o banco SQLite antigo (Prisma) para as tabelas do DynamoDB.
 * Idempotente: pode rodar de novo sem duplicar (alimentos existentes são mantidos;
 * logs e cálculos são regravados com a mesma chave).
 *
 * Uso:
 *   npm run migrate:sqlite -- caminho/para/dev.db            (importa)
 *   npm run migrate:sqlite -- caminho/para/dev.db --dry-run  (só conta)
 *
 * As tabelas de destino vêm de FOODS_TABLE, CALCULATIONS_TABLE e USAGE_LOGS_TABLE
 * (ver os Outputs da stack) e a região de AWS_REGION/AWS_PROFILE.
 */
require('dotenv').config();
const { DatabaseSync } = require('node:sqlite');
const { ConditionalCheckFailedException } = require('@aws-sdk/client-dynamodb');
const { TABLES } = require('../lib/dynamo');
const { createFood } = require('../repositories/foodsRepository');
const { saveCalculation } = require('../repositories/calculationsRepository');
const { createUsageLog } = require('../repositories/usageLogsRepository');

/**
 * O Prisma grava DateTime no SQLite como milissegundos (número) ou texto ISO, conforme a versão.
 */
function toDate(value) {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'number' || typeof value === 'bigint' || /^\d+$/.test(value)) return new Date(Number(value));
    const date = new Date(value.includes('T') || value.endsWith('Z') ? value : `${value.replace(' ', 'T')}Z`);
    if (Number.isNaN(date.getTime())) throw new Error(`Data inválida no SQLite: ${value}`);
    return date;
}

const hasTable = (sqlite, name) =>
    Boolean(sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(name));

/**
 * Executa `task` em todos os itens, com no máximo `limit` em paralelo.
 */
async function eachLimit(items, limit, task) {
    let index = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (index < items.length) await task(items[index++]);
    });
    await Promise.all(workers);
}

async function main() {
    const [file, flag] = process.argv.slice(2);
    if (!file) throw new Error('Informe o caminho do arquivo SQLite. Ex.: npm run migrate:sqlite -- ./brco.db');
    const dryRun = flag === '--dry-run';

    const sqlite = new DatabaseSync(file, { readOnly: true });
    const foods = sqlite.prepare('SELECT * FROM foods ORDER BY id').all();
    const logs = sqlite.prepare('SELECT * FROM calculation_logs').all();
    const calculations = hasTable(sqlite, 'calculations')
        ? sqlite.prepare('SELECT * FROM calculations').all().filter((row) => toDate(row.expiresAt) > new Date())
        : [];

    console.log(`SQLite: ${foods.length} alimentos, ${logs.length} registros de uso, ${calculations.length} cálculos válidos.`);
    console.log(`Destino: ${TABLES.foods}, ${TABLES.usageLogs}, ${TABLES.calculations}${process.env.DYNAMODB_ENDPOINT ? ` (${process.env.DYNAMODB_ENDPOINT})` : ''}`);
    if (dryRun) return;

    let foodsCreated = 0;
    for (const { id, createdAt, updatedAt, ...data } of foods) {
        try {
            await createFood(data, { id: Number(id), createdAt: toDate(createdAt).toISOString(), updatedAt: toDate(updatedAt).toISOString() });
            foodsCreated++;
        } catch (error) {
            if (!(error instanceof ConditionalCheckFailedException)) throw error;
            console.log(`Alimento ${id} (${data.name}) já existe no DynamoDB: mantido.`);
        }
    }

    await eachLimit(logs, 10, (log) => createUsageLog({
        id: log.id,
        createdAt: toDate(log.createdAt),
        calculationType: log.calculationType,
        userAgent: log.userAgent ?? undefined,
        country: log.country ?? undefined,
        region: log.region ?? undefined,
    }));

    await eachLimit(calculations, 10, (row) => saveCalculation({
        id: row.id,
        type: row.type,
        engineVersion: row.engineVersion,
        input: JSON.parse(row.input),
        output: JSON.parse(row.output),
        createdAt: toDate(row.createdAt),
        expiresAt: toDate(row.expiresAt),
    }));

    console.log(`Importados: ${foodsCreated} alimentos novos, ${logs.length} registros de uso, ${calculations.length} cálculos.`);
}

main().catch((error) => {
    console.error('Falha na migração:', error);
    process.exitCode = 1;
});
