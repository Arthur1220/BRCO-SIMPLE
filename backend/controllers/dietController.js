const { z } = require('zod');
const prisma = require('../lib/prisma');
const logger = require('../lib/logger');
const geoip = require('geoip-lite');
const { calculateDiet } = require('../services/dietService');

// --- SCHEMAS DE VALIDAÇÃO (ZOD) ---

// Valida os dados do animal (igual ao requirementController)
const animalDataSchema = z.object({
    especieId: z.number().int().min(1),
    categoriaAnimalId: z.number().int().nullable().optional(),
    sexoId: z.number().int().nullable().optional(),
    pesoInicial: z.number().positive(),
    pesoFinal: z.number().positive(),
    GMD: z.number().nonnegative(), // Pode ser 0 (mantença)
});

// Valida um único ingrediente
const ingredientSchema = z.object({
    name: z.string(),
    category: z.string().optional(),
    // Nutrientes essenciais (podem vir como 0, mas devem ser números)
    PB: z.number().optional().default(0),
    NDT: z.number().optional().default(0),
    Ca: z.number().optional().default(0),
    P: z.number().optional().default(0),
    FDNcp: z.number().optional().default(0),
    // Campos do Solver
    min: z.number().optional().default(0),
    max: z.number().optional().default(100),
    price: z.number().optional().default(0),
    percent: z.number().optional().default(0) // Caso venha preenchido
});

// Valida o corpo principal da requisição
const dietCalculationSchema = z.object({
    animalData: animalDataSchema,
    ingredients: z.array(ingredientSchema).min(1, "É necessário fornecer pelo menos um ingrediente."),
});

/**
 * Lista todos os alimentos cadastrados no banco.
 */
async function getFoods(req, res) {
  try {
    const foods = await prisma.food.findMany({ orderBy: { name: 'asc' } });
    res.json(foods);
  } catch (error) {
    logger.error("Erro ao buscar alimentos:", error);
    res.status(500).json({ error: 'Erro ao carregar alimentos.' });
  }
}

/**
 * Realiza o cálculo de formulação de dieta (Solver).
 */
async function handleDietCalculation(req, res) {
    try {
        const { animalData, ingredients } = dietCalculationSchema.parse(req.body);
        
        const result = calculateDiet(animalData, ingredients);
        
        const userAgent = req.headers['user-agent'];
        const ip = req.ip;
        const geo = geoip.lookup(ip);

        await prisma.calculationLog.create({
        data: { 
            calculationType: 'diet_calculation',
            userAgent: userAgent,
            country: geo ? geo.country : 'Unknown',
            region: geo ? geo.region : 'Unknown',
        },
    });

        logger.info('Diet calculation successful');
        res.json(result);

    } catch (error) {
        if (error instanceof z.ZodError) {
             logger.warn("Dados de dieta inválidos:", error.errors);
             return res.status(400).json({ error: "Dados de entrada inválidos.", details: error.errors });
        }

        logger.error("Erro ao calcular dieta:", error);
        res.status(500).json({ error: "Erro interno no cálculo da dieta." });
    }
}

// --- FUNÇÕES DE GERENCIAMENTO DE ALIMENTOS (ADMIN) ---
/** 
 * Cria um novo alimento no banco de dados.
 */
async function createFood(req, res) {
    try {
        const food = await prisma.food.create({ data: req.body });
        res.json(food);
    } catch (error) { 
        logger.error("Erro ao criar alimento:", error);
        res.status(500).json({ error: "Erro ao criar alimento." }); 
    }
}

/**
 * Atualiza um alimento no banco de dados.
 */
async function updateFood(req, res) {
    const { id } = req.params;
    try {
        const food = await prisma.food.update({
            where: { id: Number(id) },
            data: req.body
        });
        res.json(food);
    } catch (error) { 
        logger.error("Erro ao atualizar alimento:", error);
        res.status(500).json({ error: "Erro ao atualizar." }); 
    }
}

/**
 * Deleta um alimento do banco de dados.
 */
async function deleteFood(req, res) {
    const { id } = req.params;
    try {
        await prisma.food.delete({ where: { id: Number(id) } });
        res.json({ success: true });
    } catch (error) { 
        logger.error("Erro ao deletar alimento:", error);
        res.status(500).json({ error: "Erro ao deletar." }); 
    }
}

module.exports = { getFoods, createFood, updateFood, deleteFood, handleDietCalculation };