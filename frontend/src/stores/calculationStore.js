import { ref } from 'vue'
import { defineStore } from 'pinia'
import { calculateRequirements, calculateNdt } from '@/services/apiService'

/*
 * Store para gerenciar o estado dos cálculos.
 * Inclui resultados, tipo de cálculo, estado de carregamento, erros e dados do formulário.
 */
export const useCalculationStore = defineStore('calculation', () => {
  const results = ref(null)
  const calculationType = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const lastFormData = ref(null)

  // Função auxiliar para criar um delay (pausa)
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  async function performCalculation(type, formData) {
    isLoading.value = true
    error.value = null
    results.value = null

    const minLoadingTime = 2000;
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

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minLoadingTime) {
        await sleep(minLoadingTime - elapsedTime);
      }

      results.value = response;
      calculationType.value = type;

    } catch (err) {
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minLoadingTime) {
        await sleep(minLoadingTime - elapsedTime);
      }
      error.value = err.response?.data?.error || err.message || 'Ocorreu um erro desconhecido.';
      lastFormData.value = null;
    } finally {
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
