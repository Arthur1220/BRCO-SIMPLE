<template>
  <div class="admin-view container">
    <header class="admin-header">
      <div class="header-content">
        <h1 v-if="isAuthenticated">Painel Administrativo</h1>
        <p v-if="isAuthenticated">Visão geral do uso do sistema de cálculos.</p>
      </div>
      <button v-if="isAuthenticated" @click="handleLogout" class="logout-button">Sair</button>
    </header>

    <AdminLogin v-if="!isAuthenticated" @login-success="handleLoginSuccess" />

    <div v-else>
      <div class="filter-controls">
        <button @click="changeFilter('7d')" :class="{ active: activeFilter === '7d' }">Últimos 7 dias</button>
        <button @click="changeFilter('30d')" :class="{ active: activeFilter === '30d' }">Últimos 30 dias</button>
        <button @click="changeFilter('all')" :class="{ active: activeFilter === 'all' }">Desde o início</button>
      </div>

      <div v-if="isLoading" class="state-container"><LoadingSpinner /></div>
      <div v-else-if="error" class="state-container">
        <div class="error-box">
          <h3>Ocorreu um erro ao buscar os dados</h3>
          <p>{{ error }}</p>
        </div>
      </div>
      <AdminDashboard v-else-if="stats && logs" :stats="stats" :logs="logs" :chartData="chartData"/>
      <FoodsManager />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAdminStats, getAdminLogs, getAdminChartData } from '@/services/adminService';
import AdminLogin from '@/components/admin/AdminLogin.vue';
import AdminDashboard from '@/components/admin/AdminDashboard.vue';
import FoodsManager from '@/components/admin/FoodsManager.vue';
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue';

const isAuthenticated = ref(false);
const stats = ref(null);
const logs = ref([]);
const isLoading = ref(true);
const error = ref(null);

const activeFilter = ref('all');
const chartData = ref([]);

const fetchData = async (period) => {
  isLoading.value = true;
  error.value = null;
  try {
    const [statsRes, logsRes, chartRes] = await Promise.all([
      getAdminStats(period),
      getAdminLogs(period),
      getAdminChartData(period) // Nova chamada
    ]);
    stats.value = statsRes;
    logs.value = logsRes;
    chartData.value = chartRes;
  } catch (err) {
    error.value = err.response?.data?.error || err.message;
    handleLogout();
  } finally {
    isLoading.value = false;
  }
};

const changeFilter = (newPeriod) => {
  activeFilter.value = newPeriod;
  fetchData(newPeriod);
};

const handleLoginSuccess = () => {
  sessionStorage.setItem('isAdminAuthenticated', 'true');
  isAuthenticated.value = true;
  fetchData(activeFilter.value);
};

const handleLogout = () => {
  sessionStorage.removeItem('isAdminAuthenticated');
  isAuthenticated.value = false;
  stats.value = null;
  logs.value = [];
  error.value = null;
};

onMounted(() => {
  if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
    isAuthenticated.value = true;
    fetchData(activeFilter.value);
  } else {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.admin-view {
  /* Aumenta o padding lateral para dar respiro */
  padding: 2rem 5%; /* 5% de margem nas laterais */
  max-width: 1400px; /* Permite que o painel fique mais largo em telas grandes */
  margin: 0 auto;
}

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

.state-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  flex-direction: column;
}
.error-box {
  color: var(--red-error);
  background-color: #fdeaea;
  border: 1px solid #f9c5c5;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
}
</style>
