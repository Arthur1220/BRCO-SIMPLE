const express = require('express');
const router = express.Router();

const { handleRequirementCalculation } = require('../controllers/requirementController');
const { handleNdtCalculation } = require('../controllers/ndtController');
const { handlePdfGeneration } = require('../controllers/pdfController');

// Rota para cálculo de Exigências
router.post('/calculate/requirements', handleRequirementCalculation);

// Rota para cálculo de NDT
router.post('/calculate/ndt', handleNdtCalculation);

// Rota para gerar PDF
router.post('/generate-pdf', handlePdfGeneration);

module.exports = router;