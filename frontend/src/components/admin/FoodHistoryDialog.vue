<template>
  <div class="dialog-backdrop" @click.self="emit('close')">
    <div class="dialog history" role="dialog" aria-modal="true" aria-labelledby="history-title">
      <header class="dialog-head">
        <h2 id="history-title">{{ $t('admin.history.titleFor', { name: food.name }) }}</h2>
      </header>
      <div class="dialog-body">
        <p v-if="isLoading" class="cluster muted"><span class="spinner"></span>{{ $t('common.loadingOptions') }}</p>
        <p v-else-if="error" class="alert alert-error" role="alert">{{ error }}</p>
        <p v-else-if="entries.length === 0" class="muted">{{ $t('admin.history.empty') }}</p>
        <HistoryEntries v-else :entries="entries" />
      </div>
      <footer class="dialog-foot">
        <button type="button" class="btn btn-ghost" @click="emit('close')">{{ $t('common.close') }}</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { getFoodHistory } from '@/services/adminService';
import { parseApiError } from '@/services/axiosSetup';
import HistoryEntries from './HistoryEntries.vue';

// Histórico de alterações de um alimento (quem mudou o quê e quando).
const props = defineProps({ food: { type: Object, required: true } });
const emit = defineEmits(['close']);
const { t } = useI18n();

const entries = ref([]);
const isLoading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    entries.value = await getFoodHistory(props.food.id);
  } catch (err) {
    error.value = parseApiError(err, t('admin.history.error')).message;
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.history { max-width: 640px; }
</style>
