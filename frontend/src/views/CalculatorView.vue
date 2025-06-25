<template>
  <div class="container">
    <div class="calculator-wrapper">
      <aside class="sidebar">
        <h2>Cálculos</h2>
        <nav>
          <router-link to="/calcular/exigencias" class="nav-item" active-class="active">Exigências Nutricionais</router-link>
          <router-link to="/calcular/ndt" class="nav-item" active-class="active">Nutrientes Digestíveis Totais (NDT)</router-link>
        </nav>
      </aside>

      <main class="content-area">
        <Transition name="fade" mode="out-in">
          <div :key="viewMode" class="view-container">

            <div v-if="store.isLoading" class="state-container">
              <LoadingSpinner />
            </div>

            <div v-else-if="store.error" class="state-container">
              <div class="error-message">
                <h3>Ocorreu um Erro</h3>
                <p>{{ store.error }}</p>
                <button @click="returnToForm" class="btn-return">Tentar Novamente</button>
              </div>
            </div>

            <div v-else-if="viewMode === 'form'">
              <div v-if="type === 'exigencias'">
                <div class="info-header">
                  <h1>Calcular Exigências</h1>
                  <p>Utilize esta ferramenta para determinar as exigências nutricionais específicas de ovinos e caprinos.</p>
                </div>
                <ExigenciasForm />
              </div>
              <div v-if="type === 'ndt'">
                <div class="info-header">
                  <h1>Calcular NDT</h1>
                  <p>O NDT é um parâmetro para expressar a energia de um alimento. É a soma de todos os nutrientes orgânicos digestíveis.</p>
                </div>
                <NDTForm />
              </div>
            </div>

            <div v-else-if="viewMode === 'results'">
              <div class="results-container">
                <button @click="returnToForm" class="return-button" title="Fazer novo cálculo">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  <span>Novo Cálculo</span>
                </button>
                <ResultsDisplay />
              </div>
            </div>
            
          </div>
        </Transition>
        </main>
    </div>
  </div>
</template>

<script setup>
// Imports do Vue e de bibliotecas
import { ref, watch, onUnmounted } from 'vue';
import { useCalculationStore } from '@/stores/calculationStore';

// Imports dos Componentes
import ExigenciasForm from '@/components/ExigenciasForm.vue';
import NDTForm from '@/components/NDTForm.vue';
import ResultsDisplay from '@/components/ResultsDisplay.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

// Pega acesso ao store do Pinia
const store = useCalculationStore();

const props = defineProps({
  type: {
    type: String,
    required: true
  }
});

const viewMode = ref('form');

watch(() => store.results, (newResults) => {
  if (newResults) {
    viewMode.value = 'results';
  }
});

watch(() => props.type, () => {
  store.clearCalculationState();
  viewMode.value = 'form';
});

function returnToForm() {
  store.clearCalculationState();
  viewMode.value = 'form';
}

onUnmounted(() => {
  store.clearCalculationState();
});
</script>

<style scoped>
.calculator-wrapper {
  display: flex;
  gap: 3rem;
  align-items: flex-start;
}
.sidebar {
  width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: 100px;
}
.sidebar h2 {
  font-size: 1.5rem;
  color: var(--black);
  margin-top: 0;
  border-bottom: 2px solid var(--grey-light);
  padding-bottom: 1rem;
}
.sidebar .nav-item {
  display: block;
  padding: 0.8rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  text-decoration: none;
  color: var(--black-light);
  font-weight: 500;
  transition: all 0.3s ease;
}
.sidebar .nav-item:hover {
  background-color: var(--grey-light);
  color: var(--black);
}
.sidebar .nav-item.active {
  background-color: var(--orange);
  color: var(--white);
  font-weight: bold;
}
.content-area {
  flex-grow: 1;
  min-width: 0;
}
.info-header {
  margin-bottom: 2rem;
}
.info-header h1 {
  color: var(--orange);
  margin-top: 0;
}
.state-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
.error-message {
  padding: 2rem;
  text-align: center;
  border: 1px solid var(--red-error);
  background-color: #fbecec;
  color: #a82323;
  border-radius: 8px;
}
.btn-return {
    padding: 0.8rem 1.5rem;
    border-radius: 8px;
    border: none;
    background-color: var(--orange);
    color: var(--white);
    font-weight: bold;
    cursor: pointer;
    margin-top: 1rem;
}

/* Animação de Fade (agora aplicada ao container da view) */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease; /* Tempo de transição ajustado */
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Estilos para o novo botão de retorno */
.results-container {
  position: relative;
  /* Adiciona um padding no topo para dar espaço ao botão */
  padding-top: 1rem; 
}
.return-button {
  position: absolute;
  top: 0;
  left: 0;
  background: transparent;
  color: var(--black-light);
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem 0.5rem 0.75rem; /* Mais padding na direita */
  cursor: pointer;
  display: inline-flex; /* Alinha o ícone e o texto */
  align-items: center;
  gap: 0.5rem; /* Espaço entre o ícone e o texto */
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
}
.return-button:hover {
  background-color: var(--grey-light);
  color: var(--black);
}
.return-button svg {
  width: 20px;
  height: 20px;
  transition: transform 0.3s ease;
}
.return-button:hover svg {
  transform: translateX(-3px); /* Efeito de movimento na seta */
}

/* Responsividade */
@media (max-width: 992px) {
  .calculator-wrapper { flex-direction: column; gap: 1rem; }
  .sidebar {
    width: 100%;
    position: static;
    border-bottom: 2px solid var(--grey-light);
    padding-bottom: 1rem;
    margin-bottom: 2rem;
  }
  .sidebar nav { display: flex; overflow-x: auto; gap: 1rem; }
  .sidebar .nav-item { flex-shrink: 0; }
  
  .results-container { padding-top: 0; }
  .return-button {
      position: static;
      margin-bottom: 2rem;
      background-color: var(--grey-light);
  }
}
</style>