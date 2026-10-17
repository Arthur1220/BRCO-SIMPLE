import axios from 'axios';
import { locale, t } from '@/i18n';

const ADMIN_TOKEN_KEY = 'brcoAdminToken';

// A API é sempre servida em /api no mesmo domínio:
// proxy do Vite (dev), nginx (Docker local) ou proxy do Netlify (produção).
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

export const getAdminToken = () => sessionStorage.getItem(ADMIN_TOKEN_KEY);
export const setAdminToken = (token) => sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
export const clearAdminToken = () => sessionStorage.removeItem(ADMIN_TOKEN_KEY);

const isAdminUrl = (url = '') => url.startsWith('/v1/admin') || url.startsWith('/admin');

/**
 * Indica se existe um token de admin ainda dentro da validade.
 * (A validação real é feita pelo backend; isto só evita mostrar o painel com sessão expirada.)
 */
export const hasValidAdminToken = () => {
  const token = getAdminToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

// Envia o token de sessão em todas as rotas administrativas
apiClient.interceptors.request.use((config) => {
  // Idioma pedido à API (textos, labels e mensagens de erro vêm do backend).
  // Segue o idioma da interface, salvo quando a chamada já fixou um.
  if (!config.headers['Accept-Language']) config.headers['Accept-Language'] = locale.value;
  const token = getAdminToken();
  if (token && isAdminUrl(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const errorInterceptor = (error) => {
    // Sessão de admin expirada ou inválida: descarta o token
    if (error.response?.status === 401 && isAdminUrl(error.config?.url)) {
      clearAdminToken();
    }
    console.error('Erro na resposta da API:', error.response?.data || error.message);
    return Promise.reject(error);
};

apiClient.interceptors.response.use(response => response, errorInterceptor);

/**
 * Extrai o erro no formato da API v1: { message, fields: { caminho: mensagem } }.
 * As mensagens já vêm prontas (e traduzidas) do backend.
 */
export const parseApiError = (error, fallback = t('errors.unexpected')) => {
  const apiError = error?.response?.data?.error;
  if (apiError && typeof apiError === 'object') {
    const fields = {};
    for (const field of apiError.fields || []) {
      if (!fields[field.path]) fields[field.path] = field.message;
    }
    return { message: apiError.message || fallback, fields };
  }
  return { message: typeof apiError === 'string' ? apiError : (error?.message || fallback), fields: {} };
};

export default apiClient;
