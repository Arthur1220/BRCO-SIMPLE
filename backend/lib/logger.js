const winston = require('winston');

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Configuração do Logger (Winston).
 * Os logs vão apenas para stdout: em produção em JSON (o Docker guarda e
 * rotaciona, ver `logging` no docker-compose.yml); em desenvolvimento coloridos.
 * Nada é gravado em arquivo, então o disco não cresce sem limite.
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  silent: process.env.NODE_ENV === 'test',
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: isProduction
        ? winston.format.json()
        : winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

module.exports = logger;
