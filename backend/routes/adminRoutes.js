const express = require('express');
const router = express.Router();
const { login, getStats, getLogs, getStatsOverTime } = require('../controllers/adminController.js');
const { adminApiKeyAuth } = require('../middleware/authMiddleware.js');

// ROTA DE LOGIN (PÚBLICA, SEM SEGURANÇA)
// Esta rota não passa por nenhum middleware de chave.
router.post('/login', login);

// APLICA O MIDDLEWARE DE CHAVE DE ADMIN A TODAS AS ROTAS ABAIXO DESTA LINHA
router.use(adminApiKeyAuth);

// ROTAS DE DADOS (AGORA PROTEGIDAS)
router.get('/stats', getStats);
router.get('/logs', getLogs);
router.get('/stats/over-time', getStatsOverTime);

module.exports = router;