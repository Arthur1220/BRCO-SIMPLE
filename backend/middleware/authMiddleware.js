const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const logger = require('../lib/logger');
const { sendError } = require('../lib/apiErrors');

const ADMIN_TOKEN_TTL = '2h';

/**
 * Compara duas strings em tempo constante (evita timing attacks).
 */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Gera o token de sessão do painel administrativo.
 */
function issueAdminToken() {
  return jwt.sign({ role: 'admin' }, process.env.ADMIN_JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: ADMIN_TOKEN_TTL,
  });
}

/**
 * Middleware para proteger rotas administrativas.
 * Exige o header 'Authorization: Bearer <token>' emitido por POST /api/admin/login.
 */
function requireAdmin(req, res, next) {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    logger.error('ERRO CRÍTICO: ADMIN_JWT_SECRET não configurada.');
    return res.status(500).json({ error: 'Erro de configuração do servidor.' });
  }

  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Acesso não autorizado.' });
  }

  try {
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
    if (payload.role !== 'admin') throw new Error('role inválida');
    return next();
  } catch {
    return res.status(401).json({ error: 'Sessão expirada ou inválida.' });
  }
}

/**
 * Middleware que garante que a requisição veio do proxy do Netlify.
 * O Netlify assina cada requisição do proxy com um JWS no header 'X-Nf-Sign'
 * (opção `signed` no netlify.toml), usando o mesmo valor de NETLIFY_PROXY_SECRET.
 * Sem o segredo configurado (desenvolvimento local), a verificação é ignorada.
 */
function verifyNetlifyProxy(req, res, next) {
  const secret = process.env.NETLIFY_PROXY_SECRET;
  if (!secret) return next();

  try {
    jwt.verify(req.headers['x-nf-sign'], secret, { algorithms: ['HS256'], issuer: 'netlify' });
  } catch {
    return sendError(req, res, 403, 'FORBIDDEN', 'Acesso não autorizado.');
  }

  // Requisição confiável: o Netlify informa o IP real do usuário neste header.
  const clientIp = req.headers['x-nf-client-connection-ip'];
  if (clientIp) req.clientIp = clientIp;
  return next();
}

/**
 * IP real do usuário (informado pelo Netlify quando disponível).
 */
function getClientIp(req) {
  return req.clientIp || req.ip;
}

module.exports = { safeEqual, issueAdminToken, requireAdmin, verifyNetlifyProxy, getClientIp };
