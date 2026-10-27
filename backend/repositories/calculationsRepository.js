const crypto = require('crypto');
const { GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { db, TABLES } = require('../lib/dynamo');

/**
 * Item do DynamoDB -> registro de cálculo (entrada/saída em JSON, datas como Date).
 * Entrada e saída ficam como texto JSON: preserva exatamente o que o domínio devolveu.
 */
function toRecord(item) {
    return {
        id: item.id,
        type: item.type,
        engineVersion: item.engineVersion,
        input: JSON.parse(item.input),
        output: JSON.parse(item.output),
        createdAt: new Date(item.createdAt),
        expiresAt: new Date(item.expiresAt),
    };
}

/**
 * Salva um cálculo. O atributo `ttl` faz o DynamoDB apagar o item depois de `expiresAt`.
 */
async function saveCalculation({ id = crypto.randomUUID(), type, engineVersion, input, output, createdAt, expiresAt }) {
    const item = {
        id,
        type,
        engineVersion,
        input: JSON.stringify(input),
        output: JSON.stringify(output),
        createdAt: createdAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        ttl: Math.floor(expiresAt.getTime() / 1000),
    };
    await db.send(new PutCommand({ TableName: TABLES.calculations, Item: item }));
    return toRecord(item);
}

/**
 * Busca um cálculo ainda dentro da validade (null se não existe ou expirou).
 * O TTL do DynamoDB pode levar alguns dias para apagar o item, por isso a validade é conferida aqui.
 */
async function findValidCalculation(id) {
    const { Item } = await db.send(new GetCommand({ TableName: TABLES.calculations, Key: { id } }));
    if (!Item || new Date(Item.expiresAt) <= new Date()) return null;
    return toRecord(Item);
}

module.exports = { saveCalculation, findValidCalculation };
