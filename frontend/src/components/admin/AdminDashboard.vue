<template>
  <div class="dashboard-container">
    <section class="section">
      <StatsCards :stats="stats" />
    </section>

    <section class="section">
      <h3 class="section-title">Uso nos Últimos Dias</h3>
      <UsageChart :data="chartData" />
    </section>

    <section class="section">
      <h3 class="section-title">Histórico de Atividades</h3>
      <LogsTable :logs="logs" />
    </section>
  </div>
</template>

<script setup>
import StatsCards from './StatsCards.vue';
import LogsTable from './LogsTable.vue';
import UsageChart from './UsageChart.vue';

defineProps({
  stats: Object,
  logs: Array,
  chartData: Array // Novo dado recebido
});
</script>

<style scoped>
.section { margin-bottom: 2.5rem; }
.section-title { font-size: 1.2rem; color: var(--black); margin-bottom: 1rem; font-weight: 600; }
</style>
