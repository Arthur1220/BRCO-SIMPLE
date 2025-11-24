const winston = require('winston');

/**
 * Configuração do Logger (Winston).
 * Gera logs em JSON para fácil parsing e logs coloridos no console em desenvolvimento.
 */
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Erros vão para um arquivo separado
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // Todos os logs vão para combined.log
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Se não estiver em produção, adiciona log no console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
    ),
  }));
}

module.exports = logger;