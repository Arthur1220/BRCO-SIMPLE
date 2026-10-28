const { CreateTableCommand, UpdateTimeToLiveCommand, ResourceInUseException } = require('@aws-sdk/client-dynamodb');
const { client, TABLES } = require('./dynamo');

/**
 * Esquema das tabelas, igual ao template.yaml (SAM).
 * Usado para criar as tabelas no DynamoDB Local (desenvolvimento e testes).
 *
 * - foods:        id (N). O item id=0 guarda o contador de ids (auto incremento).
 * - calculations: id (S). Atributo `ttl` (epoch em segundos): o DynamoDB apaga após 6 meses.
 * - usageLogs:    day (S, AAAA-MM-DD UTC) + sk (S, createdAt#id): consultas por período.
 * - foodHistory:  foodId (N) + sk (S, at#uuid): alterações do cadastro de alimentos.
 */
const definitions = () => [
    {
        TableName: TABLES.foods,
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'N' }],
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    },
    {
        TableName: TABLES.calculations,
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        ttlAttribute: 'ttl',
    },
    {
        TableName: TABLES.usageLogs,
        AttributeDefinitions: [
            { AttributeName: 'day', AttributeType: 'S' },
            { AttributeName: 'sk', AttributeType: 'S' },
        ],
        KeySchema: [
            { AttributeName: 'day', KeyType: 'HASH' },
            { AttributeName: 'sk', KeyType: 'RANGE' },
        ],
    },
    {
        TableName: TABLES.foodHistory,
        AttributeDefinitions: [
            { AttributeName: 'foodId', AttributeType: 'N' },
            { AttributeName: 'sk', AttributeType: 'S' },
        ],
        KeySchema: [
            { AttributeName: 'foodId', KeyType: 'HASH' },
            { AttributeName: 'sk', KeyType: 'RANGE' },
        ],
    },
];

/**
 * Cria as tabelas que ainda não existem (idempotente).
 */
async function createTables() {
    for (const { ttlAttribute, ...definition } of definitions()) {
        try {
            await client.send(new CreateTableCommand({ ...definition, BillingMode: 'PAY_PER_REQUEST' }));
        } catch (error) {
            if (!(error instanceof ResourceInUseException)) throw error;
            continue;
        }
        if (ttlAttribute) {
            await client.send(new UpdateTimeToLiveCommand({
                TableName: definition.TableName,
                TimeToLiveSpecification: { AttributeName: ttlAttribute, Enabled: true },
            }));
        }
    }
}

module.exports = { definitions, createTables };
