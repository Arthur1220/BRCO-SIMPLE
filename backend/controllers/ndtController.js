const { z } = require('zod');
const { calculateNdt } = require('../domain/ndtService');
const logger = require('../lib/logger');
const { logCalculation } = require('../lib/usageLog');

// Validação dos dados de entrada usando Zod
const ndtInputSchema = z.object({
    PB: z.number(), 
    EE: z.number(), 
    FDN: z.number(), 
    Ligrina: z.number(),
    MO: z.number(), 
    PIDN: z.number(), 
    PIDA: z.number(),
});

/*
 * Realiza o cálculo de NDT a partir dos dados fornecidos.
 */
async function handleNdtCalculation(req, res) {
    const inputData = ndtInputSchema.parse(req.body);
    const result = calculateNdt(inputData);

    await logCalculation(req, 'ndt_calculation');
    
    logger.info('NDT calculation successful');
    res.status(200).json(result);
}

module.exports = { handleNdtCalculation };