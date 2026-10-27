const crypto = require('crypto');
const { PutCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { db, TABLES, readAll } = require('../lib/dynamo');

const DAY_MS = 24 * 60 * 60 * 1000;

// Dia (UTC) usado como chave de partição: AAAA-MM-DD.
const dayOf = (date) => date.toISOString().slice(0, 10);

function toLog(item) {
    return {
        id: item.id,
        calculationType: item.calculationType,
        createdAt: new Date(item.createdAt),
        userAgent: item.userAgent ?? null,
        country: item.country ?? null,
        region: item.region ?? null,
    };
}

/**
 * Registra um uso. `id` e `createdAt` só são informados na importação do SQLite.
 */
async function createUsageLog({ id = crypto.randomUUID(), createdAt = new Date(), calculationType, userAgent, country, region }) {
    const iso = createdAt.toISOString();
    await db.send(new PutCommand({
        TableName: TABLES.usageLogs,
        Item: { day: dayOf(createdAt), sk: `${iso}#${id}`, id, calculationType, createdAt: iso, userAgent, country, region },
    }));
}

/**
 * Registros a partir de `startDate` (todos, se indefinido), do mais antigo para o mais recente.
 * Com período: uma Query por dia (no máximo ~31). Sem período: Scan da tabela.
 */
async function listUsageLogsSince(startDate) {
    let items;
    if (startDate) {
        const days = [];
        for (let time = Date.parse(dayOf(startDate)); time <= Date.now(); time += DAY_MS) {
            days.push(dayOf(new Date(time)));
        }
        const startKey = startDate.toISOString();
        const pages = await Promise.all(days.map((day) => readAll(QueryCommand, {
            TableName: TABLES.usageLogs,
            KeyConditionExpression: '#day = :day AND sk >= :start',
            ExpressionAttributeNames: { '#day': 'day' },
            ExpressionAttributeValues: { ':day': day, ':start': startKey },
        })));
        items = pages.flat();
    } else {
        items = await readAll(ScanCommand, { TableName: TABLES.usageLogs });
    }
    return items.map(toLog).sort((a, b) => a.createdAt - b.createdAt);
}

module.exports = { createUsageLog, listUsageLogsSince };
