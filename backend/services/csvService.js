// services/csvService.js
const { Parser } = require('json2csv');

/**
 * Converte um objeto de resultados de cálculo em uma string no formato CSV.
 * @param {object} jsonData - O objeto de resultados vindo do store/cálculo.
 * @returns {string} - Uma string formatada como CSV.
 */
function generateCsv(jsonData) {
  try {
    // 1. O json2csv funciona melhor com um array de objetos. Vamos transformar nosso objeto.
    const formattedData = Object.keys(jsonData).map(key => {
      const item = jsonData[key];
      // Criamos um objeto "plano" para cada linha do CSV
      return {
        'Parâmetro': key,
        // Usamos '??' para lidar tanto com resultados de NDT (que tem 'valor') quanto de Exigências
        'Valor': item.valor_requerido ?? item.valor ?? 'N/A',
        'Valor Máximo': item.valor_maximo ?? 'N/A',
        'Unidade': item.tipo,
      };
    });

    // 2. Definimos os cabeçalhos das colunas e a ordem que queremos no arquivo final.
    const fields = ['Parâmetro', 'Valor', 'Valor Máximo', 'Unidade'];
    
    // 3. Criamos uma instância do Parser com nossas opções.
    const json2csvParser = new Parser({ fields });
    
    // 4. Convertemos os dados formatados para o formato CSV.
    const csv = json2csvParser.parse(formattedData);
    
    console.log('CSV gerado com sucesso.');
    return csv;

  } catch (error) {
    console.error('Erro ao converter JSON para CSV:', error);
    throw error; // Lança o erro para ser pego pelo controlador
  }
}

module.exports = { generateCsv };