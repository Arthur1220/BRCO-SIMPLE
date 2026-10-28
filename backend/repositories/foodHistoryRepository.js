const { randomUUID } = require('crypto');
const { PutCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { db, TABLES, readAll } = require('../lib/dynamo');

/**
 * Histórico de alterações do cadastro de alimentos (quem mudou o quê e quando).
 * Chave: foodId (N) + sk (S, "<ISO>#<uuid>"), em ordem cronológica por alimento.
 */

// Campos que não interessam no histórico (gerados pelo sistema).
const IGNORED_FIELDS = new Set(['id', 'createdAt', 'updatedAt']);

const normalize = (value) => (value === undefined || value === '' ? null : value);

/**
 * Diferença campo a campo entre duas versões do alimento.
 */
function diffFood(before = {}, after = {}) {
    const fields = new Set([...Object.keys(before), ...Object.keys(after)]);
    return [...fields]
        .filter((field) => !IGNORED_FIELDS.has(field))
        .map((field) => ({ field, before: normalize(before[field]), after: normalize(after[field]) }))
        .filter((change) => change.before !== change.after)
        .sort((a, b) => a.field.localeCompare(b.field));
}

/**
 * Registra uma alteração. action: create | update | delete.
 * Atualizações sem mudança efetiva não são registradas.
 */
async function recordFoodChange({ foodId, foodName, action, actor, before, after, at = new Date() }) {
    const changes = diffFood(before, after);
    if (action === 'update' && changes.length === 0) return null;
    const iso = at.toISOString();
    const item = { foodId, sk: `${iso}#${randomUUID()}`, at: iso, action, actor: actor || null, foodName, changes };
    await db.send(new PutCommand({ TableName: TABLES.foodHistory, Item: item }));
    return item;
}

/**
 * Alterações de um alimento, da mais recente para a mais antiga.
 */
async function listFoodHistory(foodId, limit = 100) {
    const res = await db.send(new QueryCommand({
        TableName: TABLES.foodHistory,
        KeyConditionExpression: 'foodId = :id',
        ExpressionAttributeValues: { ':id': foodId },
        ScanIndexForward: false,
        Limit: limit,
    }));
    return res.Items || [];
}

/**
 * Últimas alterações de todos os alimentos (o histórico é pequeno: um Scan basta).
 */
async function listRecentHistory(limit = 50) {
    const items = await readAll(ScanCommand, { TableName: TABLES.foodHistory });
    return items.sort((a, b) => b.sk.localeCompare(a.sk)).slice(0, limit);
}

module.exports = { diffFood, recordFoodChange, listFoodHistory, listRecentHistory };
