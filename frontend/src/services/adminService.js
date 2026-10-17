import apiClient, { setAdminToken, clearAdminToken } from './axiosSetup.js';

// O token de sessão é anexado automaticamente pelo interceptor do axiosSetup.js.

/**
 * Faz login no painel de admin e guarda o token de sessão.
 * @param {string} password - A senha digitada pelo usuário.
 */
export const loginAdmin = async (password) => {
  const response = await apiClient.post('/admin/login', { password });
  if (response.data.token) setAdminToken(response.data.token);
  return response.data;
};

/**
 * Encerra a sessão de admin.
 */
export const logoutAdmin = () => clearAdminToken();

/**
 * Busca as estatísticas gerais do admin.
 */
export const getAdminStats = async (period = 'all') => {
  const response = await apiClient.get('/admin/stats', { params: { period } });
  return response.data;
};

/**
 * Busca os logs de cálculos recentes.
 */
export const getAdminLogs = async (period = 'all') => {
    const response = await apiClient.get('/admin/logs', { params: { period } });
    return response.data;
};

/**
 * Busca os dados para gráficos ao longo do tempo.
 */
export const getAdminChartData = async (period = '30d') => {
    const response = await apiClient.get('/admin/stats/over-time', { params: { period } });
    return response.data;
};

/**
 * Cria um novo alimento no sistema.
 */
export const createFood = async (foodData) => {
    const response = await apiClient.post('/admin/foods', foodData);
    return response.data;
};

/**
 * Atualiza um alimento existente.
 */
export const updateFood = async (id, foodData) => {
    const response = await apiClient.put(`/admin/foods/${id}`, foodData);
    return response.data;
};

/**
 * Deleta um alimento existente.
 */
export const deleteFood = async (id) => {
    const response = await apiClient.delete(`/admin/foods/${id}`);
    return response.data;
};
