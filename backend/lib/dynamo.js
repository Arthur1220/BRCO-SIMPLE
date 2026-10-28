const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

/**
 * Cliente único do DynamoDB.
 * Na Lambda usa a região e as credenciais do ambiente.
 * Em desenvolvimento/testes, DYNAMODB_ENDPOINT aponta para o DynamoDB Local.
 */
const endpoint = process.env.DYNAMODB_ENDPOINT;

const client = new DynamoDBClient(endpoint
    ? {
        endpoint,
        region: process.env.AWS_REGION || 'sa-east-1',
        credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
    }
    : {});

const db = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
});

/**
 * Nomes das tabelas (definidos pelo template SAM na Lambda).
 */
const TABLES = {
    get foods() { return process.env.FOODS_TABLE || 'brco-foods'; },
    get calculations() { return process.env.CALCULATIONS_TABLE || 'brco-calculations'; },
    get usageLogs() { return process.env.USAGE_LOGS_TABLE || 'brco-usage-logs'; },
    get foodHistory() { return process.env.FOOD_HISTORY_TABLE || 'brco-food-history'; },
};

/**
 * Lê todas as páginas de um Scan/Query (o DynamoDB devolve no máximo 1 MB por chamada).
 */
async function readAll(CommandClass, input) {
    const items = [];
    let ExclusiveStartKey;
    do {
        const page = await db.send(new CommandClass({ ...input, ExclusiveStartKey }));
        items.push(...(page.Items || []));
        ExclusiveStartKey = page.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return items;
}

module.exports = { client, db, TABLES, readAll };
