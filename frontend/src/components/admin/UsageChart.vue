<template>
  <div class="chart-container">
    <Line :data="chartDataConfig" :options="chartOptions" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const props = defineProps({
  data: { type: Array, required: true }
});

const { t, locale } = useI18n();

const chartDataConfig = computed(() => ({
  labels: props.data.map(d =>
      new Date(d.date).toLocaleDateString(locale.value, { day: 'numeric', month: 'numeric' })
  ),
  datasets: [
    {
      label: t('admin.chartLabel'),
      backgroundColor: 'rgba(245, 130, 32, 0.2)',
      borderColor: '#f58220',
      pointBackgroundColor: '#f58220',
      borderWidth: 2,
      pointRadius: 4,
      fill: true,
      data: props.data.map(d => d.count),
      tension: 0.4
    }
  ]
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
        backgroundColor: '#2c3e50',
        padding: 10,
        cornerRadius: 8,
        displayColors: false
    }
  },
  scales: {
    y: {
        beginAtZero: true,
        ticks: { precision: 0 },
        grid: { color: '#f0f0f0' }
    },
    x: { grid: { display: false } }
  }
};
</script>

<style scoped>
.chart-container {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--grey-light);
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
  height: 300px;
}
</style>
