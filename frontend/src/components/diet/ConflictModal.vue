<template>
  <div v-if="isVisible" class="dialog-backdrop">
    <div class="dialog conflict" role="dialog" aria-modal="true" aria-labelledby="conflict-title">
      <header class="dialog-head">
        <h2 id="conflict-title">{{ $t('conflict.title') }}</h2>
        <p>{{ statusLabel }}</p>
      </header>

      <!-- Opções, textos e custos vêm prontos da API v1 -->
      <div class="dialog-body options">
        <button
          v-for="option in options"
          :key="option.code"
          type="button"
          class="option"
          :disabled="!option.solution.feasible"
          @click="emit('select-option', option.code)"
        >
          <span class="option-title">{{ option.label }}</span>
          <span class="option-text">{{ option.description }}</span>
          <!-- Sem solução segura: mostra o motivo (avisos de bloqueio) -->
          <span v-for="item in blocking(option)" :key="item.code" class="option-block">{{ item.message }}</span>
          <span v-if="!option.solution.feasible" class="option-cost">
            <span class="pill pill-warn">{{ $t('conflict.unavailable') }}</span>
          </span>
          <span v-else class="option-cost">
            <span class="muted">{{ $t('conflict.estimatedCost') }}</span>
            <span class="num">{{ $t('common.currency', { value: formatMoney(option.solution.totals.costPerDay) }) }}/d</span>
          </span>
        </button>
      </div>
      <footer class="dialog-foot">
        <button type="button" class="btn btn-ghost" @click="emit('close')">{{ $t('conflict.back') }}</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  isVisible: Boolean,
  options: { type: Array, default: () => [] },
  statusLabel: { type: String, default: '' },
});

const emit = defineEmits(['select-option', 'close']);
const { locale } = useI18n();

const blocking = (option) => (option.solution.warnings ?? []).filter((w) => w.severity === 'blocked');

const formatMoney = (val) =>
  Number(val || 0).toLocaleString(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
</script>

<style scoped>
.dialog-head h2 { font-size: 1.125rem; }

.options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.option {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  text-align: left;
  border: 1px solid var(--line-strong);
  border-radius: var(--r);
  transition: border-color var(--ease), background-color var(--ease);
}

.option:hover:not(:disabled) { border-color: var(--brand); background: #fffaf5; }

.option:disabled { cursor: not-allowed; background: var(--surface-2); }
.option:disabled .option-title { color: var(--ink-2); }

.option-block { font-size: 0.8125rem; color: var(--warn); line-height: 1.4; }

.option-title { font-weight: 600; color: var(--ink); }
.option-text { font-size: 0.875rem; color: var(--ink-2); flex: 1; }

.option-cost {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
  font-size: 0.8125rem;
}

.option-cost .num { color: var(--ink); }

@media (max-width: 600px) {
  .options { grid-template-columns: 1fr; }
}
</style>
