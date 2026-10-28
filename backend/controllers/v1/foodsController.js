const foodsRepository = require('../../repositories/foodsRepository');
const { t } = require('../../lib/i18n');
const { errorMapFor } = require('../../contracts/localized');
const { sendError } = require('../../lib/apiErrors');
const { findCategory, DIET_RULES } = require('../../catalog/diet');
const { createFoodSchema, updateFoodSchema, foodIdSchema } = require('../../validation/foodSchema');
const { checkFoodQuality, presentFoodQuality } = require('../../validation/foodQuality');
const historyRepository = require('../../repositories/foodHistoryRepository');
const { L } = require('../../lib/i18n');

const HISTORY_ACTIONS = {
    create: L('Cadastro', 'Created'),
    update: L('Alteração', 'Updated'),
    delete: L('Exclusão', 'Deleted'),
};
const NO_NAME = L('(sem nome)', '(no name)');

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
        NNP: food.NNP ?? null, Cu: food.Cu ?? null, Mo: food.Mo ?? null, S: food.S ?? null,
        Zn: food.Zn ?? null, Mn: food.Mn ?? null, Fe: food.Fe ?? null, Co: food.Co ?? null,
        targetSpecies: food.targetSpecies ?? null,
        updatedAt: food.updatedAt.toISOString(),
    };
}

const parse = (schema, data, locale) => schema.parse(data, { errorMap: errorMapFor(locale) });

/**
 * GET /api/v1/foods (público)
 */
async function listFoods(req, res) {
    const foods = await foodsRepository.listFoods();
    res.json(foods.map((food) => presentFood(food, req.locale)));
}

/**
 * POST /api/v1/admin/foods
 */
async function createFood(req, res) {
    const data = parse(createFoodSchema, req.body, req.locale);
    const food = await foodsRepository.createFood(data);
    await historyRepository.recordFoodChange({ foodId: food.id, foodName: food.name, action: 'create', actor: req.admin?.name, after: food });
    res.status(201).json({ ...presentFood(food, req.locale), quality: presentFoodQuality(checkFoodQuality(food), req.locale) });
}

async function withFoodOr404(req, res, action) {
    const id = parse(foodIdSchema, req.params.id, req.locale);
    try {
        return await action(id);
    } catch (error) {
        if (error instanceof foodsRepository.FoodNotFoundError) return sendError(req, res, 404, 'NOT_FOUND', 'Alimento não encontrado.');
        throw error;
    }
}

/**
 * PUT /api/v1/admin/foods/:id
 */
async function updateFood(req, res) {
    await withFoodOr404(req, res, async (id) => {
        const data = parse(updateFoodSchema, req.body, req.locale);
        const [before] = await foodsRepository.findFoodsByIds([id]);
        const food = await foodsRepository.updateFood(id, data);
        await historyRepository.recordFoodChange({ foodId: id, foodName: food.name, action: 'update', actor: req.admin?.name, before, after: food });
        res.json({ ...presentFood(food, req.locale), quality: presentFoodQuality(checkFoodQuality(food), req.locale) });
    });
}

/**
 * DELETE /api/v1/admin/foods/:id
 */
async function deleteFood(req, res) {
    await withFoodOr404(req, res, async (id) => {
        const before = await foodsRepository.deleteFood(id);
        await historyRepository.recordFoodChange({ foodId: id, foodName: before.name, action: 'delete', actor: req.admin?.name, before });
        res.status(204).end();
    });
}

/**
 * POST /api/v1/admin/foods/check: avisos de consistência de um alimento ainda não salvo.
 */
async function checkFood(req, res) {
    res.json({ quality: presentFoodQuality(checkFoodQuality(req.body || {}), req.locale) });
}

/**
 * GET /api/v1/admin/foods/quality: avisos de todos os alimentos cadastrados.
 */
async function listFoodQuality(req, res) {
    const foods = await foodsRepository.listFoods();
    res.json(foods.map((food) => ({ id: food.id, name: food.name, quality: presentFoodQuality(checkFoodQuality(food), req.locale) })));
}

function presentHistory(item, locale) {
    return {
        foodId: item.foodId,
        foodName: item.foodName,
        at: item.at,
        action: item.action,
        actionLabel: t(HISTORY_ACTIONS[item.action], locale),
        actor: item.actor || t(NO_NAME, locale),
        changes: item.changes,
    };
}

/**
 * GET /api/v1/admin/foods/:id/history
 */
async function getFoodHistory(req, res) {
    const id = parse(foodIdSchema, req.params.id, req.locale);
    const items = await historyRepository.listFoodHistory(id);
    res.json(items.map((item) => presentHistory(item, req.locale)));
}

/**
 * GET /api/v1/admin/history: últimas alterações do cadastro.
 */
async function getRecentHistory(req, res) {
    const items = await historyRepository.listRecentHistory(50);
    res.json(items.map((item) => presentHistory(item, req.locale)));
}

module.exports = {
    presentFood, listFoods, createFood, updateFood, deleteFood,
    checkFood, listFoodQuality, getFoodHistory, getRecentHistory,
};
