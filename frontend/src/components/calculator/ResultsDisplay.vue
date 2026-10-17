<template>
  <div class="results-wrapper">
    <div class="results-header">
      <h2>{{ $t('results.title') }}</h2>
      <div class="export-buttons">
        <button @click="exportToCsv" class="btn-export csv" :disabled="isExporting">
          {{ isExporting ? $t('common.generating') : $t('common.exportCsv') }}
        </button>
      </div>
    </div>

    <div class="highlight-grid">
      <div class="highlight-card" v-for="item in results.highlights" :key="item.code">
        <span class="highlight-label">{{ item.label }}</span>
        <span class="highlight-value">{{ format(item) }}<small>{{ item.unit }}</small></span>
      </div>
    </div>

    <div class="details-section">
      <div class="accordion-controls">
         <h4 class="details-title">{{ $t('results.details') }}</h4>
         <button @click="toggleAll" class="btn-toggle-all">
           {{ allExpanded ? $t('results.collapseAll') : $t('results.expandAll') }}
         </button>
      </div>

      <div class="accordion-container">
        <div v-for="group in results.groups" :key="group.code" class="accordion-item">

          <div class="accordion-header" @click="toggleGroup(group.code)" :class="{ active: expandedGroups[group.code] }">
            <div class="header-left">
                <span class="toggle-icon">
                    <svg v-if="expandedGroups[group.code]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </span>
                <span class="group-title">{{ group.label }}</span>
            </div>

            <div class="header-summary" v-if="group.summary">
                <span class="summary-label">{{ group.summary.label }}:</span>
                <span class="summary-value">{{ format(group.summary) }} <small>{{ group.summary.unit }}</small></span>
            </div>
          </div>

          <div v-show="expandedGroups[group.code]" class="accordion-content">
            <table>
              <thead>
                <tr>
                  <th>{{ $t('results.parameter') }}</th>
                  <th class="center">{{ hasMaxValue ? $t('results.requiredValue') : $t('results.value') }}</th>
                  <th class="center" v-if="hasMaxValue">{{ $t('results.maxValue') }}</th>
                  <th class="center">{{ $t('results.unit') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in group.items.filter((i) => i.value > 0)" :key="item.code">
                  <td>{{ item.label }}</td>
                  <td class="center data-value">{{ format(item) }}</td>
                  <td v-if="hasMaxValue" class="center data-value">{{ item.max !== undefined ? format(item, item.max) : $t('common.notAvailable') }}</td>
                  <td class="center">{{ item.unit }}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue';
import { useCalculationStore } from '@/stores/calculationStore';
import { downloadCalculationCsv } from '@/services/apiService';
import { useI18n } from 'vue-i18n';
import { parseApiError } from '@/services/axiosSetup';
import { saveAs } from 'file-saver';

// Highlights, grupos, labels, unidades e resumos vêm prontos da API v1.
const store = useCalculationStore();
const { t, locale } = useI18n();
const results = computed(() => store.results);

const expandedGroups = reactive({});
const allExpanded = ref(false);
const isExporting = ref(false);

const format = (item, value = item.value) =>
  Number(value).toLocaleString(locale.value, { minimumFractionDigits: item.decimals, maximumFractionDigits: item.decimals });

const hasMaxValue = computed(() =>
  results.value.groups.some((group) => group.items.some((item) => item.max !== undefined))
);

const toggleGroup = (code) => {
  expandedGroups[code] = !expandedGroups[code];
};

const toggleAll = () => {
  allExpanded.value = !allExpanded.value;
  results.value.groups.forEach((group) => { expandedGroups[group.code] = allExpanded.value; });
};

// Começa com todos os grupos fechados
watch(results, (value) => {
  value?.groups.forEach((group) => { expandedGroups[group.code] = false; });
}, { immediate: true });

const exportToCsv = async () => {
  isExporting.value = true;
  try {
    // O CSV é gerado pelo servidor a partir do cálculo salvo.
    const { blob, filename } = await downloadCalculationCsv(results.value.calculationId);
    saveAs(blob, filename);
  } catch (error) {
    alert(parseApiError(error, t('errors.csv')).message);
  } finally {
    isExporting.value = false;
  }
};
</script>

<style scoped>
/* =========================================
   1. Layout Principal & Cabeçalho
   ========================================= */
.results-wrapper {
  margin-top: 2rem;
  padding: 2rem;
  background: linear-gradient(180deg, var(--white) 0%, #fdfdfd 100%);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--grey-light);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--grey-light);
  flex-wrap: wrap; /* Garante que os botões caiam pra linha de baixo no mobile */
  gap: 1rem;
}

h2 {
  color: var(--orange);
  margin: 0;
}

/* =========================================
   2. Cards de Destaque (Highlights)
   ========================================= */
.highlight-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.highlight-card {
  background-color: var(--white);
  padding: 1.5rem;
  border-radius: 10px;
  border: 1px solid var(--grey-light);
  text-align: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
}

.highlight-label {
  display: block;
  font-size: 0.9rem;
  color: var(--black-light);
  margin-bottom: 0.5rem;
}

.highlight-value {
  display: block;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--black);
  line-height: 1;
}

.highlight-value small {
  font-size: 1rem;
  font-weight: 500;
  color: var(--black-light);
  margin-left: 0.5rem;
}

/* =========================================
   3. Componente Accordion (Lista Expansível)
   ========================================= */
/* Controles Superiores (Título + Botão Expandir) */
.accordion-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.details-title {
  font-size: 1.2rem;
  color: var(--black);
  margin: 0;
  font-weight: 600;
}

.btn-toggle-all {
  background: none;
  border: none;
  color: var(--blue);
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
}

.btn-toggle-all:hover {
  text-decoration: underline;
}

/* Estrutura do Accordion */
.accordion-container {
  border: 1px solid var(--grey-light);
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.accordion-item {
  border-bottom: 1px solid var(--grey-light);
}

.accordion-item:last-child {
  border-bottom: none;
}

/* Cabeçalho do Item (Clicável) */
.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  cursor: pointer;
  background-color: #f8f9fa;
  transition: background-color 0.2s;
  user-select: none; /* Evita seleção de texto ao clicar rápido */
}

.accordion-header:hover {
  background-color: #f1f3f5;
}

.accordion-header.active {
  background-color: #e9ecef;
  border-bottom: 1px solid var(--grey-light);
}

/* Conteúdo Esquerdo do Header */
.header-left {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.toggle-icon svg {
  width: 18px;
  height: 18px;
  color: var(--grey);
  transition: transform 0.2s;
}

.group-title {
  font-weight: 700;
  color: var(--black);
  font-size: 1rem;
}

/* Resumo Direito do Header */
.header-summary {
  font-size: 0.9rem;
  color: var(--black-light);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.summary-label {
  font-weight: 500;
}

.summary-value {
  font-weight: 700;
  color: var(--black);
}

/* Área de Conteúdo Expansível */
.accordion-content {
  background-color: white;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* =========================================
   4. Tabela Interna (Dentro do Accordion)
   ========================================= */
.accordion-content table {
  width: 100%;
  border-collapse: collapse;
}

.accordion-content th,
.accordion-content td {
  padding: 0.8rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.accordion-content th {
  background-color: white;
  font-size: 0.85rem;
  color: var(--black-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #f0f0f0;
}

.accordion-content tr:last-child td {
  border-bottom: none;
}

/* =========================================
   5. Botões de Exportação & Utilitários
   ========================================= */
.export-buttons {
  display: flex;
  gap: 1rem;
}

.btn-export {
  padding: 0.6rem 1.2rem;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

.btn-export:hover {
  transform: translateY(-2px); /* Leve subida ao passar o mouse */
}

/* Variantes de Cor */
.btn-export.pdf {
  background-color: #e74c3c;
}

.btn-export.csv {
  background-color: #27ae60;
}

/* Utilitários */
.center {
  text-align: center;
}

.data-value {
  font-weight: 500;
}
</style>
