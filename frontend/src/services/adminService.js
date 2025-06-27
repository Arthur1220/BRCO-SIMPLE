import apiClient from './axiosSetup.js';

const adminApiKey = import.meta.env.VITE_ADMIN_API_KEY;

// Objeto de configuração que adiciona a chave de ADMIN
const adminConfig = {
    headers: { 'x-api-key': adminApiKey }
};

/**
 * Tenta fazer login no painel de admin.
 * @param {string} password - A senha digitada pelo usuário.
 */
export const loginAdmin = async (password) => {
  // A rota de login não precisa de chave, então não passamos o config
  const response = await apiClient.post('/admin/login', { password });
  return response.data;
};

/**
 * Busca as estatísticas gerais do admin.
 */
export const getAdminStats = async (period = 'all') => {
  const response = await apiClient.get(`/admin/stats?period=${period}`, adminConfig);
  return response.data;
};

/**
 * Busca os logs de cálculos recentes.
 */
export const getAdminLogs = async (period = 'all') => {
    const response = await apiClient.get(`/admin/logs?period=${period}`, adminConfig);
    return response.data;
};