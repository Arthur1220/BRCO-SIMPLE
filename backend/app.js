// Patch para erros assíncronos no Express
require('express-async-errors');

// Importações de Módulos
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Imports Internos
const apiRoutes = require('./routes/apiRoutes');
const v1Routes = require('./routes/v1');
const adminRoutes = require('./routes/adminRoutes');
const setupSwagger = require('./config/swagger');
const logger = require('./lib/logger');
const { verifyNetlifyProxy, getClientIp } = require('./middleware/authMiddleware');
const { sendError } = require('./lib/apiErrors');

/**
 * Cria a aplicação Express (sem iniciar o servidor, para permitir testes).
 */
function createApp() {
    const app = express();

    // Quantidade de proxies reversos à frente da aplicação (Caddy = 1).
    app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));

    // =========================================================
    // ==                    MIDDLEWARES                      ==
    // =========================================================

    // Segurança básica (headers HTTP)
    app.use(helmet());

    // CORS (Configuração de Origem)
    const corsOptions = {
        origin: process.env.NODE_ENV === 'production'
            ? process.env.FRONTEND_URL || 'https://brco.netlify.app'
            : ['http://localhost:5173', 'http://localhost:8080'], // Aceita Vite e Docker local
        optionsSuccessStatus: 200
    };
    app.use(cors(corsOptions));

    // Parsing de JSON
    app.use(express.json({ limit: '100kb' }));

    // =========================================================
    // ==                       ROTAS                         ==
    // =========================================================

    // Rota de Health Check
    app.get('/', (req, res) => {
        res.json({
            status: "success",
            message: "API online. Acesse /api-docs para documentação.",
            docs: "/api-docs"
        });
    });

    // Toda a API só aceita requisições assinadas pelo proxy do Netlify (em produção).
    app.use('/api', verifyNetlifyProxy);

    // Limitador de Taxa por IP real do usuário (Previne DDoS básico)
    app.use('/api', rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 200,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: getClientIp,
        handler: (req, res) => sendError(req, res, 429, 'RATE_LIMITED', 'Muitas requisições. Tente novamente em alguns minutos.'),
    }));

    // API v1 (contrato de apresentação). Montada antes da v0, que também atende /api/*
    app.use('/api/v1', v1Routes);

    // Rotas de Admin (Mais específicas primeiro)
    // A segurança é aplicada dentro do adminRoutes.js
    app.use('/api/admin', adminRoutes);

    // Rotas Públicas da API
    app.use('/api', apiRoutes);

    // Documentação Swagger
    setupSwagger(app);

    // =========================================================
    // ==                 TRATAMENTO DE ERROS                 ==
    // =========================================================

    // Middleware Global de Erros (Deve ser o último app.use)
    app.use((err, req, res, next) => {
        // Erros de validação do Zod
        if (err.name === 'ZodError' || (err.issues && Array.isArray(err.issues))) {
            return res.status(400).json({
                error: "Dados de entrada inválidos",
                details: err.issues || err.errors
            });
        }

        // JSON malformado ou corpo grande demais
        if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
            return res.status(err.status || 400).json({ error: 'Corpo da requisição inválido.' });
        }

        // Log estruturado do erro
        logger.error({
            message: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
        });

        // Erro Genérico de Servidor
        res.status(500).json({ error: 'Ocorreu um erro inesperado no servidor.' });
    });

    return app;
}

module.exports = { createApp };
