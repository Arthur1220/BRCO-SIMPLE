// backend/controllers/ndtController.js
const { z } = require('zod');
const { calculateNdt } = require('../services/ndtService');
const prisma = require('../lib/prisma');
const logger = require('../lib/logger');
const geoip = require('geoip-lite');

const ndtInputSchema = z.object({
    PB: z.number(), 
    EE: z.number(), 
    FDN: z.number(), 
    Ligrina: z.number(),
    MO: z.number(), 
    PIDN: z.number(), 
    PIDA: z.number(),
});

// Note que esta função não tem mais o bloco try...catch
async function handleNdtCalculation(req, res) {
    const inputData = ndtInputSchema.parse(req.body);
    const result = calculateNdt(inputData);

    const userAgent = req.headers['user-agent'];
    const ip = req.ip;
    const geo = geoip.lookup(ip);

    await prisma.calculationLog.create({
        data: { 
            calculationType: 'ndt_calculation',
            userAgent: userAgent,
            country: geo ? geo.country : 'Unknown',
            region: geo ? geo.region : 'Unknown',
        },
    });
    
    logger.info('NDT calculation successful');
    res.status(200).json(result);
}

module.exports = { handleNdtCalculation };