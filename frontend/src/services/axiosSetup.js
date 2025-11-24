import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL
  ? '/api'
  : 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: baseURL,
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

export default apiClient;
