const { z } = require('zod');
const { calculateAllRequirements } = require('../services/requirementService');
const prisma = require('../lib/prisma');
const logger = require('../lib/logger');
const geoip = require('geoip-lite');

const requirementInputSchema = z.object({
    especieId: z.number().int().min(1),
    categoriaAnimalId: z.number().int().min(1).nullable(), 
    sexoId: z.number().int().min(1).nullable(),
    pesoInicial: z.number().positive(),
    pesoFinal: z.number().positive(),
    GMD: z.number().positive(),
});

async function handleRequirementCalculation(req, res) {
    const inputData = requirementInputSchema.parse(req.body);
    const result = calculateAllRequirements(inputData);

    const userAgent = req.headers['user-agent'];
    const ip = req.ip;
    const geo = geoip.lookup(ip);

    await prisma.calculationLog.create({
        data: { 
            calculationType: `requirement_especie_${inputData.especieId}`,
            userAgent: userAgent,
            country: geo ? geo.country : 'Unknown',
            region: geo ? geo.region : 'Unknown',
        },
    });

    logger.info('Requirement calculation successful')
    res.status(200).json(result);
}

module.exports = { handleRequirementCalculation };