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

      <div class="content-area">
        <section class="form-section">
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
        </section>

        <section class="results-section">
            <LoadingSpinner v-if="store.isLoading" />
            <div v-if="store.error" class="error-message">
              <h3>Ocorreu um Erro</h3>
              <p>{{ store.error }}</p>
            </div>
            <ResultsDisplay v-if="store.results" />
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import ExigenciasForm from '@/components/ExigenciasForm.vue';
import NDTForm from '@/components/NDTForm.vue';
import ResultsDisplay from '@/components/ResultsDisplay.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import { useCalculationStore } from '@/stores/calculationStore';

const store = useCalculationStore();

defineProps({
  type: {
    type: String,
    required: true
  }
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
  top: 100px; /* Distância do topo da página */
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
.results-section {
  margin-top: 2rem;
}
.error-message {
  margin-top: 2rem;
  padding: 1.5rem;
  border: 1px solid var(--red-error);
  background-color: #fbecec;
  color: #a82323;
  border-radius: 8px;
}

@media (max-width: 992px) {
  .calculator-wrapper {
    flex-direction: column;
    gap: 1rem;
  }
  .sidebar {
    width: 100%;
    position: static;
    border-bottom: 2px solid var(--grey-light);
    padding-bottom: 1rem;
    margin-bottom: 2rem;
  }
  .sidebar nav {
    display: flex;
    overflow-x: auto;
    gap: 1rem;
  }
  .sidebar .nav-item {
    flex-shrink: 0;
  }
}
</style>