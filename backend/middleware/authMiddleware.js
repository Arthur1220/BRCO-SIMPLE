const ADMIN_SECRET_KEY = process.env.ADMIN_API_KEY;
const PUBLIC_SECRET_KEY = process.env.PUBLIC_API_KEY;

// Middleware para as rotas de Admin
function adminApiKeyAuth(req, res, next) {
  const userApiKey = req.headers['x-api-key'];

  // Verificação de segurança: garante que a chave do servidor está configurada
  if (!ADMIN_SECRET_KEY) {
    console.error("ERRO CRÍTICO: ADMIN_API_KEY não está configurada no servidor.");
    return res.status(500).json({ error: 'Erro de configuração interna do servidor.' });
  }
  
  if (userApiKey && userApiKey === ADMIN_SECRET_KEY) {
    next(); // Acesso permitido
  } else {
    res.status(401).json({ error: 'Acesso não autorizado.' }); // Bloqueia
  }
}

// Middleware para as rotas públicas
function publicApiKeyAuth(req, res, next) {
  const userApiKey = req.headers['x-api-key'];

  // Verificação de segurança
  if (!PUBLIC_SECRET_KEY) {
    console.error("ERRO CRÍTICO: PUBLIC_API_KEY não está configurada no servidor.");
    return res.status(500).json({ error: 'Erro de configuração interna do servidor.' });
  }

  if (userApiKey && userApiKey === PUBLIC_SECRET_KEY) {
    return next(); // Acesso permitido
  }
  
  res.status(401).json({ error: 'Acesso não autorizado.' }); // Bloqueia
}

module.exports = { adminApiKeyAuth, publicApiKeyAuth };