import axios from 'axios';

// Configura a URL base da nossa API.
// Em desenvolvimento, vai usar o proxy do Vite. Em produção, a variável de ambiente.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Função para chamar o cálculo de exigências
export const calculateRequirements = async (data) => {
  const response = await apiClient.post('/calculate/requirements', data);
  return response.data;
};

// Função para chamar o cálculo de NDT
export const calculateNdt = async (data) => {
  const response = await apiClient.post('/calculate/ndt', data);
  return response.data;
};

// Função para gerar o PDF
export const generatePdf = async (data) => {
    const response = await apiClient.post('/generate-pdf', data, {
        responseType: 'blob', // Importante para receber o arquivo
    });
    return response.data;
};