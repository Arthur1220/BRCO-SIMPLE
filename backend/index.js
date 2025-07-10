require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./routes/apiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const setupSwagger = require('./config/swagger');
const logger = require('./lib/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de Segurança
app.use(helmet());
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Configuração do CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://brco.netlify.app/' // Endereço do seu Vue em produção
    : 'http://localhost:5173' // Endereço do seu Vue em dev
};

app.use(cors(corsOptions));

// Middleware para Log de Requisições
app.use(express.json());

// Rota Raiz
app.get('/', (req, res) => {
    res.json({ message: "API online. Acesse /api-docs para documentação."});
});

app.use('/api/admin', adminRoutes);
app.use('/api', apiRoutes);

// Documentação com Swagger
setupSwagger(app);

// Middleware de Tratamento de Erro Centralizado
app.use((err, req, res, next) => {
    logger.error(err);
    if (err instanceof require('zod').ZodError) {
        return res.status(400).json({ error: "Dados de entrada inválidos", details: err.errors });
    }
    res.status(500).json({ error: 'Ocorreu um erro inesperado no servidor.' });
});

app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
});