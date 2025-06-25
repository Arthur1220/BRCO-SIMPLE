import axios from 'axios';

// 1. Cria uma instância customizada do Axios
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// 2. Adiciona um "interceptor" de resposta
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Erro na resposta da API:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// 3. Exporta a instância configurada para ser usada em outros lugares
export default apiClient;