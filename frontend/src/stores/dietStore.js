import { ref, computed, reactive } from 'vue';
import { defineStore } from 'pinia';
import { getFoods, calculateDiet } from '@/services/apiService';
import { parseApiError } from '@/services/axiosSetup';
import { useCatalogStore } from '@/stores/catalogStore';

/*
 * Store da formulação de dieta (API v1).
 * As regras (máximo de alimentos, duplicados, limites padrão) vêm do catálogo;
 * o resultado (kg, custo, status do balanço) vem pronto do backend.
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

  // Resultados: { calculationId, solution, requirements }
  const dietResults = ref(null);
  const isLoading = ref(false);
  const error = ref(null);
  const notice = ref(null);

  // Controle de Conflitos (Para o Modal de Decisão)
  const showConflictModal = ref(false);
  const conflictData = reactive({
    calculationId: null,
    statusLabel: '',
    options: [],
    requirements: null,
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
      error.value = parseApiError(err, "Falha ao carregar a lista de alimentos.").message;
    } finally {
      isLoading.value = false;
    }
  }

  const ingredientKey = (food) => (food.id ? `food:${food.id}` : `custom:${food.name}`);

  function isSelected(food) {
    return selectedIngredients.value.some((item) => item.key === ingredientKey(food));
  }

  // Adiciona ingrediente à dieta (limites conforme o catálogo da API)
  function addIngredient(food) {
    const rules = useCatalogStore().diet;
    notice.value = null;

    if (selectedIngredients.value.length >= rules.maxIngredients) {
      notice.value = `Máximo de ${rules.maxIngredients} alimentos permitidos.`;
      return;
    }
    if (!rules.allowDuplicates && isSelected(food)) {
      notice.value = "Este alimento já foi adicionado à lista.";
      return;
    }

    const defaults = rules.ingredientDefaults;
    selectedIngredients.value.push({
      key: ingredientKey(food),
      foodId: food.id ?? null,
      custom: food.id ? null : food,
      name: food.name,
      category: food.category,
      percent: 0,
      min: food.defaultMin ?? defaults.min,
      max: food.defaultMax ?? defaults.max,
      price: defaults.price,
    });
  }

  function removeIngredient(index) {
    selectedIngredients.value.splice(index, 1);
  }

  // Aplica a solução escolhida e avança para o resultado
  function applyResult(calculationId, solution, requirements) {
    dietResults.value = { calculationId, solution, requirements };

    // Atualiza a lista visual com as porcentagens calculadas pelo solver
    solution.ingredients.forEach((ing, index) => {
      if (selectedIngredients.value[index]) selectedIngredients.value[index].percent = ing.percent;
    });

    currentStep.value = 5;
  }

  function buildPayload() {
    return {
      animal: animalData.value,
      ingredients: selectedIngredients.value.map(({ foodId, custom, min, max, price }) => {
        const limits = { min: Number(min) || 0, max: Number(max), price: Number(price) || 0 };
        if (foodId) return { foodId, ...limits };
        const { name, category, MS, PB, NDT, FDNcp, Ca, P } = custom;
        return { custom: { name, category, MS, PB, NDT, FDNcp, Ca, P }, ...limits };
      }),
    };
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
    const waitMinimum = async () => {
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minLoadingTime) await sleep(minLoadingTime - elapsedTime);
    };

    try {
      const response = await calculateDiet(buildPayload());
      await waitMinimum();

      if (response.status === 'conflict') {
        // Salva as opções e abre o modal para o usuário decidir
        conflictData.calculationId = response.calculationId;
        conflictData.statusLabel = response.statusLabel;
        conflictData.options = response.options;
        conflictData.requirements = response.requirements;
        showConflictModal.value = true;
      } else {
        applyResult(response.calculationId, response.solution, response.requirements);
      }
    } catch (err) {
      await waitMinimum();
      const parsed = parseApiError(err, "Erro ao calcular a dieta.");
      const details = Object.values(parsed.fields);
      error.value = details.length ? `${parsed.message} ${details.join(' ')}` : parsed.message;
    } finally {
      isLoading.value = false;
    }
  }

  // Ação chamada pelo Modal quando o usuário escolhe uma opção ('ideal' ou 'realistic')
  function finalizeCalculation(choice) {
    const option = conflictData.options.find((o) => o.code === choice);
    applyResult(conflictData.calculationId, option.solution, conflictData.requirements);
    showConflictModal.value = false;
  }

  function resetDiet() {
    currentStep.value = 1;
    selectedIngredients.value = [];
    animalData.value = null;
    dietResults.value = null;
    error.value = null;
    notice.value = null;
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
    notice,
    showConflictModal,
    conflictData,

    // Getters
    totalPercent,

    // Actions
    nextStep,
    prevStep,
    goToStep,
    fetchFoods,
    isSelected,
    addIngredient,
    removeIngredient,
    performDietCalculation,
    finalizeCalculation,
    resetDiet
  };
});
