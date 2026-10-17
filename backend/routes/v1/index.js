const express = require('express');
const router = express.Router();

const { getCatalogHandler } = require('../../controllers/v1/catalogController');
const { v1NotFound, v1ErrorHandler } = require('../../lib/apiErrors');

// ==================================================================
// API v1: contrato de apresentação
// A origem (proxy do Netlify) e o rate limit são aplicados em app.js.
// ==================================================================

/**
 * GET /api/v1/catalog
 * Catálogo de espécies, formulários e regras da dieta.
 */
router.get('/catalog', getCatalogHandler);

// Rota inexistente e erros sempre no formato padrão da v1
router.use(v1NotFound);
router.use(v1ErrorHandler);

module.exports = router;
