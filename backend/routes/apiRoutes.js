const express = require('express');
const router = express.Router();
const { publicApiKeyAuth } = require('../middleware/authMiddleware');

const { handleRequirementCalculation } = require('../controllers/requirementController');
const { handleNdtCalculation } = require('../controllers/ndtController');
const { handlePdfGeneration } = require('../controllers/pdfController');
const { handleCsvGeneration } = require('../controllers/csvController');

// APLICA O MIDDLEWARE DE CHAVE PÚBLICA A TODAS AS ROTAS DESTE ARQUIVO
router.use(publicApiKeyAuth);

// Rota para cálculo de Exigências
router.post('/calculate/requirements', handleRequirementCalculation);

// Rota para cálculo de NDT
router.post('/calculate/ndt', handleNdtCalculation);

// Rota para gerar PDF
router.post('/generate-pdf', handlePdfGeneration);

// Rota para gerar CSV
router.post('/generate-csv', handleCsvGeneration);

module.exports = router;