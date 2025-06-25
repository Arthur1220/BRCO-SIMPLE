const { generatePdf } = require('../services/pdfService');
const logger = require('../lib/logger');

async function handlePdfGeneration(req, res) {
    const reportData = req.body;

    if (!reportData || !reportData.type || !reportData.data) {
        return res.status(400).json({ error: 'Dados do relatório insuficientes.' });
    }

    const pdfBuffer = await generatePdf(reportData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio.pdf');
    
    logger.info(`PDF generated for type: ${reportData.type}`);
    res.send(pdfBuffer);
}

module.exports = { handlePdfGeneration };