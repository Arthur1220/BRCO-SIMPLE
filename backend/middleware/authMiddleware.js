const ADMIN_SECRET_KEY = process.env.ADMIN_API_KEY;
const PUBLIC_SECRET_KEY = process.env.PUBLIC_API_KEY;

/**
 * Middleware para proteger rotas administrativas.
 * Verifica o header 'x-api-key' contra a chave de ADMIN.
 */
function adminApiKeyAuth(req, res, next) {
  const userApiKey = req.headers['x-api-key'];

  if (!ADMIN_SECRET_KEY) {
    console.error("ERRO CRÍTICO: ADMIN_API_KEY não configurada.");
    return res.status(500).json({ error: 'Erro de configuração do servidor.' });
  }
  
  if (userApiKey && userApiKey === ADMIN_SECRET_KEY) {
    next();
  } else {
    res.status(401).json({ error: 'Acesso não autorizado.' });
  }
}

/**
 * Middleware para proteger rotas públicas da API.
 * Verifica o header 'x-api-key' contra a chave PÚBLICA.
 * Previne uso não autorizado da API por terceiros.
 */
function publicApiKeyAuth(req, res, next) {
  const userApiKey = req.headers['x-api-key'];

  if (!PUBLIC_SECRET_KEY) {
    console.error("ERRO CRÍTICO: PUBLIC_API_KEY não configurada.");
    return res.status(500).json({ error: 'Erro de configuração do servidor.' });
  }

  if (userApiKey && userApiKey === PUBLIC_SECRET_KEY) {
    return next();
  }
  
  res.status(401).json({ error: 'Acesso não autorizado.' });
}

module.exports = { adminApiKeyAuth, publicApiKeyAuth };