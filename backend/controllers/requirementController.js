const { z } = require('zod');
const { calculateAllRequirements } = require('../services/requirementService');
const prisma = require('../lib/prisma');
const logger = require('../lib/logger');

const requirementInputSchema = z.object({
    especieId: z.number().int().min(1),
    sexoId: z.number().int().min(1),
    categoriaAnimalId: z.number().int().min(1),
    pesoInicial: z.number().positive(),
    pesoFinal: z.number().positive(),
    GMD: z.number().positive(),
});

async function handleRequirementCalculation(req, res) {
    const inputData = requirementInputSchema.parse(req.body);
    const result = calculateAllRequirements(inputData);
    
    await prisma.calculationLog.create({
        data: { calculationType: `requirement_especie_${inputData.especieId}` },
    });

    logger.info(`Requirement calculation for especie ${inputData.especieId} successful`);
    res.status(200).json(result);
}

module.exports = { handleRequirementCalculation };