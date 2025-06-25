const { z } = require('zod');
const { calculateNdt } = require('../services/ndtService');
const prisma = require('../lib/prisma');
const logger = require('../lib/logger');

const ndtInputSchema = z.object({
    PB: z.number(), PIDN: z.number(), PIDA: z.number(),
    MO: z.number(), EE: z.number(), FDN: z.number(),
    Ligrina: z.number(),
});

async function handleNdtCalculation(req, res) {
    const inputData = ndtInputSchema.parse(req.body);
    const result = calculateNdt(inputData);

    await prisma.calculationLog.create({
        data: { calculationType: 'ndt_calculation' },
    });
    
    logger.info('NDT calculation successful');
    res.status(200).json(result);
}

module.exports = { handleNdtCalculation };