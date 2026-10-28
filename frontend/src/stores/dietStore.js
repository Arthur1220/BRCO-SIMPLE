import { ref, computed, reactive, watch } from 'vue';
import { defineStore } from 'pinia';
import { getFoods, calculateDiet, getCalculation } from '@/services/apiService';
import { parseApiError } from '@/services/axiosSetup';
import { useCatalogStore } from '@/stores/catalogStore';
import { locale, t } from '@/i18n';

/*
 * Store da formulação de dieta (API v1).
 * As regras (máximo de alimentos, duplicados, limites padrão) vêm do catálogo;
 * o resultado (kg, custo, status do balanço) vem pronto do backend.
 */
export const useDietStore = defineStore('diet', () => {

  // --- STATE (Estado) ---
  const currentStep = ref(1);
  const totalSteps = 5;

  // Dados Principais
  const availableFoods = ref([]);
  const selectedIngredients = ref([]);
  const animalData = ref(null);
  // Base do preço (kg de matéria natural ou de MS) e lote para o trato.
  const priceBasis = ref('MN');
  const lot = reactive({ animals: 1, feedingsPerDay: 2 });

  // Resultados: { calculationId, option, solution, requirements } (option: escolha no conflito)
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
      error.value = parseApiError(err, t('errors.foods')).message;
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
      notice.value = t('diet.maxIngredients', { max: rules.maxIngredients });
      return;
    }
    if (!rules.allowDuplicates && isSelected(food)) {
      notice.value = t('diet.duplicateIngredient');
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
  function applyResult(calculationId, solution, requirements, option = null) {
    dietResults.value = { calculationId, option, solution, requirements };

    // Atualiza a lista visual com as porcentagens calculadas pelo solver
    solution.ingredients.forEach((ing, index) => {
      if (selectedIngredients.value[index]) selectedIngredients.value[index].percent = ing.percent;
    });

    currentStep.value = 5;
  }

  function buildPayload() {
    return {
      animal: animalData.value,
      priceBasis: priceBasis.value,
      lot: { animals: Number(lot.animals) || 1, feedingsPerDay: Number(lot.feedingsPerDay) || 1 },
      ingredients: selectedIngredients.value.map(({ foodId, custom, min, max, price }) => {
        // Campos vazios não são enviados: a API usa o padrão do alimento (ou do catálogo).
        const limits = Object.fromEntries(
          Object.entries({ min, max, price }).filter(([, value]) => value !== '' && value !== null && value !== undefined)
        );
        if (foodId) return { foodId, ...limits };
        const { name, category, MS, PB, NDT, FDNcp, Ca, P } = custom;
        // Dados opcionais das travas de segurança: só vão quando informados.
        const safety = Object.fromEntries(
          ['EE', 'CNF', 'NNP', 'Cu', 'Mo', 'S']
            .filter((field) => custom[field] !== '' && custom[field] !== null && custom[field] !== undefined)
            .map((field) => [field, Number(custom[field])])
        );
        return { custom: { name, category, MS, PB, NDT, FDNcp, Ca, P, ...safety }, ...limits };
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

    try {
      const response = await calculateDiet(buildPayload());

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
      const parsed = parseApiError(err, t('errors.diet'));
      const details = Object.values(parsed.fields);
      error.value = details.length ? `${parsed.message} ${details.join(' ')}` : parsed.message;
    } finally {
      isLoading.value = false;
    }
  }

  // Ação chamada pelo Modal quando o usuário escolhe uma opção ('ideal' ou 'realistic')
  function finalizeCalculation(choice) {
    const option = conflictData.options.find((o) => o.code === choice);
    applyResult(conflictData.calculationId, option.solution, conflictData.requirements, choice);
    showConflictModal.value = false;
  }

  // Fecha o modal sem escolher: o usuário volta para ajustar os alimentos.
  function closeConflict() {
    showConflictModal.value = false;
  }

  // Ao trocar o idioma, busca o cálculo salvo de novo para receber os textos traduzidos
  // (labels do balanço, status e opções do conflito). Os números não mudam.
  watch(locale, async () => {
    const id = showConflictModal.value ? conflictData.calculationId : dietResults.value?.calculationId;
    if (!id) return;
    try {
      const response = await getCalculation(id);
      if (showConflictModal.value && conflictData.calculationId === id) {
        conflictData.statusLabel = response.statusLabel;
        conflictData.options = response.options;
        conflictData.requirements = response.requirements;
      } else if (dietResults.value?.calculationId === id) {
        const { option } = dietResults.value;
        const solution = option ? response.options.find((o) => o.code === option).solution : response.solution;
        dietResults.value = { calculationId: id, option, solution, requirements: response.requirements };
      }
    } catch {
      // Mantém o resultado no idioma anterior.
    }
  });

  function resetDiet() {
    currentStep.value = 1;
    selectedIngredients.value = [];
    animalData.value = null;
    priceBasis.value = 'MN';
    Object.assign(lot, { animals: 1, feedingsPerDay: 2 });
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
    priceBasis,
    lot,
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
    closeConflict,
    resetDiet
  };
});
