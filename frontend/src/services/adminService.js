import apiClient, { setAdminToken, clearAdminToken } from './axiosSetup.js';

// O token de sessão é anexado automaticamente pelo interceptor do axiosSetup.js.

/**
 * Faz login no painel de admin e guarda o token de sessão.
 * @param {string} password - A senha digitada pelo usuário.
 */
export const loginAdmin = async (password) => {
  const response = await apiClient.post('/v1/admin/login', { password });
  setAdminToken(response.data.token);
  return response.data;
};

/**
 * Encerra a sessão de admin.
 */
export const logoutAdmin = () => clearAdminToken();

/**
 * Estatísticas gerais (total e por tipo, com label pronto).
 */
export const getAdminStats = async (period = 'all') => {
  const response = await apiClient.get('/v1/admin/stats', { params: { period } });
  return response.data;
};

/**
 * Últimos registros de uso.
 */
export const getAdminLogs = async (period = 'all') => {
  const response = await apiClient.get('/v1/admin/logs', { params: { period } });
  return response.data;
};

/**
 * Uso por dia, para o gráfico.
 */
export const getAdminChartData = async (period = '30d') => {
  const response = await apiClient.get('/v1/admin/stats/over-time', { params: { period } });
  return response.data;
};

/**
 * Cria um novo alimento no sistema.
 */
export const createFood = async (foodData) => {
  const response = await apiClient.post('/v1/admin/foods', foodData);
  return response.data;
};

/**
 * Atualiza um alimento existente.
 */
export const updateFood = async (id, foodData) => {
  const response = await apiClient.put(`/v1/admin/foods/${id}`, foodData);
  return response.data;
};

/**
 * Deleta um alimento existente.
 */
export const deleteFood = async (id) => {
  await apiClient.delete(`/v1/admin/foods/${id}`);
};
