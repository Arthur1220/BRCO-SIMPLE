<template>
  <ol class="entries">
    <li v-for="entry in entries" :key="`${entry.foodId}-${entry.at}`" class="entry">
      <div class="entry-head">
        <span class="pill" :class="ACTION_CLASS[entry.action]">{{ entry.actionLabel }}</span>
        <strong v-if="showFood">{{ entry.foodName }}</strong>
        <span class="muted small">{{ formatDate(entry.at) }} · {{ entry.actor }}</span>
      </div>
      <table v-if="entry.action === 'update'" class="table changes">
        <thead>
          <tr>
            <th>{{ $t('admin.history.field') }}</th>
            <th class="right">{{ $t('admin.history.before') }}</th>
            <th class="right">{{ $t('admin.history.after') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="change in entry.changes" :key="change.field">
            <td>{{ change.field }}</td>
            <td class="num">{{ display(change.before) }}</td>
            <td class="num">{{ display(change.after) }}</td>
          </tr>
        </tbody>
      </table>
    </li>
  </ol>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

// Lista de alterações do cadastro (usada no histórico de um alimento e no geral).
defineProps({
  entries: { type: Array, required: true },
  showFood: { type: Boolean, default: false },
});
const { t, locale } = useI18n();

const ACTION_CLASS = { create: 'pill-ok', update: 'pill-info', delete: 'pill-warn' };
const display = (value) => (value === null || value === undefined ? t('admin.history.empty_value') : String(value));
const formatDate = (iso) => new Date(iso).toLocaleString(locale.value, { dateStyle: 'short', timeStyle: 'short' });
</script>

<style scoped>
.entries { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
.entry-head { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 6px; }
.changes { font-size: 0.8125rem; }
.changes th:first-child, .changes td:first-child { padding-left: 0; }
</style>
