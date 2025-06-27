// services/pdfService.js
const puppeteer = require('puppeteer');
const fs = require('fs'); // Importa o módulo de arquivos do Node.js
/**
 * Gera o conteúdo HTML do relatório
 * @param {object} reportData - Contém os inputs e results do cálculo
 * @returns {string} - Uma string contendo o HTML completo do relatório
 */
function getHtmlContent(reportData) {
  // Gera as linhas da tabela de resultados
  let resultRows = '';
  for (const key in reportData.results) {
    const item = reportData.results[key];
    resultRows += `
      <tr>
        <td>${key}</td>
        <td class="center">${item.valor ?? item.valor_requerido ?? 'N/A'}</td>
        ${item.valor_maximo !== undefined ? `<td class="center">${item.valor_maximo}</td>` : '<td class="center">N/A</td>'}
        <td class="center">${item.tipo}</td>
      </tr>
    `;
  }

  // Gera a lista de dados de entrada
  let inputItems = '';
  for (const key in reportData.inputs) {
      inputItems += `<li><strong>${key}:</strong> ${reportData.inputs[key]}</li>`
  }

  // Monta o HTML final com estilos CSS embutidos
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; color: #333; }
          .container { padding: 30px; }
          .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
          .header h1 { font-size: 24px; color: #f58220; margin: 0; }
          .header p { font-size: 12px; color: #777; }
          .section-title { font-size: 18px; color: #2c3e50; border-bottom: 2px solid #f58220; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px; }
          ul { list-style: none; padding: 0; }
          ul li { margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .center { text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Relatório BRCO</h1>
            <p>Nutrição de Caprinos e Ovinos</p>
          </div>
          <p><strong>Tipo de Cálculo:</strong> ${reportData.type === 'ndt' ? 'NDT' : 'Exigências'}</p>
          <p><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>

          <h2 class="section-title">Dados de Entrada</h2>
          <ul>${inputItems}</ul>

          <h2 class="section-title">Resultados do Cálculo</h2>
          <table>
            <thead>
              <tr>
                <th>Parâmetro</th>
                <th class="center">Valor Requerido</th>
                <th class="center">Valor Máximo</th>
                <th class="center">Unidade</th>
              </tr>
            </thead>
            <tbody>
              ${resultRows}
            </tbody>
          </table>
        </div>
      </body>
    </html>
  `;
}

/**
 * Função principal que gera o documento PDF usando o Puppeteer
 */
async function generatePdf(reportData) {
  let browser = null;
  try {
    const htmlContent = getHtmlContent(reportData);

    // --- LOG DE DEPURAÇÃO 1: VERIFICAR O HTML ---
    console.log("PDF SERVICE: Conteúdo HTML foi gerado. Tamanho:", htmlContent.length, "caracteres.");

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // MUDANÇA: Usando 'domcontentloaded' que é mais adequado para HTML local
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
    });

    // --- LOG DE DEPURAÇÃO 2: VERIFICAR O TAMANHO DO PDF GERADO ---
    console.log(`PDF SERVICE: Buffer do PDF gerado com sucesso. Tamanho: ${pdfBuffer.length} bytes.`);

    // --- TESTE DE SANIDADE (Opcional): Salvar o arquivo direto no backend ---
    // Se quiser ter 100% de certeza, remova o comentário das duas linhas abaixo
    // fs.writeFileSync('teste_no_backend.pdf', pdfBuffer);
    // console.log("PDF SERVICE: Arquivo 'teste_no_backend.pdf' salvo na pasta do backend para verificação.");

    return pdfBuffer;

  } catch (error) {
    console.error("Erro no serviço Puppeteer:", error);
    throw new Error("Falha ao gerar PDF com Puppeteer.");
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { generatePdf };