<template>
  <div class="dashboard">
    <StatsCards :stats="stats" />

    <section class="panel">
      <header class="panel-head"><h2>{{ $t('admin.usageTitle') }}</h2></header>
      <div class="panel-body"><UsageChart :data="chartData" /></div>
    </section>

    <section class="panel">
      <header class="panel-head"><h2>{{ $t('admin.activityTitle') }}</h2></header>
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
  chartData: Array
});
</script>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px; }
.panel-head h2 { font-size: 0.9375rem; }
</style>
