import { ref, computed, reactive } from 'vue';
import { defineStore } from 'pinia';
import { getFoods, calculateDiet } from '@/services/apiService';

/*
 * Store para gerenciar o estado da criação e cálculo de dietas.
 * Inclui etapas do formulário, dados dos alimentos, dados do animal, resultados, estado de carregamento, erros e controle de conflitos.
 */
export const useDietStore = defineStore('diet', () => {

  // Função auxiliar para criar um delay (pausa)
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // --- STATE (Estado) ---
  const currentStep = ref(1);
  const totalSteps = 5;

  // Dados Principais
  const availableFoods = ref([]);
  const selectedIngredients = ref([]);
  const animalData = ref(null);

  // Resultados
  const dietResults = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  // Controle de Conflitos (Para o Modal de Decisão)
  const showConflictModal = ref(false);
  const conflictData = reactive({
    resultIdeal: null,
    resultRealistic: null
  });

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

  // Busca a lista de alimentos do backend
  async function fetchFoods() {
    if (availableFoods.value.length > 0) return;

    isLoading.value = true;
    try {
      availableFoods.value = await getFoods();
    } catch (err) {
      console.error("Erro ao buscar alimentos:", err);
      error.value = "Falha ao carregar a lista de alimentos.";
    } finally {
      isLoading.value = false;
    }
  }

  // Adiciona ingrediente à dieta
  function addIngredient(food) {
    if (selectedIngredients.value.length >= 10) {
      alert("Máximo de 10 alimentos permitidos.");
      return;
    }

    // Evita duplicatas de alimentos do banco (opcional, remova se quiser permitir repetidos)
    if (food.id && selectedIngredients.value.some(i => i.id === food.id)) {
        alert("Este alimento já foi adicionado à lista.");
        return;
    }

    selectedIngredients.value.push({
      ...food,
      percent: 0,
      min: 0,
      max: 100,
      isCustom: !food.id,
      price: 0
    });
  }

  function removeIngredient(index) {
    selectedIngredients.value.splice(index, 1);
  }

  // Função interna para aplicar o resultado e avançar
  function applyResult(resultData) {
    dietResults.value = resultData;

    // Atualiza a lista visual com as porcentagens calculadas pelo solver
    if (resultData.optimizedIngredients) {
        selectedIngredients.value = resultData.optimizedIngredients;
    }

    // Sucesso! Vai para a tela de resultados
    currentStep.value = 5;
  }

  // CÁLCULO PRINCIPAL
  async function performDietCalculation() {
    if (!animalData.value) return;

    isLoading.value = true;
    error.value = null;
    dietResults.value = null;
    showConflictModal.value = false;

    // Tempo mínimo de loading para melhor UX
    const minLoadingTime = 2000;
    const startTime = Date.now();

    try {
      const payload = {
        animalData: animalData.value,
        ingredients: selectedIngredients.value
      };

      const response = await calculateDiet(payload);

      // Verifica se o backend retornou um conflito (duas opções de resultado)
      if (response.hasConflict) {
        // Salva as opções e abre o modal para o usuário decidir
        conflictData.resultIdeal = response.resultIdeal;
        conflictData.resultRealistic = response.resultRealistic;
        showConflictModal.value = true;
        // NÃO avança o passo aqui, espera a escolha
      } else {
        applyResult(response.result || response);
      }

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minLoadingTime) {
        await sleep(minLoadingTime - elapsedTime);
      }

    } catch (err) {
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minLoadingTime) {
        await sleep(minLoadingTime - elapsedTime);
      }

      console.error("Erro no cálculo:", err);
      error.value = err.response?.data?.error || "Erro ao calcular a dieta.";
    } finally {
      isLoading.value = false;
    }
  }

  // Ação chamada pelo Modal quando o usuário escolhe uma opção ('ideal' ou 'realistic')
  function finalizeCalculation(choice) {
    const finalResult = choice === 'ideal'
      ? conflictData.resultIdeal
      : conflictData.resultRealistic;

    applyResult(finalResult);
    showConflictModal.value = false; // Fecha o modal
  }

  function resetDiet() {
    currentStep.value = 1;
    selectedIngredients.value = [];
    animalData.value = null;
    dietResults.value = null;
    error.value = null;
    showConflictModal.value = false;
  }

  return {
    // State
    currentStep,
    totalSteps,
    availableFoods,
    selectedIngredients,
    animalData,
    dietResults,
    isLoading,
    error,
    showConflictModal,
    conflictData,

    // Getters
    totalPercent,

    // Actions
    nextStep,
    prevStep,
    goToStep,
    fetchFoods,
    addIngredient,
    removeIngredient,
    performDietCalculation,
    finalizeCalculation,
    resetDiet
  };
});
