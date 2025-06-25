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
        <div v-if="type === 'exigencias'">
          <div class="info-header">
            <h1>Calcular Exigências</h1>
            <p>Utilize esta ferramenta para determinar as exigências nutricionais específicas de ovinos e caprinos. Preencha os dados e obtenha resultados personalizados.</p>
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
      </main>
    </div>
  </div>
</template>

<script setup>
import ExigenciasForm from '@/components/ExigenciasForm.vue';
import NDTForm from '@/components/NDTForm.vue';

// A prop 'type' é passada automaticamente pelo Vue Router
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
  gap: 2rem;
  align-items: flex-start;
}
.sidebar {
  width: 250px;
  flex-shrink: 0;
  border-right: 1px solid var(--grey-light);
  padding-right: 2rem;
}
.sidebar h2 {
  font-size: 1.5rem;
  color: var(--black);
  margin-top: 0;
}
.sidebar .nav-item {
  display: block;
  padding: 0.8rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  text-decoration: none;
  color: var(--black-light);
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
}
.info-header {
  margin-bottom: 2rem;
}
.info-header h1 {
  color: var(--orange);
  margin-top: 0;
}
@media (max-width: 768px) {
  .calculator-wrapper {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--grey-light);
    padding-right: 0;
    padding-bottom: 1rem;
    margin-bottom: 2rem;
  }
  .sidebar nav {
    display: flex;
    gap: 1rem;
  }
}
</style>