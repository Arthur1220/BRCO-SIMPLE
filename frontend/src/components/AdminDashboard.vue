<template>
  <div class="admin-content">
    <section class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="icon-wrapper total">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-1.621-1.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" /></svg>
          </div>
          <span class="stat-value">{{ stats.totalCalculations }}</span>
          <span class="stat-label">Cálculos Totais</span>
        </div>
        <div class="stat-card" v-for="typeStat in stats.statsByType" :key="typeStat.type">
           <div class="icon-wrapper" :class="typeStat.type.includes('ndt') ? 'ndt' : 'req'">
             <svg v-if="typeStat.type.includes('ndt')" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.153.344c-1.32.083-2.643.083-3.963 0a5.988 5.988 0 01-2.153-.344c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c-1.01.143-2.01.317-3 .52m3-.52L2.62 15.698c-.122.499.106 1.028.589 1.202a5.989 5.989 0 002.153.344c1.32.083 2.643.083 3.963 0a5.989 5.989 0 002.153-.344c.483-.174.711-.703.59-1.202L5.25 4.971z" /></svg>
             <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.153 1.586m-5.8 0c-.379.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>
           </div>
          <span class="stat-value">{{ typeStat.count }}</span>
          <span class="stat-label">{{ formatTypeName(typeStat.type) }}</span>
        </div>
      </div>
    </section>

    <section class="logs-section">
      <h2>Últimos Cálculos Realizados</h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Tipo de Cálculo</th>
              <th>País / Estado</th>
              <th>Navegador</th>
              <th>Data e Hora</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in paginatedLogs" :key="log.id">
              <td>{{ formatTypeName(log.calculationType) }}</td>
              <td>{{ log.country || 'N/A' }}{{ log.region ? ` / ${log.region}` : '' }}</td>
              <td>{{ formatUserAgent(log.userAgent) }}</td>
              <td>{{ new Date(log.createdAt).toLocaleString('pt-BR') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination-controls">
        <span>Página {{ currentPage }} de {{ totalPages }}</span>
        <div>
          <button @click="prevPage" :disabled="currentPage === 1">Anterior</button>
          <button @click="nextPage" :disabled="currentPage === totalPages">Próximo</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  stats: { type: Object, required: true },
  logs: { type: Array, required: true }
});

// --- LÓGICA DA PAGINAÇÃO ---
const currentPage = ref(1);
const itemsPerPage = 10;

const totalPages = computed(() => {
  return Math.ceil(props.logs.length / itemsPerPage);
});

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return props.logs.slice(start, end);
});

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};
// --- FIM DA LÓGICA DA PAGINAÇÃO ---

const formatTypeName = (typeName) => {
  if (!typeName) return 'Desconhecido';
  if (typeName.includes('ndt')) return 'Cálculo de NDT';
  if (typeName.includes('requirement_especie_1')) return 'Exigências (Caprinos)';
  if (typeName.includes('requirement_especie_2')) return 'Exigências (Ovinos)';
  return typeName;
};

const formatUserAgent = (userAgent) => {
    if (!userAgent) return 'N/A';
    const match = userAgent.match(/\(([^)]+)\)/);
    if (match && match[1]) {
        const parts = match[1].split(';').map(p => p.trim());
        return parts.slice(0, 2).join('; ');
    }
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edg)\/[\d.]+/);
    return browserMatch ? browserMatch[0] : 'Navegador Desconhecido';
};
</script>

<style scoped>
/* Os estilos existentes podem ser mantidos, mas adicionamos os de paginação */
.stats-section, .logs-section { margin-bottom: 4rem; }
h2 { font-size: 1.8rem; color: var(--black); margin-bottom: 1.5rem; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; }
.stat-card { background-color: var(--white); padding: 1.5rem; border-radius: 12px; text-align: center; border: 1px solid var(--grey-light); box-shadow: 0 4px 15px rgba(0,0,0,0.03); display: flex; flex-direction: column; align-items: center; justify-content: center; }
.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  width: 50px;
  border-radius: 50%;
  margin-bottom: 1rem;
}
.icon-wrapper svg {
  height: 24px;
  width: 24px;
  color: var(--white);
}
.icon-wrapper.total { background-color: var(--black-light); }
.icon-wrapper.req { background-color: var(--orange); }
.icon-wrapper.ndt { background-color: var(--blue); }
.stat-value { display: block; font-size: 3.5rem; font-weight: 700; color: var(--black); line-height: 1; }
.stat-label { display: block; margin-top: 0.5rem; color: var(--black-light); font-weight: 500; font-size: 0.9rem; }
.table-container { width: 100%; overflow-x: auto; border: 1px solid var(--grey-light); border-radius: 8px; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 1rem; text-align: left; border-bottom: 1px solid var(--grey-light); white-space: nowrap; }
th { background-color: #f8f9fa; font-weight: 600; }
tbody tr:nth-child(even) { background-color: #fdfdfd; }

/* --- NOVOS ESTILOS PARA PAGINAÇÃO --- */
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding: 0 0.5rem;
}
.pagination-controls span {
  font-size: 0.9rem;
  color: var(--black-light);
  font-weight: 500;
}
.pagination-controls button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--grey);
  background-color: var(--white);
  border-radius: 6px;
  cursor: pointer;
  margin-left: 0.5rem;
  transition: all 0.2s ease;
}
.pagination-controls button:hover:not(:disabled) {
  background-color: var(--orange);
  color: var(--white);
  border-color: var(--orange);
}
.pagination-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>