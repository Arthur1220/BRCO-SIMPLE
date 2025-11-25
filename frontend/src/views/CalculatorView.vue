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
                  <span>Editar Dados</span>
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
import { ref, watch, onUnmounted } from 'vue';
import { useCalculationStore } from '@/stores/calculationStore';

import ExigenciasForm from '@/components/calculator/ExigenciasForm.vue';
import NDTForm from '@/components/calculator/NDTForm.vue';
import ResultsDisplay from '@/components/calculator/ResultsDisplay.vue';
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue';

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
  viewMode.value = 'form';
}

onUnmounted(() => {
  store.clearCalculationState();
});
</script>

<style scoped>
/* =========================================
   1. Containers & Layout Principal
   ========================================= */
.container {
  width: 100%;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

.calculator-wrapper {
  display: flex;
  gap: 3rem;
  align-items: flex-start; /* Garante que a sidebar não estique se o conteúdo for longo */
}

.content-area {
  flex-grow: 1;
  min-width: 0; /* Previne que flex items estourem o container em alguns browsers */
}

/* =========================================
   2. Barra Lateral (Sidebar Navigation)
   ========================================= */
.sidebar {
  width: 280px;
  flex-shrink: 0; /* Impede que a sidebar encolha */

  /* Comportamento Sticky (fixo ao rolar) */
  position: sticky;
  top: 100px; /* Ajuste conforme altura do seu header fixo */
}

.sidebar h2 {
  font-size: 1.5rem;
  color: var(--black);
  margin-top: 0;
  border-bottom: 2px solid var(--grey-light);
  padding-bottom: 1rem;
}

/* Links de Navegação */
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

/* =========================================
   3. Cabeçalhos e Conteúdo
   ========================================= */
.info-header {
  margin-bottom: 2rem;
}

.info-header h1 {
  color: var(--orange);
  margin-top: 0;
}

/* =========================================
   4. Botão "Voltar" (Com Ícone)
   ========================================= */
.results-container {
  position: relative;
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
  padding: 0.5rem 1rem 0.5rem 0.75rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.return-button:hover {
  background-color: var(--grey-light);
  color: var(--black);
}

/* Animação da setinha do botão voltar */
.return-button svg {
  width: 20px;
  height: 20px;
  transition: transform 0.3s ease;
}

.return-button:hover svg {
  transform: translateX(-3px); /* Move levemente para a esquerda */
}

/* =========================================
   5. Estados de Feedback (Erro/Loading)
   ========================================= */
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

/* =========================================
   6. Transições Vue (Fade)
   ========================================= */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* =========================================
   7. Responsividade (Mobile: < 992px)
   ========================================= */
@media (max-width: 992px) {
  /* Altera layout lateral para coluna única */
  .calculator-wrapper {
    flex-direction: column;
    gap: 1rem;
  }

  /* Transforma a sidebar em barra horizontal */
  .sidebar {
    width: 100%;
    position: static; /* Remove o sticky no mobile */
    border-bottom: 2px solid var(--grey-light);
    padding-bottom: 1rem;
    margin-bottom: 2rem;
  }

  /* Cria scroll horizontal para os itens de menu */
  .sidebar nav {
    display: flex;
    overflow-x: auto;
    gap: 1rem;
  }

  .sidebar .nav-item {
    flex-shrink: 0; /* Garante que os itens não encolham no scroll */
  }

  /* Ajustes do botão voltar no mobile */
  .results-container {
    padding-top: 0;
  }

  .return-button {
    position: static; /* Remove posicionamento absoluto */
    margin-bottom: 2rem;
    background-color: var(--grey-light); /* Dá fundo cinza para destacar mais */
  }
}
</style>
