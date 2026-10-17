const prisma = require('../../lib/prisma');
const { t } = require('../../lib/i18n');
const { errorMapFor } = require('../../contracts/localized');
const { sendError } = require('../../lib/apiErrors');
const { findCategory, DIET_RULES } = require('../../catalog/diet');
const { createFoodSchema, updateFoodSchema, foodIdSchema } = require('../../validation/foodSchema');

/**
 * Alimento no formato da v1: unidade explícita e label da categoria traduzido.
 */
function presentFood(food, locale) {
    const category = findCategory(food.category);
    return {
        id: food.id,
        name: food.name,
        category: food.category,
        categoryLabel: category ? t(category.label, locale) : food.category,
        defaultMin: food.defaultMin,
        defaultMax: food.defaultMax,
        unit: DIET_RULES.foodNutrientUnit,
        MS: food.MS, MO: food.MO, EE: food.EE, PB: food.PB, PDR: food.PDR, PNDR: food.PNDR,
        NDT: food.NDT, FDNcp: food.FDNcp, CNF: food.CNF, Ca: food.Ca, P: food.P,
        updatedAt: food.updatedAt.toISOString(),
    };
}

const parse = (schema, data, locale) => schema.parse(data, { errorMap: errorMapFor(locale) });

/**
 * GET /api/v1/foods (público)
 */
async function listFoods(req, res) {
    const foods = await prisma.food.findMany({ orderBy: { name: 'asc' } });
    res.json(foods.map((food) => presentFood(food, req.locale)));
}

/**
 * POST /api/v1/admin/foods
 */
async function createFood(req, res) {
    const data = parse(createFoodSchema, req.body, req.locale);
    const food = await prisma.food.create({ data });
    res.status(201).json(presentFood(food, req.locale));
}

async function withFoodOr404(req, res, action) {
    const id = parse(foodIdSchema, req.params.id, req.locale);
    try {
        return await action(id);
    } catch (error) {
        if (error.code === 'P2025') return sendError(req, res, 404, 'NOT_FOUND', 'Alimento não encontrado.');
        throw error;
    }
}

/**
 * PUT /api/v1/admin/foods/:id
 */
async function updateFood(req, res) {
    await withFoodOr404(req, res, async (id) => {
        const data = parse(updateFoodSchema, req.body, req.locale);
        const food = await prisma.food.update({ where: { id }, data });
        res.json(presentFood(food, req.locale));
    });
}

/**
 * DELETE /api/v1/admin/foods/:id
 */
async function deleteFood(req, res) {
    await withFoodOr404(req, res, async (id) => {
        await prisma.food.delete({ where: { id } });
        res.status(204).end();
    });
}

module.exports = { presentFood, listFoods, createFood, updateFood, deleteFood };
