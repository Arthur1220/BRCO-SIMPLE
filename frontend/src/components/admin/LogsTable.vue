<template>
  <div class="logs-wrapper">
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Origem</th>
            <th>Navegador</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in paginatedLogs" :key="log.id">
            <td>
                <span class="type-badge" :class="getTypeClass(log.calculationType)">
                    {{ formatTypeName(log.calculationType) }}
                </span>
            </td>
            <td>{{ log.country || '-' }} <span class="region" v-if="log.region">({{ log.region }})</span></td>
            <td class="truncate" :title="log.userAgent">{{ formatUserAgent(log.userAgent) }}</td>
            <td>{{ new Date(log.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1" class="page-btn">←</button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages" class="page-btn">→</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({ logs: Array });

const currentPage = ref(1);
const itemsPerPage = 10;

const totalPages = computed(() => Math.ceil(props.logs.length / itemsPerPage) || 1);
const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return props.logs.slice(start, start + itemsPerPage);
});

const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };
const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };

const formatTypeName = (t) => {
    if (t.includes('ndt')) return 'NDT';
    if (t.includes('requirement')) return 'Exigências';
    return 'Dieta';
};

const getTypeClass = (t) => {
    if (t.includes('ndt')) return 'badge-blue';
    if (t.includes('diet')) return 'badge-green';
    return 'badge-orange';
};
const formatUserAgent = (ua) => {
    if (!ua) return '-';
    if (ua.includes('Mobile')) return '📱 Mobile';
    return '💻 Desktop';
};
</script>

<style scoped>
/* =========================================
   1. Containers & Wrapper Principal
   ========================================= */
.logs-wrapper {
  background: white;
  border-radius: 12px;
  border: 1px solid var(--grey-light);
  overflow: hidden; /* Garante que o conteúdo respeite o border-radius */
}

/* =========================================
   2. Tabela de Logs
   ========================================= */
.table-container {
  overflow-x: auto; /* Permite scroll horizontal se necessário */
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

th {
  background: #f9fafb;
  text-align: left;
  padding: 1rem;
  color: var(--black-light);
  font-weight: 600;
  border-bottom: 1px solid var(--grey-light);
}

td {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  color: var(--black);
}

/* =========================================
   3. Utilitários de Texto (Células)
   ========================================= */
.truncate {
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /* Adiciona '...' em textos longos */
}

.region {
  color: var(--black-light);
  font-size: 0.8rem;
}

/* =========================================
   4. Badges (Tipos de Log)
   ========================================= */
.type-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
}

/* Variações de Cores */
.badge-blue {
  background: #e3f2fd;
  color: #1976d2;
}

.badge-green {
  background: #e8f5e9;
  color: #2e7d32;
}

.badge-orange {
  background: #fff3e0;
  color: #f57c00;
}

/* =========================================
   5. Paginação
   ========================================= */
.pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 1rem;
  gap: 1rem;
  background: #fafafa;
  border-top: 1px solid var(--grey-light);
}

.page-info {
  font-size: 0.9rem;
  font-weight: bold;
  color: var(--black-light);
}

.page-btn {
  background: white;
  border: 1px solid var(--grey);
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s; /* Suaviza o hover */
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn:not(:disabled):hover {
  border-color: var(--orange);
  color: var(--orange);
}
</style>
