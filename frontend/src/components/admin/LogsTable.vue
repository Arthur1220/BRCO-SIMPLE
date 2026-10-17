<template>
  <p v-if="logs.length === 0" class="empty">{{ $t('admin.logs.empty') }}</p>

  <template v-else>
    <div class="table-wrap">
      <table class="table logs">
        <thead>
          <tr>
            <th>{{ $t('admin.logs.type') }}</th>
            <th>{{ $t('admin.logs.origin') }}</th>
            <th>{{ $t('admin.logs.browser') }}</th>
            <th class="right">{{ $t('admin.logs.date') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in paginatedLogs" :key="log.id">
            <td>{{ log.label }}</td>
            <td>{{ log.country || '—' }}<span v-if="log.region" class="muted"> · {{ log.region }}</span></td>
            <td class="muted" :title="log.userAgent">{{ formatUserAgent(log.userAgent) }}</td>
            <td class="num">{{ formatDate(log.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer v-if="totalPages > 1" class="pager">
      <span class="small muted num">{{ currentPage }} / {{ totalPages }}</span>
      <div class="cluster">
        <button type="button" class="btn btn-ghost btn-sm" :disabled="currentPage === 1" @click="currentPage--">{{ $t('common.previous') }}</button>
        <button type="button" class="btn btn-ghost btn-sm" :disabled="currentPage === totalPages" @click="currentPage++">{{ $t('common.next') }}</button>
      </div>
    </footer>
  </template>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({ logs: Array });
const { t, locale } = useI18n();

const currentPage = ref(1);
const itemsPerPage = 10;

const totalPages = computed(() => Math.ceil(props.logs.length / itemsPerPage) || 1);
const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return props.logs.slice(start, start + itemsPerPage);
});

watch(() => props.logs, () => { currentPage.value = 1; });

const formatDate = (iso) =>
  new Date(iso).toLocaleString(locale.value, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const formatUserAgent = (ua) => {
  if (!ua) return '—';
  return ua.includes('Mobile') ? t('admin.logs.mobile') : t('admin.logs.desktop');
};
</script>

<style scoped>
.logs th:first-child,
.logs td:first-child { padding-left: 24px; }
.logs th:last-child,
.logs td:last-child { padding-right: 24px; }

.pager {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px 10px 24px;
  border-top: 1px solid var(--line);
}
</style>
