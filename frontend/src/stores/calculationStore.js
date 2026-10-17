import { ref } from 'vue'
import { defineStore } from 'pinia'
import { calculateRequirements, calculateNdt } from '@/services/apiService'
import { parseApiError } from '@/services/axiosSetup'

/*
 * Store para gerenciar o estado dos cálculos (exigências e NDT).
 * `results` é a resposta da API v1: { calculationId, highlights, groups, ... }.
 */
export const useCalculationStore = defineStore('calculation', () => {
  const results = ref(null)
  const calculationType = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const fieldErrors = ref({})
  const lastFormData = ref(null)
  // Tipo do último formulário enviado (para restaurar os dados após erro ou ao voltar)
  const lastFormType = ref(null)

  // Função auxiliar para criar um delay (pausa)
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const calculators = {
    requirements: calculateRequirements,
    ndt: calculateNdt,
  };

  async function performCalculation(type, formData) {
    isLoading.value = true
    error.value = null
    fieldErrors.value = {}
    results.value = null
    lastFormData.value = formData;
    lastFormType.value = type;

    const minLoadingTime = 2000;
    const startTime = Date.now();
    const waitMinimum = async () => {
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minLoadingTime) await sleep(minLoadingTime - elapsedTime);
    };

    try {
      const response = await calculators[type](formData);
      await waitMinimum();
      results.value = response;
      calculationType.value = type;
    } catch (err) {
      await waitMinimum();
      const parsed = parseApiError(err);
      // Erros de campo voltam para o formulário; outros erros vão para a tela de erro.
      if (Object.keys(parsed.fields).length > 0) {
        fieldErrors.value = parsed.fields;
      } else {
        error.value = parsed.message;
      }
    } finally {
      isLoading.value = false
    }
  }

  function clearCalculationState() {
    results.value = null;
    calculationType.value = null;
    error.value = null;
    fieldErrors.value = {};
    lastFormData.value = null;
    lastFormType.value = null;
  }

  return {
    results,
    calculationType,
    isLoading,
    error,
    fieldErrors,
    lastFormData,
    lastFormType,
    performCalculation,
    clearCalculationState
  }
})
