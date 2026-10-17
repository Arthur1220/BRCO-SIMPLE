const { getCatalog } = require('../../catalog');

const ONE_HOUR = 60 * 60;

/**
 * GET /api/v1/catalog
 * Opções, campos, limites e regras que o frontend usa para montar as telas.
 * Responde 304 quando o cliente já tem a versão atual (If-None-Match).
 */
function getCatalogHandler(req, res) {
    const catalog = getCatalog();
    res.set('Cache-Control', `public, max-age=${ONE_HOUR}`);
    res.set('ETag', `"${catalog.version}"`);
    // res.json responde 304 automaticamente quando o ETag bate com o If-None-Match.
    res.json(catalog);
}

module.exports = { getCatalogHandler };
