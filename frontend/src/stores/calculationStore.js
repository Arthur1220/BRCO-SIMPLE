import { ref } from 'vue'
import { defineStore } from 'pinia'
import { calculateRequirements, calculateNdt } from '@/services/apiService'

export const useCalculationStore = defineStore('calculation', () => {
  const results = ref(null)
  const calculationType = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const lastFormData = ref(null)

  // Função auxiliar para criar um delay (pausa)
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // ACTIONS (com a nova lógica de tempo)
  async function performCalculation(type, formData) {
    isLoading.value = true
    error.value = null
    results.value = null

    // Define o tempo mínimo em milissegundos e inicia o cronômetro
    const minLoadingTime = 2000; // <-- CONTROLE AQUI! 1000ms = 1 segundo
    const startTime = Date.now();

    try {
      let response;
      if (type === 'requirements') {
        lastFormData.value = formData; 
        response = await calculateRequirements(formData)
      } else if (type === 'ndt') {
        lastFormData.value = formData; 
        response = await calculateNdt(formData)
      } else {
        throw new Error('Tipo de cálculo desconhecido')
      }

      // Lógica que força a espera do tempo mínimo
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minLoadingTime) {
        await sleep(minLoadingTime - elapsedTime);
      }

      results.value = response;
      calculationType.value = type;

    } catch (err) {
      // Lógica de tempo também aplicada no bloco de erro
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minLoadingTime) {
        await sleep(minLoadingTime - elapsedTime);
      }
      error.value = err.response?.data?.error || err.message || 'Ocorreu um erro desconhecido.';
      lastFormData.value = null;
    } finally {
      // Esta linha só será executada após o tempo mínimo ter passado
      isLoading.value = false
    }
  }

    function clearCalculationState() {
    results.value = null;
    calculationType.value = null;
    error.value = null;
    lastFormData.value = null;
  }

  return { 
    results, 
    calculationType, 
    isLoading, 
    error, 
    lastFormData,
    performCalculation, 
    clearCalculationState
  }
})