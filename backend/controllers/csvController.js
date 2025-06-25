// controllers/csvController.js
const { generateCsv } = require('../services/csvService');
const logger = require('../lib/logger');

async function handleCsvGeneration(req, res) {
  // Os dados dos resultados virão no corpo da requisição
  const resultsData = req.body.data;

  if (!resultsData) {
    return res.status(400).json({ error: 'Dados dos resultados são necessários.' });
  }
  
  try {
    const csvString = generateCsv(resultsData);
    
    // Estes headers são CRUCIAIS. Eles dizem ao navegador:
    // "Isso não é para mostrar na tela, é um arquivo para baixar."
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-brco.csv"`);
    
    logger.info('CSV report generated and sent.');
    res.status(200).send(csvString);

  } catch (error) {
    // O logger já foi chamado dentro do serviço, mas podemos logar novamente aqui se quisermos.
    res.status(500).json({ error: 'Ocorreu um erro interno ao gerar o arquivo CSV.' });
  }
}

module.exports = { handleCsvGeneration };