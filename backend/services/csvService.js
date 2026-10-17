const UTF8_BOM = '﻿';

/**
 * Escapa um valor para CSV (RFC 4180): aspas duplicadas e campo entre aspas
 * quando contém vírgula, aspas ou quebra de linha.
 * Valores iniciados por = + - @ ganham um apóstrofo para evitar injeção de
 * fórmulas no Excel (CSV injection).
 */
function escapeCsvValue(value) {
  if (value === null || value === undefined) return '';
  let str = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(str)) str = `'${str}`;
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/**
 * Converte uma lista de objetos em CSV, usando as chaves do primeiro objeto como cabeçalho.
 */
function toCsv(rows) {
  if (rows.length === 0) return '';
  const fields = Object.keys(rows[0]);
  const lines = [
    fields.map(escapeCsvValue).join(','),
    ...rows.map((row) => fields.map((field) => escapeCsvValue(row[field])).join(',')),
  ];
  // BOM para o Excel reconhecer acentos em UTF-8.
  return UTF8_BOM + lines.join('\n');
}

/**
 * Gera um arquivo CSV a partir dos resultados.
 */
function generateCsv(reportData) {
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
    const item = results[key] || {};

    return {
      'Parâmetro': key,
      'Valor Requerido': item.valor_requerido ?? item.valor ?? 'N/A',
      'Valor Máximo': item.valor_maximo ?? 'N/A',
      'Unidade': item.tipo,
      ...metadata,
      ...formattedInputs
    };
  });

  return toCsv(formattedData);
}

module.exports = { generateCsv, toCsv, escapeCsvValue };
