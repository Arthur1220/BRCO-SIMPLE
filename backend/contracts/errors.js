const { z } = require('./zod');

/**
 * Formato padrão de erro da API v1.
 * `fields` traz um item por campo inválido, com mensagem pronta para exibição.
 */
const errorResponseSchema = z
    .object({
        error: z.object({
            code: z.enum(['VALIDATION', 'NOT_FOUND', 'UNAUTHORIZED', 'FORBIDDEN', 'RATE_LIMITED', 'INTERNAL']),
            message: z.string(),
            fields: z
                .array(
                    z.object({
                        path: z.string().openapi({ example: 'pesoFinal' }),
                        code: z.string().openapi({ example: 'final_gt_initial' }),
                        message: z.string(),
                    })
                )
                .optional(),
        }),
    })
    .openapi('ErrorResponse');

module.exports = { errorResponseSchema };
