import apiClient from './axiosSetup.js';

/**
 * Envia os dados para o cálculo de exigências.
 * @param {object} data - O objeto com os dados do formulário.
 * @returns {Promise<object>} - A promessa com os resultados do cálculo.
 */
export const calculateRequirements = async (data) => {
  // apiClient já sabe a URL base, então só precisamos do caminho do endpoint.
  const response = await apiClient.post('/calculate/requirements', data);
  return response.data; // Retornamos apenas os dados da resposta
};

/**
 * Envia os dados para o cálculo de NDT.
 * @param {object} data - O objeto com os dados do formulário.
 * @returns {Promise<object>} - A promessa com os resultados do cálculo.
 */
export const calculateNdt = async (data) => {
  const response = await apiClient.post('/calculate/ndt', data);
  return response.data;
};

/**
 * Envia os dados de um resultado para gerar um PDF.
 * @param {object} data - O objeto com o tipo e os dados do resultado.
 * @returns {Promise<Blob>} - A promessa com o arquivo PDF em formato Blob.
 */
export const generatePdf = async (data) => {
  const response = await apiClient.post('/generate-pdf', data, {
    // Esta configuração é específica para esta chamada, por isso fica aqui.
    // Ela diz ao Axios para tratar a resposta como um arquivo binário (Blob).
    responseType: 'blob', 
  });
  return response.data;
};

/** * Envia os dados para gerar um arquivo CSV.
 * @param {object} data - O objeto com os dados para o CSV.
 * @returns {Promise<Blob>} - A promessa com o arquivo CSV em formato Blob.
 */
export const generateCsv = async (data) => {
  const response = await apiClient.post('/generate-csv', data, { responseType: 'blob' });
  return response.data;
};