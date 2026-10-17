const { z } = require('zod');
const prisma = require('../lib/prisma');
const logger = require('../lib/logger');
const { logCalculation } = require('../lib/usageLog');
const { calculateDiet } = require('../domain/dietService');
const { createFoodSchema, updateFoodSchema, foodIdSchema } = require('../validation/foodSchema');

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
        
        await logCalculation(req, 'diet_calculation');

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
 * Responde 400 para dados inválidos e 404 para alimento inexistente.
 * Retorna true se o erro foi tratado.
 */
function handleFoodError(error, res) {
    if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Dados do alimento inválidos.", details: error.errors });
        return true;
    }
    if (error.code === 'P2025') {
        res.status(404).json({ error: "Alimento não encontrado." });
        return true;
    }
    return false;
}

/** 
 * Cria um novo alimento no banco de dados.
 */
async function createFood(req, res) {
    try {
        const data = createFoodSchema.parse(req.body);
        const food = await prisma.food.create({ data });
        res.status(201).json(food);
    } catch (error) { 
        if (handleFoodError(error, res)) return;
        logger.error("Erro ao criar alimento:", error);
        res.status(500).json({ error: "Erro ao criar alimento." }); 
    }
}

/**
 * Atualiza um alimento no banco de dados.
 */
async function updateFood(req, res) {
    try {
        const id = foodIdSchema.parse(req.params.id);
        const data = updateFoodSchema.parse(req.body);
        const food = await prisma.food.update({ where: { id }, data });
        res.json(food);
    } catch (error) { 
        if (handleFoodError(error, res)) return;
        logger.error("Erro ao atualizar alimento:", error);
        res.status(500).json({ error: "Erro ao atualizar." }); 
    }
}

/**
 * Deleta um alimento do banco de dados.
 */
async function deleteFood(req, res) {
    try {
        const id = foodIdSchema.parse(req.params.id);
        await prisma.food.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) { 
        if (handleFoodError(error, res)) return;
        logger.error("Erro ao deletar alimento:", error);
        res.status(500).json({ error: "Erro ao deletar." }); 
    }
}

module.exports = { getFoods, createFood, updateFood, deleteFood, handleDietCalculation };