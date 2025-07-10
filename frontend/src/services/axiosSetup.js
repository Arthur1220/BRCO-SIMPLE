import axios from 'axios';

// Agora, o apiClient é apenas uma instância limpa, sem nenhum header de API Key.
const apiClient = axios.create({
  //baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000', // Aponta para a raiz da URL
  baseURL: '/api', // Aponta para a raiz da URL
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

const errorInterceptor = (error) => {
    console.error('Erro na resposta da API:', error.response?.data || error.message);
    return Promise.reject(error);
};

apiClient.interceptors.response.use(response => response, errorInterceptor);

// Exportamos apenas uma instância genérica
export default apiClient;