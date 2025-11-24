<template>
  <div class="container diet-page">
    <header class="page-header">
      <h1>Formulação de Dieta</h1>
      <p>Sistema de otimização de custos e nutrientes.</p>
    </header>

    <DietStepper />

    <div class="step-content">

      <router-view v-slot="{ Component }">
        <KeepAlive>

          <DietIntro v-if="store.currentStep === 1" key="intro" />

          <div v-else-if="store.currentStep === 2" class="step-wrapper form-step" key="animal">
            <div class="step-header">
              <h3>Passo 1: Defina o Animal</h3>
              <p>Informe as características para calcularmos as exigências nutricionais.</p>
            </div>
            <ExigenciasForm :isDietMode="true" @submit-data="handleAnimalData" />
          </div>

          <div v-else-if="store.currentStep === 3" class="step-wrapper food-step" key="foods">
            <div class="step-header">
              <h3>Passo 2: Escolha os Alimentos</h3>
              <p>Selecione os ingredientes disponíveis na sua propriedade ou crie novos.</p>
            </div>

            <div class="selector-container">
               <FoodSelector />
            </div>

            <div class="nav-buttons">
              <button @click="store.prevStep()" class="btn-secondary">Voltar</button>
              <button
                @click="store.nextStep()"
                class="btn-primary"
                :disabled="store.selectedIngredients.length === 0"
              >
                Próximo: Balancear
              </button>
            </div>
          </div>

          <div v-else-if="store.currentStep === 4" class="step-wrapper balance-step" key="balance">
            <div class="step-header">
              <h3>Passo 3: Ajuste Fino</h3>
              <p>Defina preços e limites (mín/máx) para o otimizador.</p>
            </div>

            <DietBalancer />

            <div class="calculation-area">
               <div class="total-bar" :class="totalStatusClass">
                  <span>Soma Atual: <strong>{{ store.totalPercent.toFixed(1) }}%</strong></span>
                  <span v-if="Math.abs(store.totalPercent - 100) > 0.1" class="info-text">
                     (O sistema ajustará automaticamente para 100%)
                  </span>
                  <span v-else class="success-text">✔ Fechado em 100%</span>
               </div>

               <div class="nav-buttons">
                  <button @click="store.prevStep()" class="btn-secondary">Voltar</button>
                  <button @click="store.performDietCalculation" class="btn-calc" :disabled="store.isLoading">
                      Calcular Otimização
                  </button>
               </div>
            </div>
          </div>

          <div v-else-if="store.currentStep === 5" class="step-wrapper results-step" key="results">
            <div class="results-top-bar">
                <h3>Resultado da Otimização</h3>
                <button @click="store.goToStep(4)" class="btn-edit">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                  Editar Parâmetros
                </button>
            </div>

            <DietResultsTable />

            <div class="nav-buttons final-actions">
                 <button @click="store.resetDiet()" class="btn-outline">Iniciar Nova Dieta</button>
            </div>
          </div>

        </KeepAlive>
      </router-view>
    </div>

    <Transition name="fade">
        <LoadingSpinner v-if="store.isLoading" />
    </Transition>

  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useDietStore } from '@/stores/dietStore';

// Importação de todos os componentes modulares
import DietStepper from '@/components/diet/DietStepper.vue';
import DietIntro from '@/components/diet/DietIntro.vue';
import ExigenciasForm from '@/components/calculator/ExigenciasForm.vue';
import FoodSelector from '@/components/diet/FoodSelector.vue';
import DietBalancer from '@/components/diet/DietBalancer.vue';
import DietResultsTable from '@/components/diet/DietResultsTable.vue';
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue';

const store = useDietStore();

// Handler para quando o formulário de exigências é submetido
const handleAnimalData = (data) => {
  store.animalData = data;
  store.fetchFoods(); // Já carrega os alimentos em background
  store.nextStep();   // Avança para a seleção de alimentos
};

const totalStatusClass = computed(() => {
    if (Math.abs(store.totalPercent - 100) < 0.1) return 'status-ok';
    return 'status-info';
});
</script>

<style scoped>
.diet-page { padding: 2rem 0 4rem; max-width: 1000px; margin: 0 auto; }
.page-header { text-align: center; margin-bottom: 2rem; }
.page-header h1 { color: var(--orange); font-size: 2.2rem; margin-bottom: 0.5rem; }
.page-header p { color: var(--black-light); }

/* Container Geral dos Passos */
.step-content {
    min-height: 400px;
    position: relative;
}

.step-wrapper {
    background: var(--white);
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    border: 1px solid var(--grey-light);
    animation: fadeIn 0.4s ease;
}

.step-header { margin-bottom: 2rem; text-align: center; }
.step-header h3 { color: var(--black); font-size: 1.5rem; margin-bottom: 0.5rem; }
.step-header p { color: var(--black-light); }

/* Botões de Navegação */
.nav-buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--grey-light);
}
.final-actions { justify-content: center; }

.btn-primary, .btn-calc {
    background-color: var(--orange);
    color: white;
    padding: 0.8rem 2rem;
    border-radius: 8px;
    font-weight: bold;
    border: none;
    cursor: pointer;
    transition: transform 0.2s;
}
.btn-calc { background-color: var(--blue); width: auto; min-width: 200px;}

.btn-primary:hover { background-color: var(--light-orange); transform: translateY(-2px); }
.btn-calc:hover { background-color: var(--blue-dark); transform: translateY(-2px); }

.btn-primary:disabled, .btn-calc:disabled {
    background-color: var(--grey);
    cursor: not-allowed;
    transform: none;
}

.btn-secondary {
    background-color: transparent;
    color: var(--black-light);
    border: 1px solid var(--grey);
    padding: 0.8rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
}
.btn-secondary:hover { background-color: var(--grey-light); color: var(--black); }

.btn-edit {
    display: flex; align-items: center; gap: 0.5rem;
    background: #fff3e0; color: var(--orange);
    border: 1px solid #ffe0b2; padding: 0.5rem 1rem;
    border-radius: 6px; cursor: pointer; font-weight: 600;
}
.btn-edit svg { width: 18px; height: 18px; }

.btn-outline {
    border: 1px dashed var(--orange);
    color: var(--orange);
    background: transparent;
    padding: 0.8rem 2rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
}

/* Área de Cálculo (Passo 4) */
.calculation-area { margin-top: 2rem; }
.total-bar {
    background: #f9fafb;
    padding: 1rem;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    font-size: 0.95rem;
}
.status-ok { border: 1px solid #c8e6c9; background: #e8f5e9; color: #2e7d32; }
.status-info { border: 1px solid #e3f2fd; background: #f1f8e9; color: #546e7a; }

.results-top-bar {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 1.5rem; border-bottom: 1px solid var(--grey-light); padding-bottom: 1rem;
}
.results-top-bar h3 { margin: 0; color: var(--black); }

/* Transições */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 768px) {
    .nav-buttons { flex-direction: column-reverse; gap: 1rem; }
    .btn-primary, .btn-secondary, .btn-calc { width: 100%; }
    .results-top-bar { flex-direction: column; gap: 1rem; align-items: flex-start; }
}
</style>
