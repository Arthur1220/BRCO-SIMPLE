const { z } = require('zod');
const { calculateAllRequirements } = require('../services/requirementService');
const logger = require('../lib/logger');
const { logCalculation } = require('../lib/usageLog');

// Validação dos dados de entrada usando Zod
const requirementInputSchema = z.object({
    especieId: z.number().int().min(1),
    categoriaAnimalId: z.number().int().min(1).nullable(), 
    sexoId: z.number().int().min(1).nullable(),
    pesoInicial: z.number().positive(),
    pesoFinal: z.number().positive(),
    GMD: z.number().positive(),
});

/* 
 * Realiza o cálculo de requisitos a partir dos dados fornecidos.
 */
async function handleRequirementCalculation(req, res) {
    const inputData = requirementInputSchema.parse(req.body);
    const result = calculateAllRequirements(inputData);

    await logCalculation(req, `requirement_especie_${inputData.especieId}`);

    logger.info('Requirement calculation successful')
    res.status(200).json(result);
}

module.exports = { handleRequirementCalculation };