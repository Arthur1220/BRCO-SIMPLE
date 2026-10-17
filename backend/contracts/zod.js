/**
 * Instância do Zod com suporte a metadados OpenAPI (.openapi()).
 * Todos os contratos da v1 devem importar o `z` daqui.
 */
const { z } = require('zod');
const { extendZodWithOpenApi } = require('@asteasolutions/zod-to-openapi');

extendZodWithOpenApi(z);

module.exports = { z };
