<template>
  <div class="container page">
    <AdminLogin v-if="!isAuthenticated" @login-success="handleLoginSuccess" />

    <template v-else>
      <header class="admin-head">
        <div>
          <h1>{{ $t('admin.title') }}</h1>
          <p>{{ $t('admin.subtitle') }}</p>
        </div>
        <div class="cluster">
          <div class="segmented" role="group" :aria-label="$t('admin.period')">
            <button
              v-for="period in PERIODS"
              :key="period.code"
              type="button"
              :class="{ 'is-active': activeFilter === period.code }"
              :aria-pressed="activeFilter === period.code"
              @click="changeFilter(period.code)"
            >
              {{ $t(period.label) }}
            </button>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" @click="handleLogout">{{ $t('admin.logout') }}</button>
        </div>
      </header>

      <div v-if="error" class="alert alert-error" role="alert">
        <strong>{{ $t('admin.fetchError') }}</strong> · {{ error }}
      </div>
      <p v-else-if="isLoading && !stats" class="cluster muted"><span class="spinner"></span>{{ $t('common.loadingOptions') }}</p>
      <AdminDashboard v-else-if="stats && logs" :class="{ 'is-stale': isLoading }" :stats="stats" :logs="logs" :chartData="chartData" />

      <FoodsManager />
      <RecentHistory />
    </template>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { getAdminStats, getAdminLogs, getAdminChartData, logoutAdmin } from '@/services/adminService';
import { hasValidAdminToken, parseApiError } from '@/services/axiosSetup';
import AdminLogin from '@/components/admin/AdminLogin.vue';
import AdminDashboard from '@/components/admin/AdminDashboard.vue';
import FoodsManager from '@/components/admin/FoodsManager.vue';
import RecentHistory from '@/components/admin/RecentHistory.vue';

const PERIODS = [
  { code: '7d', label: 'admin.last7Days' },
  { code: '30d', label: 'admin.last30Days' },
  { code: 'all', label: 'admin.allTime' },
];

const isAuthenticated = ref(false);
const stats = ref(null);
const logs = ref([]);
const isLoading = ref(true);
const error = ref(null);

const activeFilter = ref('all');
const chartData = ref([]);
const { locale } = useI18n();

const fetchData = async (period) => {
  isLoading.value = true;
  error.value = null;
  try {
    const [statsRes, logsRes, chartRes] = await Promise.all([
      getAdminStats(period),
      getAdminLogs(period),
      getAdminChartData(period)
    ]);
    stats.value = statsRes;
    logs.value = logsRes;
    chartData.value = chartRes;
  } catch (err) {
    error.value = parseApiError(err).message;
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
  isAuthenticated.value = true;
  fetchData(activeFilter.value);
};

const handleLogout = () => {
  logoutAdmin();
  isAuthenticated.value = false;
  stats.value = null;
  logs.value = [];
};

// Os labels por tipo vêm traduzidos da API: busca de novo ao trocar o idioma.
watch(locale, () => {
  if (isAuthenticated.value) fetchData(activeFilter.value);
});

onMounted(() => {
  if (hasValidAdminToken()) {
    isAuthenticated.value = true;
    fetchData(activeFilter.value);
  } else {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.admin-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.admin-head h1 { margin-bottom: 4px; }

.is-stale { opacity: 0.5; transition: opacity var(--ease); }
</style>
