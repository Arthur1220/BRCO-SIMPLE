const { generateCsv } = require('../services/csvService');
const logger = require('../lib/logger');

async function handleCsvGeneration(req, res) {
  // O frontend agora envia { "data": { ...resultados... } }
  const resultsData = req.body.data;

  if (!resultsData) {
    return res.status(400).json({ error: 'Dados dos resultados são necessários.' });
  }
  
  try {
    const csvString = generateCsv(resultsData);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-brco.csv"`);
    
    logger.info('CSV report generated and sent.');
    res.status(200).send(csvString);

  } catch (error) {
    res.status(500).json({ error: 'Ocorreu um erro interno ao gerar o arquivo CSV.' });
  }
}

module.exports = { handleCsvGeneration };