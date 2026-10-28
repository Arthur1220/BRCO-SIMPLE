<template>
  <div v-if="solution" class="diet-results">
    <div class="stats">
      <div class="stat is-key">
        <span class="stat-label">{{ $t('dietResults.totalIntake') }}</span>
        <span class="stat-value">{{ formatNum(solution.totals.intakeKgPerDay, 3) }}<small>kg MS/d</small></span>
      </div>
      <div class="stat">
        <span class="stat-label">{{ $t('dietResults.totalCost') }}</span>
        <span class="stat-value">{{ $t('common.currency', { value: formatNum(solution.totals.costPerDay) }) }}<small>/d</small></span>
      </div>
      <div class="stat">
        <span class="stat-label">{{ $t('dietResults.status') }}</span>
        <span class="status-line">
          <span class="pill" :class="balanceOk ? 'pill-ok' : 'pill-warn'">{{ balanceOk ? $t('dietResults.allMet') : $t('dietResults.someMissing') }}</span>
          <span v-if="optionLabel" class="small muted">{{ optionLabel }}</span>
        </span>
      </div>
    </div>

    <section v-if="solution.warnings?.length" class="panel" aria-labelledby="diet-warnings-title">
      <header class="panel-head">
        <h3 id="diet-warnings-title">{{ $t('dietResults.warningsTitle') }}</h3>
      </header>
      <ul class="warnings">
        <li v-for="(item, index) in solution.warnings" :key="`${item.code}-${index}`" class="warning" :class="`is-${item.severity}`">
          <span class="pill" :class="SEVERITY_CLASS[item.severity]">{{ item.severityLabel }}</span>
          <span>{{ item.message }}</span>
        </li>
      </ul>
    </section>

    <section class="panel">
      <header class="panel-head">
        <h3>{{ $t('dietResults.recipeTitle') }}</h3>
        <button type="button" class="btn btn-secondary btn-sm" :disabled="isExporting" @click="exportToCsv">
          <span v-if="isExporting" class="spinner" aria-hidden="true"></span>
          {{ isExporting ? $t('common.generating') : $t('common.exportCsv') }}
        </button>
      </header>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>{{ $t('dietResults.ingredient') }}</th>
              <th class="share-col">{{ $t('dietResults.finalProportion') }}</th>
              <th class="right">{{ $t('dietResults.quantity') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ing in solution.ingredients" :key="ing.foodId ?? ing.name" :class="{ 'is-zero': ing.percent === 0 }">
              <td>
                {{ ing.name }}
                <span class="small muted">· {{ ing.categoryLabel }}</span>
              </td>
              <td class="share-col">
                <span class="share">
                  <span class="share-bar" aria-hidden="true"><span :style="{ width: `${Math.min(ing.percent, 100)}%` }"></span></span>
                  <span class="num">{{ formatNum(ing.percent) }}%</span>
                </span>
              </td>
              <td class="num">{{ formatNum(ing.kgPerDay, 3) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel">
      <header class="panel-head">
        <h3>{{ $t('dietResults.balanceTitle') }}</h3>
      </header>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>{{ $t('dietResults.nutrient') }}</th>
              <th class="right">{{ $t('dietResults.required') }}</th>
              <th class="right">{{ $t('dietResults.supplied') }}</th>
              <th class="right">{{ $t('dietResults.balance') }}</th>
              <th>{{ $t('dietResults.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in solution.balance" :key="item.code">
              <td>{{ item.label }} <span class="small muted">({{ item.unit }})</span></td>
              <td class="num">{{ item.required === null ? $t('dietResults.notAvailable') : formatNum(item.required) }}</td>
              <td class="num">{{ formatNum(item.supplied) }}</td>
              <td class="num" :class="{ 'is-deficit': item.status === 'deficit' }">{{ item.diff === null ? '—' : `${item.diff > 0 ? '+' : ''}${formatNum(item.diff)}` }}</td>
              <td><span class="pill" :class="STATUS_CLASS[item.status]">{{ item.statusLabel }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="solution.safetyChecks?.length" class="panel" aria-labelledby="diet-safety-title">
      <header class="panel-head panel-head-stack">
        <h3 id="diet-safety-title">{{ $t('dietResults.safetyTitle') }}</h3>
        <p class="small muted">{{ $t('dietResults.safetyHint') }}</p>
      </header>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>{{ $t('dietResults.check') }}</th>
              <th class="right">{{ $t('dietResults.value') }}</th>
              <th class="right">{{ $t('dietResults.limit') }}</th>
              <th>{{ $t('dietResults.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="check in solution.safetyChecks" :key="check.code">
              <td>{{ check.label }} <span class="small muted">({{ check.unit }})</span></td>
              <td class="num">{{ check.value === null ? '—' : formatNum(check.value) }}</td>
              <td class="num">{{ check.limit === null ? '—' : `${check.kind === 'max' ? '≤' : '≥'} ${formatNum(check.limit)}` }}</td>
              <td>
                <span class="pill" :class="checkClass(check)">{{ checkLabel(check) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useDietStore } from '@/stores/dietStore';
import { downloadCalculationCsv } from '@/services/apiService';
import { useI18n } from 'vue-i18n';
import { parseApiError } from '@/services/axiosSetup';
import { saveAs } from 'file-saver';

// kg/dia, custo, balanço e status vêm calculados da API v1.
const store = useDietStore();
const { t, locale } = useI18n();
const solution = computed(() => store.dietResults?.solution);
const isExporting = ref(false);

// Apenas aparência: cor do selo por status.
const STATUS_CLASS = { ideal: 'pill-ok', deficit: 'pill-warn', excess: 'pill-info', info: 'pill-info' };

const SEVERITY_CLASS = { info: 'pill-info', warning: 'pill-warn', blocked: 'pill-warn' };

// Com dado incompleto, "dentro do limite" não é garantido: mostra o aviso em vez do OK.
const checkLabel = (check) => {
  if (check.value === null) return t('dietResults.noData');
  if (check.ok === null) return t('dietResults.noLimit');
  if (check.ok && check.incomplete) return t('dietResults.incomplete');
  return check.ok ? t('dietResults.within') : t('dietResults.outside');
};
const checkClass = (check) => {
  if (check.ok === false) return 'pill-warn';
  return check.ok && !check.incomplete ? 'pill-ok' : 'pill-info';
};

const balanceOk = computed(() => solution.value.balance.every((item) => item.status !== 'deficit'));

// Quando houve conflito, mostra qual cenário o usuário escolheu.
const optionLabel = computed(() => {
  const code = store.dietResults?.option;
  return code ? store.conflictData.options.find((o) => o.code === code)?.label : null;
});

const formatNum = (num, decimals = 2) =>
  Number(num || 0).toLocaleString(locale.value, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const exportToCsv = async () => {
  isExporting.value = true;
  try {
    const { blob, filename } = await downloadCalculationCsv(store.dietResults.calculationId);
    saveAs(blob, filename);
  } catch (error) {
    alert(parseApiError(error, t('errors.csv')).message);
  } finally {
    isExporting.value = false;
  }
};
</script>

<style scoped>
.diet-results { display: flex; flex-direction: column; gap: 16px; }

.panel-head h3 { font-size: 0.9375rem; }

.status-line { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding-top: 6px; }

.table th:first-child,
.table td:first-child { padding-left: 24px; }
.table th:last-child,
.table td:last-child { padding-right: 24px; }

.share-col { width: 40%; }

.share { display: flex; align-items: center; gap: 12px; }

.share-bar {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--surface-2);
  overflow: hidden;
}

.share-bar span { display: block; height: 100%; background: var(--brand); }

.share .num { min-width: 64px; text-align: right; }

.is-zero td { color: var(--ink-3); }

.is-deficit { color: var(--warn); }

.panel-head-stack { flex-direction: column; align-items: flex-start; gap: 4px; }
.panel-head-stack p { margin: 0; }

.warnings { list-style: none; margin: 0; padding: 8px 24px 16px; display: flex; flex-direction: column; gap: 10px; }
.warning { display: flex; gap: 10px; align-items: baseline; line-height: 1.45; }
.warning .pill { flex: none; }
.warning.is-blocked { color: var(--warn); }

@media (max-width: 720px) {
  .warnings { padding: 8px 16px 14px; }
}

@media (max-width: 720px) {
  .table th:first-child,
  .table td:first-child { padding-left: 16px; }
  .share-col { width: auto; }
  .share-bar { display: none; }
}
</style>
