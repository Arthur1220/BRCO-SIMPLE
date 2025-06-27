<template>
  <div class="admin-view container">
    <header class="admin-header">
      <div class="header-content">
        <h1>Painel Administrativo</h1>
        <p>Visão geral do uso do sistema de cálculos.</p>
      </div>
      <button @click="handleLogout" class="logout-button">Sair</button>
    </header>

    <div class="filter-controls">
      <button @click="changeFilter('7d')" :class="{ active: activeFilter === '7d' }">Últimos 7 dias</button>
      <button @click="changeFilter('30d')" :class="{ active: activeFilter === '30d' }">Últimos 30 dias</button>
      <button @click="changeFilter('all')" :class="{ active: activeFilter === 'all' }">Desde o início</button>
    </div>

    <div v-if="isLoading" class="state-container">
      <LoadingSpinner />
    </div>
    <div v-else-if="error" class="state-container">
      <div class="error-box">
        <h3>Ocorreu um erro ao buscar os dados</h3>
        <p>{{ error }}</p>
      </div>
    </div>
    <div v-else-if="stats && logs">
      <AdminDashboard :stats="stats" :logs="logs" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getAdminStats, getAdminLogs } from '@/services/adminService';
import AdminDashboard from '@/components/AdminDashboard.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

const router = useRouter();
const stats = ref(null);
const logs = ref([]);
const isLoading = ref(true);
const error = ref(null);

// Novo estado para controlar o filtro ativo
const activeFilter = ref('all');

const fetchData = async (period) => {
  isLoading.value = true;
  error.value = null;
  try {
    // Busca os dados passando o período do filtro
    const [statsData, logsData] = await Promise.all([
      getAdminStats(period),
      getAdminLogs(period)
    ]);
    stats.value = statsData;
    logs.value = logsData;
  } catch (err) {
    error.value = err.response?.data?.error || err.message;
  } finally {
    isLoading.value = false;
  }
};

// Função chamada pelos botões de filtro
const changeFilter = (newPeriod) => {
  activeFilter.value = newPeriod;
  fetchData(newPeriod);
};

const handleLogout = () => {
  sessionStorage.removeItem('isAdminAuthenticated');
  router.push('/admin-login'); 
};

onMounted(() => {
  // Ao carregar, busca os dados com o filtro padrão ('all')
  fetchData(activeFilter.value);
});
</script>

<style scoped>
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--grey-light);
}
.admin-header h1 { color: var(--orange); font-size: 2.5rem; margin: 0; }
.admin-header p { font-size: 1.2rem; color: var(--black-light); margin: 0; }

.logout-button {
  padding: 0.7rem 1.5rem;
  border: 1px solid var(--grey);
  color: var(--black-light);
  background-color: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}
.logout-button:hover {
  border-color: var(--red-error);
  background-color: var(--red-error);
  color: white;
}

.filter-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 2.5rem;
}
.filter-controls button {
  padding: 0.6rem 1.2rem;
  border: 1px solid var(--grey);
  background-color: var(--white);
  color: var(--black-light);
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.filter-controls button.active {
  background-color: var(--orange);
  color: var(--white);
  border-color: var(--orange);
  font-weight: bold;
}
.filter-controls button:hover:not(.active) {
  border-color: var(--black);
  color: var(--black);
}

.state-container { display: flex; justify-content: center; align-items: center; min-height: 300px; flex-direction: column; }
.error-box { color: var(--red-error); background-color: #fdeaea; border: 1px solid #f9c5c5; padding: 2rem; border-radius: 8px; text-align: center; }
</style>