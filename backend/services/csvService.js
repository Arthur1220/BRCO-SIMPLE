const { Parser } = require('json2csv');

/**
 * Gera um arquivo CSV a partir dos resultados.
 */
function generateCsv(reportData) {
  try {
    const { type, inputs, results } = reportData;

    const metadata = {
      'Tipo de Calculo': type,
      'Data de Geração': new Date().toLocaleString('pt-BR'),
    };

    const formattedInputs = {};
    for (const key in inputs) {
      formattedInputs[`Input: ${key}`] = inputs[key];
    }

    const formattedData = Object.keys(results).map(key => {
      const item = results[key];
      
      return {
        'Parâmetro': key,
        'Valor Requerido': item.valor_requerido ?? item.valor ?? 'N/A',
        'Valor Máximo': item.valor_maximo ?? 'N/A',
        'Unidade': item.tipo,
        ...metadata,
        ...formattedInputs
      };
    });

    if (formattedData.length === 0) {
      return ''; 
    }

    const fields = Object.keys(formattedData[0]);
    
    const json2csvParser = new Parser({ fields, withBOM: true });
    const csv = json2csvParser.parse(formattedData);
    
    return csv;

  } catch (error) {
    console.error('Erro ao converter JSON para CSV:', error);
    throw error;
  }
}

module.exports = { generateCsv };