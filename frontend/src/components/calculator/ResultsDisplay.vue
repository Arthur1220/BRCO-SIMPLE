<template>
  <article class="results">
    <header class="results-head">
      <div>
        <h2>{{ $t('results.title') }}</h2>
        <p class="small muted">{{ $t('results.savedUntil', { date: formatDate(results.expiresAt) }) }}</p>
      </div>
      <div class="cluster">
        <button type="button" class="btn btn-primary btn-sm" @click="showPdf = true">{{ $t('pdf.button') }}</button>
        <button type="button" class="btn btn-secondary btn-sm" :disabled="isExporting" @click="exportToCsv">
          <span v-if="isExporting" class="spinner" aria-hidden="true"></span>
          {{ isExporting ? $t('common.generating') : $t('common.exportCsv') }}
        </button>
      </div>
    </header>
    <PdfDialog v-if="showPdf" :type="results.type" :calculation-id="results.calculationId" @close="showPdf = false" />

    <div class="stats">
      <div v-for="(item, index) in results.highlights" :key="item.code" class="stat" :class="{ 'is-key': index === 0 }">
        <span class="stat-label">{{ item.label }}</span>
        <span class="stat-value">{{ format(item) }}<small>{{ item.unit }}</small></span>
      </div>
    </div>

    <div class="groups-head">
      <h3>{{ $t('results.details') }}</h3>
      <button type="button" class="btn btn-ghost btn-sm" @click="toggleAll">
        {{ allExpanded ? $t('results.collapseAll') : $t('results.expandAll') }}
      </button>
    </div>

    <section v-for="group in results.groups" :key="group.code" class="panel group">
      <button
        type="button"
        class="group-toggle"
        :aria-expanded="Boolean(expandedGroups[group.code])"
        :aria-controls="`group-${group.code}`"
        @click="expandedGroups[group.code] = !expandedGroups[group.code]"
      >
        <svg class="chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 4l4 4-4 4" /></svg>
        <span class="group-title">{{ group.label }}</span>
        <span class="group-count muted">{{ visibleItems(group).length }}</span>
        <span v-if="group.summary" class="group-summary">
          <span class="muted">{{ group.summary.label }}</span>
          <span class="num">{{ format(group.summary) }} {{ group.summary.unit }}</span>
        </span>
      </button>

      <div v-show="expandedGroups[group.code]" :id="`group-${group.code}`" class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>{{ $t('results.parameter') }}</th>
              <th class="right">{{ hasMaxValue ? $t('results.requiredValue') : $t('results.value') }}</th>
              <th v-if="hasMaxValue" class="right">{{ $t('results.maxValue') }}</th>
              <th>{{ $t('results.unit') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in visibleItems(group)" :key="item.code">
              <td>{{ item.label }}</td>
              <td class="num">{{ format(item) }}</td>
              <td v-if="hasMaxValue" class="num muted">{{ item.max !== undefined ? format(item, item.max) : '—' }}</td>
              <td class="unit-col">{{ item.unit }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </article>
</template>

<script setup>
import PdfDialog from '@/components/report/PdfDialog.vue';
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
const isExporting = ref(false);
const showPdf = ref(false);

const format = (item, value = item.value) =>
  Number(value).toLocaleString(locale.value, { minimumFractionDigits: item.decimals, maximumFractionDigits: item.decimals });

const formatDate = (iso) => new Date(iso).toLocaleDateString(locale.value, { day: '2-digit', month: 'short', year: 'numeric' });

// Parâmetros zerados não se aplicam ao animal informado.
const visibleItems = (group) => group.items.filter((item) => item.value > 0);

const hasMaxValue = computed(() =>
  results.value.groups.some((group) => group.items.some((item) => item.max !== undefined))
);

const allExpanded = computed(() => results.value.groups.every((group) => expandedGroups[group.code]));

const toggleAll = () => {
  const next = !allExpanded.value;
  results.value.groups.forEach((group) => { expandedGroups[group.code] = next; });
};

// Abre o primeiro grupo; os demais começam fechados.
watch(() => results.value?.calculationId, () => {
  results.value?.groups.forEach((group, index) => { expandedGroups[group.code] = index === 0; });
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
.results { display: flex; flex-direction: column; gap: 16px; }

.results-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.results-head h2 { font-size: 1.125rem; }

.groups-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.groups-head h3 { font-size: 0.875rem; color: var(--ink-2); font-weight: 500; }

.group { overflow: hidden; }

.group-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 14px 16px;
  text-align: left;
  border-radius: 0;
}

.group-toggle:hover { background: #fcfbf9; }

.chevron { width: 14px; height: 14px; color: var(--ink-3); transition: transform var(--ease); }
.group-toggle[aria-expanded='true'] .chevron { transform: rotate(90deg); }
.group-toggle[aria-expanded='true'] { border-bottom: 1px solid var(--line); }

.group-title { font-weight: 500; }
.group-count { font-size: 0.75rem; font-family: var(--font-mono); }

.group-summary {
  display: flex;
  gap: 10px;
  margin-left: auto;
  font-size: 0.8125rem;
}

.group-summary .num { color: var(--ink); }

@media (max-width: 600px) {
  .group-summary .muted { display: none; }
}
</style>
