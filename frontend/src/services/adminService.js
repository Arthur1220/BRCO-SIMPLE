import apiClient, { setAdminToken, clearAdminToken } from './axiosSetup.js';

// O token de sessão é anexado automaticamente pelo interceptor do axiosSetup.js.

/**
 * Faz login no painel de admin e guarda o token de sessão.
 * @param {string} password - A senha digitada pelo usuário.
 * @param {string} name - Quem está entrando (aparece no histórico de alterações dos alimentos).
 */
export const loginAdmin = async (password, name) => {
  const response = await apiClient.post('/v1/admin/login', { password, name });
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

/**
 * Avisos de consistência de um alimento ainda não salvo (composição, PDR/PNDR, Ca e P...).
 */
export const checkFood = async (foodData) => {
  const response = await apiClient.post('/v1/admin/foods/check', foodData);
  return response.data.quality;
};

/**
 * Avisos de consistência de todos os alimentos: [{ id, name, quality }].
 */
export const getFoodsQuality = async () => {
  const response = await apiClient.get('/v1/admin/foods/quality');
  return response.data;
};

/**
 * Histórico de alterações de um alimento (mais recente primeiro).
 */
export const getFoodHistory = async (id) => {
  const response = await apiClient.get(`/v1/admin/foods/${id}/history`);
  return response.data;
};

/**
 * Últimas alterações do cadastro de alimentos.
 */
export const getRecentHistory = async () => {
  const response = await apiClient.get('/v1/admin/history');
  return response.data;
};
