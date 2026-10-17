const { OpenAPIRegistry, OpenApiGeneratorV3 } = require('@asteasolutions/zod-to-openapi');
const { catalogSchema } = require('./catalog');
const { errorResponseSchema } = require('./errors');
const { requirementsInputSchema } = require('./requirements');
const { ndtInputSchema } = require('./ndt');

/**
 * Documento OpenAPI da v1, gerado a partir dos schemas Zod.
 * Novos endpoints da v1 devem ser registrados aqui.
 */
function buildOpenApiDocument() {
    const registry = new OpenAPIRegistry();

    const proxySignature = registry.registerComponent('securitySchemes', 'NetlifyProxySignature', {
        type: 'apiKey',
        in: 'header',
        name: 'X-Nf-Sign',
        description: 'Em produção a API só aceita requisições do proxy do Netlify, que assina cada uma (JWS HS256).',
    });

    registry.register('ErrorResponse', errorResponseSchema);
    // Contratos de entrada já definidos (endpoints de cálculo chegam na Fase 2)
    registry.register('RequirementsInput', requirementsInputSchema);
    registry.register('NdtInput', ndtInputSchema);

    const errorContent = { 'application/json': { schema: errorResponseSchema } };

    registry.registerPath({
        method: 'get',
        path: '/api/v1/catalog',
        tags: ['Catálogo'],
        summary: 'Opções, campos, limites e regras para montar as telas.',
        security: [{ [proxySignature.name]: [] }],
        responses: {
            200: {
                description: 'Catálogo atual. Inclui ETag e Cache-Control (1 hora).',
                content: { 'application/json': { schema: catalogSchema } },
            },
            304: { description: 'O cliente já tem a versão atual (If-None-Match).' },
            403: { description: 'Requisição sem assinatura do proxy.', content: errorContent },
            429: { description: 'Limite de requisições excedido.', content: errorContent },
        },
    });

    return new OpenApiGeneratorV3(registry.definitions).generateDocument({
        openapi: '3.0.3',
        info: {
            title: 'BRCO API v1',
            version: '1.0.0',
            description: 'Contrato de apresentação: o backend entrega dados prontos para exibir.',
        },
    });
}

module.exports = { buildOpenApiDocument };
