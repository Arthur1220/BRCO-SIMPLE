const { generateCsv } = require('../services/csvService');
const logger = require('../lib/logger');

async function handleCsvGeneration(req, res) {
  const { type, inputs, results } = req.body;

  if (!type || !results || !inputs) {
    return res.status(400).json({ error: 'Dados completos (type, inputs, results) são necessários.' });
  }
  
  try {
    const csvString = generateCsv({ type, inputs, results });
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-brco.csv"`);
    
    logger.info('CSV report generated and sent.');
    res.status(200).send(csvString);

  } catch (error) {
    logger.error("Erro ao gerar CSV:", error);
    res.status(500).json({ error: 'Ocorreu um erro interno ao gerar o arquivo CSV.' });
  }
}

module.exports = { handleCsvGeneration };