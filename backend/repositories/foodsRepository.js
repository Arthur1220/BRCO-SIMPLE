const { ScanCommand, BatchGetCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { ConditionalCheckFailedException } = require('@aws-sdk/client-dynamodb');
const { db, TABLES, readAll } = require('../lib/dynamo');

// Item reservado que guarda o último id usado (os ids continuam inteiros, como no SQLite).
const COUNTER_ID = 0;

class FoodNotFoundError extends Error {
    constructor() {
        super('Alimento não encontrado.');
        this.name = 'FoodNotFoundError';
    }
}

/**
 * Item do DynamoDB -> alimento (datas como Date, como o Prisma devolvia).
 */
function toFood(item) {
    return { ...item, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) };
}

/**
 * Todos os alimentos, ordenados por nome.
 * A tabela é pequena (dezenas de itens): um Scan é mais simples e barato que um índice.
 */
async function listFoods() {
    const items = await readAll(ScanCommand, { TableName: TABLES.foods });
    return items
        .filter((item) => item.id !== COUNTER_ID)
        .map(toFood)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

/**
 * Alimentos com os ids informados (ids inexistentes são ignorados).
 */
async function findFoodsByIds(ids) {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return [];

    const foods = [];
    // BatchGet aceita até 100 chaves por chamada.
    for (let i = 0; i < unique.length; i += 100) {
        let keys = unique.slice(i, i + 100).map((id) => ({ id }));
        while (keys && keys.length > 0) {
            const res = await db.send(new BatchGetCommand({ RequestItems: { [TABLES.foods]: { Keys: keys } } }));
            foods.push(...(res.Responses?.[TABLES.foods] || []));
            keys = res.UnprocessedKeys?.[TABLES.foods]?.Keys;
        }
    }
    return foods.map(toFood);
}

/**
 * Próximo id (contador atômico no item id=0).
 */
async function nextFoodId() {
    const res = await db.send(new UpdateCommand({
        TableName: TABLES.foods,
        Key: { id: COUNTER_ID },
        UpdateExpression: 'ADD lastId :one',
        ExpressionAttributeValues: { ':one': 1 },
        ReturnValues: 'UPDATED_NEW',
    }));
    return res.Attributes.lastId;
}

/**
 * Garante que o contador seja pelo menos `id` (usado ao importar alimentos com id fixo).
 */
async function bumpFoodCounter(id) {
    try {
        await db.send(new UpdateCommand({
            TableName: TABLES.foods,
            Key: { id: COUNTER_ID },
            UpdateExpression: 'SET lastId = :id',
            ConditionExpression: 'attribute_not_exists(lastId) OR lastId < :id',
            ExpressionAttributeValues: { ':id': id },
        }));
    } catch (error) {
        if (!(error instanceof ConditionalCheckFailedException)) throw error;
    }
}

/**
 * Cria um alimento. `id`, `createdAt` e `updatedAt` só são aceitos na importação.
 */
async function createFood(data, { id, createdAt, updatedAt } = {}) {
    const now = new Date().toISOString();
    const item = {
        defaultMin: 0,
        defaultMax: 100,
        ...data,
        id: id ?? await nextFoodId(),
        createdAt: createdAt ?? now,
        updatedAt: updatedAt ?? now,
    };
    if (id !== undefined) await bumpFoodCounter(id);

    await db.send(new PutCommand({
        TableName: TABLES.foods,
        Item: item,
        ConditionExpression: 'attribute_not_exists(#id)',
        ExpressionAttributeNames: { '#id': 'id' },
    }));
    return toFood(item);
}

/**
 * Atualiza os campos informados. Lança FoodNotFoundError se o alimento não existe.
 */
async function updateFood(id, data) {
    const fields = { ...data, updatedAt: new Date().toISOString() };
    const names = {};
    const values = {};
    const sets = Object.entries(fields).map(([field, value], index) => {
        names[`#f${index}`] = field;
        values[`:v${index}`] = value;
        return `#f${index} = :v${index}`;
    });

    try {
        const res = await db.send(new UpdateCommand({
            TableName: TABLES.foods,
            Key: { id },
            UpdateExpression: `SET ${sets.join(', ')}`,
            ConditionExpression: 'attribute_exists(#id) AND #id <> :counter',
            ExpressionAttributeNames: { ...names, '#id': 'id' },
            ExpressionAttributeValues: { ...values, ':counter': COUNTER_ID },
            ReturnValues: 'ALL_NEW',
        }));
        return toFood(res.Attributes);
    } catch (error) {
        if (error instanceof ConditionalCheckFailedException) throw new FoodNotFoundError();
        throw error;
    }
}

/**
 * Remove um alimento. Lança FoodNotFoundError se o alimento não existe.
 */
async function deleteFood(id) {
    try {
        await db.send(new DeleteCommand({
            TableName: TABLES.foods,
            Key: { id },
            ConditionExpression: 'attribute_exists(#id) AND #id <> :counter',
            ExpressionAttributeNames: { '#id': 'id' },
            ExpressionAttributeValues: { ':counter': COUNTER_ID },
        }));
    } catch (error) {
        if (error instanceof ConditionalCheckFailedException) throw new FoodNotFoundError();
        throw error;
    }
}

module.exports = { FoodNotFoundError, listFoods, findFoodsByIds, createFood, updateFood, deleteFood };
