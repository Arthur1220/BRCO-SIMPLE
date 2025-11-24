<template>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="icon-wrapper total">
         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
      </div>
      <span class="stat-value">{{ stats.totalCalculations }}</span>
      <span class="stat-label">Total de Cálculos</span>
    </div>

    <div class="stat-card" v-for="typeStat in stats.statsByType" :key="typeStat.type">
      <div class="icon-wrapper" :class="getIconClass(typeStat.type)">

        <svg v-if="typeStat.type.includes('ndt')" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
        </svg>

        <svg v-else-if="typeStat.type.includes('diet')" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.153.344c-1.32.083-2.643.083-3.963 0a5.988 5.988 0 01-2.153-.344c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c-1.01.143-2.01.317-3 .52m3-.52L2.62 15.698c-.122.499.106 1.028.589 1.202a5.989 5.989 0 002.153.344c1.32.083 2.643.083 3.963 0a5.989 5.989 0 002.153-.344c.483-.174.711-.703.59-1.202L5.25 4.971z" />
        </svg>

        <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.153 1.586m-5.8 0c-.379.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
        </svg>

      </div>
      <span class="stat-value">{{ typeStat.count }}</span>
      <span class="stat-label">{{ formatTypeName(typeStat.type) }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({ stats: { type: Object, required: true } });

const formatTypeName = (typeName) => {
  if (typeName.includes('ndt')) return 'Cálculo NDT';
  if (typeName.includes('diet')) return 'Formulação Dieta';
  if (typeName.includes('requirement')) return 'Exigências';
  return 'Outros';
};

const getIconClass = (typeName) => {
    if (typeName.includes('ndt')) return 'ndt'; // Azul
    if (typeName.includes('diet')) return 'diet'; // Verde
    return 'req'; // Laranja
};
</script>

<style scoped>
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
.stat-card { background-color: var(--white); padding: 1.5rem; border-radius: 12px; text-align: center; border: 1px solid var(--grey-light); box-shadow: 0 4px 15px rgba(0,0,0,0.03); display: flex; flex-direction: column; align-items: center; }
.stat-value { font-size: 2.5rem; font-weight: 700; color: var(--black); margin: 0.5rem 0; }
.stat-label { color: var(--black-light); font-weight: 500; font-size: 0.9rem; }
.icon-wrapper { height: 40px; width: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem; }
.icon-wrapper svg { height: 28px; width: 28px; color: white; }

/* CORES DOS ÍCONES */
.icon-wrapper.total { background-color: var(--black-light); }
.icon-wrapper.req { background-color: var(--orange); } /* Laranja para Exigências */
.icon-wrapper.ndt { background-color: #3498db; } /* Azul para NDT */
.icon-wrapper.diet { background-color: #27ae60; } /* Verde para Dieta */
</style>
