// services/pdfService.js
const PdfPrinter = require('pdfmake');

// NÃO HÁ MAIS 'require("path")' OU LÓGICA DE FONTES AQUI.

// O printer é inicializado sem argumentos, o que o instrui a usar suas fontes padrão (Roboto).
const printer = new PdfPrinter();

/**
 * Função auxiliar para criar a tabela de resultados do PDF
 */
function createResultsTable(resultsData) {
    const hasMaxValue = Object.values(resultsData).some(item => typeof item.valor_maximo !== 'undefined');

    // Cabeçalho da tabela
    const header = ['Parâmetro', 'Valor'];
    if (hasMaxValue) {
        header[1] = 'Valor Requerido';
        header.push('Valor Máximo');
    }
    header.push('Unidade');
    
    const body = [
        header.map(h => ({ text: h, style: 'tableHeader' }))
    ];

    // Corpo da tabela
    for (const key in resultsData) {
        const item = resultsData[key];
        const row = [
            key,
            { text: item.valor ?? item.valor_requerido ?? 'N/A', alignment: 'center' },
        ];
        if (hasMaxValue) {
            row.push({ text: item.valor_maximo ?? 'N/A', alignment: 'center' });
        }
        row.push({ text: item.tipo, alignment: 'center' });
        body.push(row);
    }
    return body;
}

/**
 * Função principal que gera o documento PDF
 */
function generatePdf(reportData) {
    const docDefinition = {
        // Define um cabeçalho que se repete em todas as páginas
        header: { text: 'Relatório BRCO - Nutrição de Caprinos e Ovinos', alignment: 'center', margin: [0, 20, 0, 0], fontSize: 9, color: 'grey' },
        
        // Define um rodapé com número de página
        footer: (currentPage, pageCount) => ({ text: `Página ${currentPage.toString()} de ${pageCount}`, alignment: 'center', margin: [0, 0, 0, 20], fontSize: 9, color: 'grey' }),

        content: [
            { text: `Relatório de Cálculo de ${reportData.type === 'ndt' ? 'NDT' : 'Exigências'}`, style: 'mainHeader' },
            { text: `Gerado em: ${new Date().toLocaleString('pt-BR')}`, alignment: 'right', style: 'subheader' },
            
            { text: 'Dados de Entrada', style: 'sectionHeader' },
            {
                // Usando um layout de duas colunas para os dados de entrada
                columns: Object.keys(reportData.inputs).map(key => ({
                    width: 'auto',
                    text: [{ text: `${key}: `, bold: true }, `${reportData.inputs[key]}`]
                })),
                columnGap: 20
            },

            { text: 'Resultados do Cálculo', style: 'sectionHeader' },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto', 'auto', 'auto'], 
                    body: createResultsTable(reportData.results)
                },
                layout: 'lightHorizontalLines'
            }
        ],
        // Estilos globais do documento
        styles: {
            mainHeader: { fontSize: 22, bold: true, margin: [0, 0, 0, 5], color: '#f58220' },
            subheader: { fontSize: 9, margin: [0, 0, 0, 20], color: 'grey' },
            sectionHeader: { fontSize: 16, bold: true, margin: [0, 20, 0, 10], color: '#2c3e50' },
            tableHeader: { bold: true, fontSize: 11, color: 'black' }
        }
        // Não precisamos mais do defaultStyle, pois estamos usando a fonte padrão 'Roboto'.
    };

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