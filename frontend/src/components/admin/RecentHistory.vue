<template>
  <section class="panel" aria-labelledby="recent-history-title">
    <header class="panel-head">
      <h2 id="recent-history-title">{{ $t('admin.history.recentTitle') }}</h2>
      <button type="button" class="btn btn-ghost btn-sm" :disabled="isLoading" @click="load">{{ $t('admin.history.refresh') }}</button>
    </header>
    <div class="panel-body">
      <p v-if="isLoading" class="cluster muted"><span class="spinner"></span>{{ $t('common.loadingOptions') }}</p>
      <p v-else-if="error" class="alert alert-error" role="alert">{{ error }}</p>
      <p v-else-if="entries.length === 0" class="muted">{{ $t('admin.history.empty') }}</p>
      <HistoryEntries v-else :entries="entries" show-food />
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { getRecentHistory } from '@/services/adminService';
import { parseApiError } from '@/services/axiosSetup';
import HistoryEntries from './HistoryEntries.vue';

// Últimas alterações do cadastro de alimentos, para a revisão técnica.
const { t } = useI18n();
const entries = ref([]);
const isLoading = ref(false);
const error = ref(null);

async function load() {
  isLoading.value = true;
  error.value = null;
  try {
    entries.value = await getRecentHistory();
  } catch (err) {
    error.value = parseApiError(err, t('admin.history.error')).message;
  } finally {
    isLoading.value = false;
  }
}

onMounted(load);
defineExpose({ load });
</script>

<style scoped>
.panel-head h2 { font-size: 0.9375rem; }
</style>
