// Carrega as variáveis de ambiente
require('dotenv').config();

// Patch para erros assíncronos no Express
require('express-async-errors');

// Importações de Módulos
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Imports Internos
const apiRoutes = require('./routes/apiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const setupSwagger = require('./config/swagger');
const logger = require('./lib/logger');

// Inicialização do App Express
const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// =========================================================
// ==                    MIDDLEWARES                      ==
// =========================================================

// Segurança básica (headers HTTP)
app.use(helmet());

// Limitador de Taxa (Previne DDoS básico)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// CORS (Configuração de Origem)
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL || 'https://brco.netlify.app'
        : ['http://localhost:5173', 'http://localhost:8080'], // Aceita Vite e Docker local
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Parsing de JSON
app.use(express.json());

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

// Rotas de Admin (Mais específicas primeiro)
// A segurança é aplicada dentro do adminRoutes.js
app.use('/api/admin', adminRoutes);

// Rotas Públicas da API
// A segurança é aplicada dentro do apiRoutes.js
app.use('/api', apiRoutes);

// Documentação Swagger
setupSwagger(app);

// =========================================================
// ==                 TRATAMENTO DE ERROS                 ==
// =========================================================

// Middleware Global de Erros (Deve ser o último app.use)
app.use((err, req, res, next) => {
    // Log estruturado do erro
    logger.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip
    });

    // Erros de validação do Zod (se usado)
    if (err.name === 'ZodError' || (err.issues && Array.isArray(err.issues))) {
        return res.status(400).json({ 
            error: "Dados de entrada inválidos", 
            details: err.issues || err.errors 
        });
    }

    // Erro Genérico de Servidor
    res.status(500).json({ error: 'Ocorreu um erro inesperado no servidor.' });
});

// =========================================================
// ==                   INICIALIZAÇÃO                     ==
// =========================================================

app.listen(PORT, () => {
    logger.info(`🚀 Servidor rodando na porta ${PORT}`);
    logger.info(`📝 Documentação disponível em http://localhost:${PORT}/api-docs`);
});