import apiClient from './axiosSetup.js';

// Cliente da API v1: o backend devolve tudo pronto para exibir
// (labels, unidades, grupos, destaques, status). Ver /api-docs/v1.

/**
 * Catálogo: espécies, formulários (campos, limites, regras) e regras da dieta.
 * @param {string} locale - Idioma do catálogo ('pt-BR' ou 'en').
 */
export const getCatalog = async (locale) => {
  const response = await apiClient.get('/v1/catalog', { headers: { 'Accept-Language': locale } });
  return response.data;
};

/**
 * Alimentos cadastrados (nutrientes em g/kg MS).
 */
export const getFoods = async () => {
  const response = await apiClient.get('/v1/foods');
  return response.data;
};

/**
 * Cálculo de exigências. Entrada com codes do catálogo (especie, genotipo, sexo).
 */
export const calculateRequirements = async (input) => {
  const response = await apiClient.post('/v1/calculations/requirements', withoutEmpty(input));
  return response.data;
};

/**
 * Cálculo de NDT de um alimento.
 */
export const calculateNdt = async (input) => {
  const response = await apiClient.post('/v1/calculations/ndt', withoutEmpty(input));
  return response.data;
};

/**
 * Formulação de dieta: { animal, ingredients: [{ foodId } | { custom }] }.
 */
export const calculateDiet = async (input) => {
  const response = await apiClient.post('/v1/calculations/diet', input);
  return response.data;
};

/**
 * Cálculo salvo (válido por 6 meses).
 */
export const getCalculation = async (id) => {
  const response = await apiClient.get(`/v1/calculations/${id}`);
  return response.data;
};

/**
 * CSV gerado pelo servidor a partir do cálculo salvo.
 * @returns {Promise<{ blob: Blob, filename: string }>}
 */
export const downloadCalculationCsv = async (id) => {
  const response = await apiClient.get(`/v1/calculations/${id}/export.csv`, { responseType: 'blob' });
  const disposition = response.headers['content-disposition'] || '';
  const filename = disposition.match(/filename="([^"]+)"/)?.[1] || `brco-${id}.csv`;
  return { blob: response.data, filename };
};

/**
 * Remove campos vazios ('' ou null) do payload: a API responde "é obrigatório" para eles.
 */
export const withoutEmpty = (payload) =>
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== '' && value !== null && value !== undefined));
