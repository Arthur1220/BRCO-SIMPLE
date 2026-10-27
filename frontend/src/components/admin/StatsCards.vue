<template>
  <div class="stats">
    <div class="stat is-key">
      <span class="stat-label">{{ $t('admin.totalCalculations') }}</span>
      <span class="stat-value">{{ stats.totalCalculations }}</span>
    </div>

    <!-- Labels por tipo vêm prontos (e traduzidos) da API -->
    <div v-for="typeStat in stats.statsByType" :key="typeStat.type" class="stat">
      <span class="stat-label">{{ typeStat.label }}</span>
      <span class="stat-value">{{ typeStat.count }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({ stats: { type: Object, required: true } });
</script>
