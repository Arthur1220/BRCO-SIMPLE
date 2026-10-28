const express = require('express');
const router = express.Router();

const { getCatalogHandler } = require('../../controllers/v1/catalogController');
const calculations = require('../../controllers/v1/calculationsController');
const foods = require('../../controllers/v1/foodsController');
const admin = require('../../controllers/v1/adminController');
const { requireAdmin } = require('../../middleware/authMiddleware');
const { loginLimiter } = require('../../middleware/loginLimiter');
const { localeMiddleware } = require('../../lib/i18n');
const { v1NotFound, v1ErrorHandler } = require('../../lib/apiErrors');

// ==================================================================
// API v1: contrato de apresentação
// A origem (proxy do Netlify) e o rate limit são aplicados em app.js.
// Idioma: ?lang=pt-BR|en ou Accept-Language.
// ==================================================================
router.use(localeMiddleware);

// Catálogo e dados auxiliares
router.get('/catalog', getCatalogHandler);
router.get('/foods', foods.listFoods);

// Cálculos (salvos por até 6 meses)
router.post('/calculations/requirements', calculations.createRequirements);
router.post('/calculations/ndt', calculations.createNdt);
router.post('/calculations/diet', calculations.createDiet);
router.get('/calculations/:id', calculations.getCalculation);
router.get('/calculations/:id/export.csv', calculations.exportCalculationCsv);

// Admin
router.post('/admin/login', loginLimiter, admin.login);

const adminRouter = express.Router();
adminRouter.use(requireAdmin);
adminRouter.get('/stats', admin.getStats);
adminRouter.get('/stats/over-time', admin.getStatsOverTime);
adminRouter.get('/logs', admin.getLogs);
adminRouter.post('/foods/check', foods.checkFood);
adminRouter.get('/foods/quality', foods.listFoodQuality);
adminRouter.get('/foods/:id/history', foods.getFoodHistory);
adminRouter.get('/history', foods.getRecentHistory);
adminRouter.post('/foods', foods.createFood);
adminRouter.put('/foods/:id', foods.updateFood);
adminRouter.delete('/foods/:id', foods.deleteFood);
router.use('/admin', adminRouter);

// Rota inexistente e erros sempre no formato padrão da v1
router.use(v1NotFound);
router.use(v1ErrorHandler);

module.exports = router;
