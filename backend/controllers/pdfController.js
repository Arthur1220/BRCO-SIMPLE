const { generatePdf } = require('../services/pdfService');
const logger = require('../lib/logger');

async function handlePdfGeneration(req, res) {
  const { type, inputs, results } = req.body;

  // Validação mais explícita
  if (!type || !results || !inputs) {
    return res.status(400).json({ error: 'Dados completos (type, inputs, results) são necessários.' });
  }

  try {
    // Passamos o objeto completo para o serviço
    const pdfBuffer = await generatePdf({ type, inputs, results });
    
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