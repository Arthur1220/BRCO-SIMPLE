import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { getFoods, calculateDiet } from '@/services/apiService';

export const useDietStore = defineStore('diet', () => {
  // --- STATE ---

  // Controle do Passo a Passo (Wizard)
  // 1: Introdução, 2: Dados do Animal, 3: Seleção de Alimentos, 4: Balanceamento, 5: Resultados
  const currentStep = ref(1);
  const totalSteps = 5;

  // Dados
  const availableFoods = ref([]);
  const selectedIngredients = ref([]);
  const animalData = ref(null);
  const dietResults = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  // --- GETTERS ---
  const totalPercent = computed(() => {
    return selectedIngredients.value.reduce((sum, item) => sum + (Number(item.percent) || 0), 0);
  });

  // --- ACTIONS ---

  // Navegação
  function nextStep() {
    if (currentStep.value < totalSteps) currentStep.value++;
  }

  function prevStep() {
    if (currentStep.value > 1) currentStep.value--;
  }

  function goToStep(step) {
      // Validação básica para não pular etapas sem dados
      if (step > 2 && !animalData.value) return;
      if (step > 3 && selectedIngredients.value.length === 0) return;
      currentStep.value = step;
  }

  // Busca alimentos
  async function fetchFoods() {
    // Só busca se ainda não tiver buscado
    if (availableFoods.value.length > 0) return;

    isLoading.value = true;
    try {
      availableFoods.value = await getFoods();
    } catch (err) {
      console.error("Erro ao buscar alimentos:", err);
    } finally {
      isLoading.value = false;
    }
  }

  function addIngredient(food) {
    if (selectedIngredients.value.length >= 10) {
      alert("Máximo de 10 alimentos permitidos.");
      return;
    }
    selectedIngredients.value.push({
      ...food,
      percent: 0,
      min: 0,
      max: 100,
      isCustom: !food.id,
      price: 0 // Inicializa preço zerado
    });
  }

  function removeIngredient(index) {
    selectedIngredients.value.splice(index, 1);
  }

  // Cálculo Final
  async function performDietCalculation() {
    if (!animalData.value) return;

    isLoading.value = true;
    error.value = null;
    dietResults.value = null;

    try {
      const payload = {
        animalData: animalData.value,
        ingredients: selectedIngredients.value
      };

      const response = await calculateDiet(payload);

      if (response.optimizedIngredients) {
          selectedIngredients.value = response.optimizedIngredients;
      }

      dietResults.value = response;

      // Sucesso! Vai para a tela de resultados
      currentStep.value = 5;

    } catch (err) {
      console.error("Erro no cálculo:", err);
      error.value = err.response?.data?.error || "Erro ao calcular a dieta.";
    } finally {
      isLoading.value = false;
    }
  }

  function resetDiet() {
    currentStep.value = 1;
    selectedIngredients.value = [];
    animalData.value = null;
    dietResults.value = null;
    error.value = null;
  }

  return {
    currentStep,
    totalSteps,
    availableFoods,
    selectedIngredients,
    animalData,
    dietResults,
    isLoading,
    error,
    totalPercent,
    nextStep,
    prevStep,
    goToStep,
    fetchFoods,
    addIngredient,
    removeIngredient,
    performDietCalculation,
    resetDiet
  };
});
