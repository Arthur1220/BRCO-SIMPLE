const express = require('express');
const router = express.Router();

// Controladores
const adminController = require('../controllers/adminController.js');
const dietController = require('../controllers/dietController.js');

// Middleware de Segurança
const { adminApiKeyAuth } = require('../middleware/authMiddleware.js');

// ==================================================================
// 1. ROTAS PÚBLICAS DE ADMIN
// ==================================================================

/**
 * POST /api/admin/login
 * Realiza o login no painel (verifica a senha do .env).
 */
router.post('/login', adminController.login);

// ==================================================================
// 2. BARREIRA DE SEGURANÇA
// Todas as rotas abaixo exigem a chave de API de Admin (x-api-key).
// ==================================================================
router.use(adminApiKeyAuth);

// ==================================================================
// 3. ROTAS PROTEGIDAS (DASHBOARD)
// ==================================================================

/**
 * GET /api/admin/stats
 * Retorna estatísticas gerais (total de cálculos, distribuição por tipo).
 * Aceita query params: ?period=7d (ou 30d)
 */
router.get('/stats', adminController.getStats);

/**
 * GET /api/admin/logs
 * Retorna a lista dos últimos logs de uso.
 * Aceita query params: ?period=7d (ou 30d)
 */
router.get('/logs', adminController.getLogs);

/**
 * GET /api/admin/stats/over-time
 * Retorna dados para o gráfico de uso ao longo do tempo.
 */
router.get('/stats/over-time', adminController.getStatsOverTime);

// ==================================================================
// 4. GERENCIAMENTO DE ALIMENTOS (CRUD)
// ==================================================================

router.post('/foods', dietController.createFood);
router.put('/foods/:id', dietController.updateFood);
router.delete('/foods/:id', dietController.deleteFood);

module.exports = router;