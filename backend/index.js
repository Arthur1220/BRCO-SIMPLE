require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./routes/apiRoutes');
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

// Middlewares Gerais
app.use(cors());
app.use(express.json());

// Rota Raiz
app.get('/', (req, res) => {
    res.json({ message: "API online. Acesse /api-docs para documentação."});
});

// Rotas da API
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