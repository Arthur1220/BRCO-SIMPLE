import axios from 'axios';

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
  const token = getAdminToken();
  if (token && config.url?.startsWith('/admin')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const errorInterceptor = (error) => {
    // Sessão de admin expirada ou inválida: descarta o token
    if (error.response?.status === 401 && error.config?.url?.startsWith('/admin')) {
      clearAdminToken();
    }
    console.error('Erro na resposta da API:', error.response?.data || error.message);
    return Promise.reject(error);
};

apiClient.interceptors.response.use(response => response, errorInterceptor);

export default apiClient;
