<template>
  <div class="chart">
    <Bar :data="chartDataConfig" :options="chartOptions" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const props = defineProps({
  data: { type: Array, required: true }
});

const { t, locale } = useI18n();

// Cores do sistema de design (ver assets/main.css)
const BRAND = '#f58220';
const INK_3 = '#6f6a62';
const LINE = '#e6e2da';

const chartDataConfig = computed(() => ({
  labels: props.data.map((d) =>
    new Date(`${d.date}T12:00:00`).toLocaleDateString(locale.value, { day: '2-digit', month: '2-digit' })
  ),
  datasets: [
    {
      label: t('admin.chartLabel'),
      data: props.data.map((d) => d.count),
      backgroundColor: BRAND,
      borderRadius: 2,
      maxBarThickness: 24,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1d1b18',
      padding: 10,
      cornerRadius: 4,
      displayColors: false,
      titleFont: { family: 'IBM Plex Sans' },
      bodyFont: { family: 'IBM Plex Mono' },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      border: { display: false },
      ticks: { precision: 0, color: INK_3, font: { family: 'IBM Plex Mono', size: 11 } },
      grid: { color: LINE },
    },
    x: {
      border: { color: LINE },
      ticks: { color: INK_3, font: { family: 'IBM Plex Mono', size: 11 }, maxRotation: 0, autoSkipPadding: 12 },
      grid: { display: false },
    },
  },
};
</script>

<style scoped>
.chart { position: relative; height: 240px; }
</style>
