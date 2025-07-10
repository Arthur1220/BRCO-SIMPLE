import apiClient from './axiosSetup.js';

const publicKey = import.meta.env.VITE_PUBLIC_API_KEY;

// Criamos um objeto de configuração com o header que será usado em todas as chamadas públicas
const config = {
    headers: { 'x-api-key': publicKey }
};
/**
 * Envia os dados para o cálculo de exigências.
 * @param {object} data - O objeto com os dados do formulário.
 * @returns {Promise<object>} - A promessa com os resultados do cálculo.
 */
export const calculateRequirements = async (data) => {
  // apiClient já sabe a URL base, então só precisamos do caminho do endpoint.
  const response = await apiClient.post('/calculate/requirements', data, config);
  return response.data; // Retornamos apenas os dados da resposta
};

/**
 * Envia os dados para o cálculo de NDT.
 * @param {object} data - O objeto com os dados do formulário.
 * @returns {Promise<object>} - A promessa com os resultados do cálculo.
 */
export const calculateNdt = async (data) => {
  const response = await apiClient.post('/calculate/ndt', data, config);
  return response.data;
};

/** * Envia os dados para gerar um arquivo CSV.
 * @param {object} data - O objeto com os dados para o CSV.
 * @returns {Promise<Blob>} - A promessa com o arquivo CSV em formato Blob.
 */
export const generateCsv = async (data) => {
  const csvConfig = { ...config, responseType: 'blob' };
  const response = await apiClient.post('/generate-csv', data, csvConfig);
  return response.data;
};