const { generatePdf } = require('../services/pdfService');
const logger = require('../lib/logger');

async function handlePdfGeneration(req, res) {
  const reportData = req.body;

  // Esta validação agora vai funcionar, pois o frontend envia 'inputs' e 'results'
  if (!reportData || !reportData.type || !reportData.results || !reportData.inputs) {
    return res.status(400).json({ error: 'Dados completos (type, inputs, results) são necessários.' });
  }

  try {
    const pdfBuffer = await generatePdf(reportData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio-brco.pdf"');
    
    logger.info('PDF report generated and sent.');
    res.send(pdfBuffer);

  } catch (error) {
    logger.error("Erro ao gerar PDF:", error);
    res.status(500).json({ error: 'Ocorreu um erro interno ao gerar o PDF.' });
  }
}

module.exports = { handlePdfGeneration };