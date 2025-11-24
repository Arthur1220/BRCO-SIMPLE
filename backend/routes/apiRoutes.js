const express = require('express');
const router = express.Router();
const { publicApiKeyAuth } = require('../middleware/authMiddleware');

// Importa os controladores
const requirementController = require('../controllers/requirementController');
const ndtController = require('../controllers/ndtController');
const csvController = require('../controllers/csvController');
const dietController = require('../controllers/dietController');

// ==================================================================
// BARREIRA DE SEGURANÇA
// Todas as rotas públicas exigem a chave de API Pública (x-api-key).
// Isso previne uso não autorizado da API por outros sites.
// ==================================================================
router.use(publicApiKeyAuth);

// ==================================================================
// ROTAS DE CÁLCULO
// ==================================================================

/**
 * POST /api/calculate/requirements
 * Calcula exigências nutricionais para Ovinos e Caprinos.
 */
router.post('/calculate/requirements', requirementController.handleRequirementCalculation);

/**
 * POST /api/calculate/ndt
 * Calcula o NDT (Valor energético) de um alimento.
 */
router.post('/calculate/ndt', ndtController.handleNdtCalculation);

/**
 * POST /api/calculate/diet
 * Calcula o balanço nutricional de uma dieta (Solver).
 */
router.post('/calculate/diet', dietController.handleDietCalculation);

// ==================================================================
// ROTAS DE DADOS AUXILIARES
// ==================================================================

/**
 * GET /api/foods
 * Lista todos os alimentos disponíveis no banco de dados para a dieta.
 */
router.get('/foods', dietController.getFoods);

// ==================================================================
// ROTAS DE EXPORTAÇÃO
// ==================================================================

/**
 * POST /api/generate-csv
 * Gera um arquivo CSV para download com base nos resultados.
 */
router.post('/generate-csv', csvController.handleCsvGeneration);

module.exports = router;