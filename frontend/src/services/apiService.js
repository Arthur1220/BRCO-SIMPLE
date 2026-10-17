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

/** * Envia os dados para gerar um arquivo CSV.
 * @param {object} data - O objeto com os dados para o CSV.
 * @returns {Promise<Blob>} - A promessa com o arquivo CSV em formato Blob.
 */
export const generateCsv = async (data) => {
  const csvConfig = { responseType: 'blob' };
  const response = await apiClient.post('/generate-csv', data, csvConfig);
  return response.data;
};

/** * Busca a lista de alimentos.
 * @returns {Promise<object[]>} - A promessa com a lista de alimentos.
 */
export const getFoods = async () => {
  const response = await apiClient.get('/foods');
  return response.data;
};

/** * Envia os dados para o cálculo de dieta.
 * @param {object} data - O objeto com os dados do formulário.
 * @returns {Promise<object>} - A promessa com os resultados do cálculo de dieta.
 */
export const calculateDiet = async (data) => {
  const response = await apiClient.post('/calculate/diet', data);
  return response.data;
};
