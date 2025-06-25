const PdfPrinter = require('pdfmake');

function generatePdf(reportData) {
    const fonts = {
        Roboto: {
            normal: Buffer.from(require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-Regular.ttf'], 'base64'),
            bold: Buffer.from(require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-Medium.ttf'], 'base64')
        }
    };

    const printer = new PdfPrinter(fonts);

    const docDefinition = {
        content: [
            { text: 'Relatório de Cálculo', style: 'header' },
            { text: `Tipo: ${reportData.type}`, style: 'subheader'},
            { text: `Data: ${new Date().toLocaleDateString('pt-BR')}`, alignment: 'right' },
            '\n',
            { text: 'Resultados:', style: 'subheader' },
        ],
        styles: {
            header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
            subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
            resultKey: { bold: true }
        }
    };

    // Adiciona os resultados dinamicamente
    for (const key in reportData.data) {
        const item = reportData.data[key];
        docDefinition.content.push({
            text: [
                { text: `${key}: `, style: 'resultKey' },
                `${item.valor || item.valor_requerido} ${item.tipo}`
            ]
        });
    }

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    return new Promise((resolve, reject) => {
        try {
            const chunks = [];
            pdfDoc.on('data', chunk => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.end();
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { generatePdf };