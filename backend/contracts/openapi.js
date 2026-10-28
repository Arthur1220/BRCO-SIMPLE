const { OpenAPIRegistry, OpenApiGeneratorV3 } = require('@asteasolutions/zod-to-openapi');
const { z } = require('./zod');
const { catalogSchema } = require('./catalog');
const { errorResponseSchema } = require('./errors');
const { getRequirementsInputSchema } = require('./requirements');
const { getNdtInputSchema } = require('./ndt');
const { getDietInputSchema } = require('./diet');
const {
    groupedCalculationSchema, dietCalculationSchema, foodSchema, statsSchema, usageLogSchema, usagePointSchema,
} = require('./responses');
const { createFoodSchema, updateFoodSchema } = require('../validation/foodSchema');

/**
 * Documento OpenAPI da v1, gerado a partir dos schemas Zod.
 * Novos endpoints da v1 devem ser registrados aqui (há teste que confere).
 */
function buildOpenApiDocument() {
    const registry = new OpenAPIRegistry();

    const proxy = registry.registerComponent('securitySchemes', 'NetlifyProxySignature', {
        type: 'apiKey',
        in: 'header',
        name: 'X-Nf-Sign',
        description: 'Em produção a API só aceita requisições do proxy do Netlify, que assina cada uma (JWS HS256).',
    });
    const bearer = registry.registerComponent('securitySchemes', 'AdminBearer', {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token obtido em POST /api/v1/admin/login (válido por 2 horas).',
    });

    const publicSecurity = [{ [proxy.name]: [] }];
    const adminSecurity = [{ [proxy.name]: [], [bearer.name]: [] }];

    const json = (schema) => ({ 'application/json': { schema } });
    const error = (description) => ({ description, content: json(errorResponseSchema) });
    const langParam = z.object({
        lang: z.enum(['pt-BR', 'en']).optional().openapi({ description: 'Idioma da resposta (alternativa ao header Accept-Language).' }),
    });
    const periodParam = langParam.extend({ period: z.enum(['7d', '30d', 'all']).optional() });
    const idParam = z.object({ id: z.string() });
    const foodIdParam = z.object({ id: z.string().openapi({ example: '1' }) });

    const common = { 403: error('Requisição sem assinatura do proxy.'), 429: error('Limite de requisições excedido.') };
    const validation = { 400: error('Dados inválidos (com `fields` por campo).') };
    const adminErrors = { 401: error('Token ausente, inválido ou expirado.') };

    const path = (method, url, tags, summary, config) => registry.registerPath({ method, path: url, tags, summary, ...config });

    // ---------- Catálogo e alimentos ----------
    path('get', '/api/v1/catalog', ['Catálogo'], 'Opções, campos, limites e regras para montar as telas.', {
        security: publicSecurity,
        request: { query: langParam },
        responses: {
            200: { description: 'Catálogo no idioma pedido. Inclui ETag; Cache-Control no-cache (o cliente revalida e recebe 304 se nada mudou).', content: json(catalogSchema) },
            304: { description: 'O cliente já tem a versão atual (If-None-Match).' },
            ...common,
        },
    });
    path('get', '/api/v1/foods', ['Alimentos'], 'Alimentos cadastrados (nutrientes em g/kg MS).', {
        security: publicSecurity,
        request: { query: langParam },
        responses: { 200: { description: 'Lista de alimentos.', content: json(z.array(foodSchema)) }, ...common },
    });

    // ---------- Cálculos ----------
    const calcPath = (type, input, output, summary) =>
        path('post', `/api/v1/calculations/${type}`, ['Cálculos'], summary, {
            security: publicSecurity,
            request: { query: langParam, body: { content: json(input) } },
            responses: {
                201: { description: 'Cálculo realizado e salvo (header Location aponta para ele).', content: json(output) },
                ...validation,
                ...common,
            },
        });
    calcPath('requirements', getRequirementsInputSchema('pt-BR'), groupedCalculationSchema, 'Calcula as exigências nutricionais.');
    calcPath('ndt', getNdtInputSchema('pt-BR'), groupedCalculationSchema, 'Calcula o NDT e as energias de um alimento.');
    calcPath('diet', getDietInputSchema('pt-BR'), dietCalculationSchema, 'Formula a dieta de menor custo (solver).');

    path('get', '/api/v1/calculations/{id}', ['Cálculos'], 'Busca um cálculo salvo (link compartilhável).', {
        security: publicSecurity,
        request: { params: idParam, query: langParam },
        responses: {
            200: { description: 'GroupedCalculation (exigências/NDT) ou DietCalculation (dieta).', content: json(z.union([groupedCalculationSchema, dietCalculationSchema])) },
            404: error('Cálculo inexistente ou expirado.'),
            ...common,
        },
    });
    path('get', '/api/v1/calculations/{id}/export.csv', ['Cálculos'], 'Exporta o cálculo salvo em CSV.', {
        security: publicSecurity,
        request: { params: idParam, query: langParam },
        responses: {
            200: { description: 'Arquivo CSV (UTF-8 com BOM).', content: { 'text/csv': { schema: z.string() } } },
            404: error('Cálculo inexistente ou expirado.'),
            ...common,
        },
    });

    // ---------- Admin ----------
    path('post', '/api/v1/admin/login', ['Admin'], 'Login no painel administrativo.', {
        security: publicSecurity,
        request: { body: { content: json(z.object({ password: z.string(), name: z.string().optional().openapi({ description: 'Quem está entrando: aparece no histórico de alterações dos alimentos.' }) })) } },
        responses: {
            200: { description: 'Token de sessão.', content: json(z.object({ token: z.string(), expiresIn: z.number().int(), name: z.string().nullable() })) },
            401: error('Senha incorreta.'),
            ...common,
        },
    });
    path('get', '/api/v1/admin/stats', ['Admin'], 'Total de cálculos e distribuição por tipo.', {
        security: adminSecurity,
        request: { query: periodParam },
        responses: { 200: { description: 'Estatísticas.', content: json(statsSchema) }, ...adminErrors, ...common },
    });
    path('get', '/api/v1/admin/stats/over-time', ['Admin'], 'Uso por dia.', {
        security: adminSecurity,
        request: { query: periodParam },
        responses: { 200: { description: 'Série diária.', content: json(z.array(usagePointSchema)) }, ...adminErrors, ...common },
    });
    path('get', '/api/v1/admin/logs', ['Admin'], 'Últimos 100 registros de uso.', {
        security: adminSecurity,
        request: { query: periodParam },
        responses: { 200: { description: 'Registros.', content: json(z.array(usageLogSchema)) }, ...adminErrors, ...common },
    });
    path('post', '/api/v1/admin/foods', ['Admin'], 'Cadastra um alimento.', {
        security: adminSecurity,
        request: { body: { content: json(createFoodSchema) } },
        responses: { 201: { description: 'Alimento criado.', content: json(foodSchema) }, ...validation, ...adminErrors, ...common },
    });
    path('put', '/api/v1/admin/foods/{id}', ['Admin'], 'Atualiza um alimento (parcial).', {
        security: adminSecurity,
        request: { params: foodIdParam, body: { content: json(updateFoodSchema) } },
        responses: { 200: { description: 'Alimento atualizado.', content: json(foodSchema) }, 404: error('Alimento não encontrado.'), ...validation, ...adminErrors, ...common },
    });
    const qualitySchema = z.array(z.object({ code: z.string(), severity: z.enum(['info', 'warning']), message: z.string() })).openapi('FoodQuality');
    const historySchema = z.array(z.object({
        foodId: z.number().int(),
        foodName: z.string(),
        at: z.string().datetime(),
        action: z.enum(['create', 'update', 'delete']),
        actionLabel: z.string(),
        actor: z.string(),
        changes: z.array(z.object({ field: z.string(), before: z.any(), after: z.any() })),
    })).openapi('FoodHistory');
    path('post', '/api/v1/admin/foods/check', ['Admin'], 'Avisos de consistência de um alimento (sem salvar).', {
        security: adminSecurity,
        request: { body: { content: json(updateFoodSchema) } },
        responses: { 200: { description: 'Avisos.', content: json(z.object({ quality: qualitySchema })) }, ...adminErrors, ...common },
    });
    path('get', '/api/v1/admin/foods/quality', ['Admin'], 'Avisos de consistência de todos os alimentos.', {
        security: adminSecurity,
        responses: { 200: { description: 'Avisos por alimento.', content: json(z.array(z.object({ id: z.number().int(), name: z.string(), quality: qualitySchema }))) }, ...adminErrors, ...common },
    });
    path('get', '/api/v1/admin/foods/{id}/history', ['Admin'], 'Histórico de alterações de um alimento.', {
        security: adminSecurity,
        request: { params: foodIdParam },
        responses: { 200: { description: 'Alterações, da mais recente para a mais antiga.', content: json(historySchema) }, ...adminErrors, ...common },
    });
    path('get', '/api/v1/admin/history', ['Admin'], 'Últimas 50 alterações do cadastro de alimentos.', {
        security: adminSecurity,
        responses: { 200: { description: 'Alterações recentes.', content: json(historySchema) }, ...adminErrors, ...common },
    });
    path('delete', '/api/v1/admin/foods/{id}', ['Admin'], 'Remove um alimento.', {
        security: adminSecurity,
        request: { params: foodIdParam },
        responses: { 204: { description: 'Removido.' }, 404: error('Alimento não encontrado.'), ...adminErrors, ...common },
    });

    return new OpenApiGeneratorV3(registry.definitions).generateDocument({
        openapi: '3.0.3',
        info: {
            title: 'BRCO API v1',
            version: '1.0.0',
            description: 'Contrato de apresentação: o backend entrega dados prontos para exibir, em pt-BR ou en.',
        },
    });
}

module.exports = { buildOpenApiDocument };
