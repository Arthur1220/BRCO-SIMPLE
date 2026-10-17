const { getCatalog } = require('../../catalog');

/**
 * GET /api/v1/catalog
 * Opções, campos, limites e regras que o frontend usa para montar as telas.
 * Responde 304 quando o cliente já tem a versão atual (If-None-Match).
 * `no-cache` obriga o navegador a revalidar sempre: após um deploy ninguém fica
 * com o catálogo antigo, e quando nada mudou a resposta é um 304 vazio.
 */
function getCatalogHandler(req, res) {
    const catalog = getCatalog(req.locale);
    res.set('Cache-Control', 'no-cache');
    res.set('ETag', `"${catalog.version}"`);
    // res.json responde 304 automaticamente quando o ETag bate com o If-None-Match.
    res.json(catalog);
}

module.exports = { getCatalogHandler };
