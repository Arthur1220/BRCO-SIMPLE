// src/stores/calculationStore.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { calculateRequirements, calculateNdt } from '@/services/apiService'

export const useCalculationStore = defineStore('calculation', () => {
  // STATE
  const results = ref(null)
  const calculationType = ref(null) // <-- ADICIONADO
  const isLoading = ref(false)
  const error = ref(null)

  // ACTIONS
  async function performCalculation(type, formData) {
    isLoading.value = true
    error.value = null
    results.value = null

    try {
      let response;
      if (type === 'requirements') {
        response = await calculateRequirements(formData)
      } else if (type === 'ndt') {
        response = await calculateNdt(formData)
      } else {
        throw new Error('Tipo de cálculo desconhecido')
      }
      results.value = response;
      calculationType.value = type; // <-- ADICIONADO: Salva o tipo do cálculo
    } catch (err) {
      error.value = err.response?.data?.error || err.message || 'Ocorreu um erro desconhecido.';
    } finally {
      isLoading.value = false
    }
  }

  return { results, calculationType, isLoading, error, performCalculation }
})