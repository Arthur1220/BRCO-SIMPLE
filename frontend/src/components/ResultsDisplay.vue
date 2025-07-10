<template>
  <div class="results-wrapper">
    <div class="results-header">
      <h2>Resultados do Cálculo</h2>
      <div class="export-buttons">
        <button @click="exportToCsv" class="btn-export csv">Exportar CSV</button>
      </div>
    </div>

    <div class="highlight-grid">
      <div class="highlight-card" v-for="item in highlightedResults" :key="item.label">
        <span class="highlight-label">{{ item.label }}</span>
        <span class="highlight-value">{{ item.value }}<small>{{ item.unit }}</small></span>
      </div>
    </div>

    <div class="details-section">
      <h4 class="details-title">Todos os Parâmetros</h4>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Parâmetro</th>
              <th class="center" v-if="!hasMaxValue">Valor</th>
              <th class="center" v-if="hasMaxValue">Valor Requerido</th>
              <th class="center" v-if="hasMaxValue">Valor Máximo</th>
              <th class="center">Unidade</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="group in groupedResults" :key="group.theme">
              <tr class="group-header">
                <td :colspan="tableColumnCount">{{ group.theme }}</td>
              </tr>
              
              <template v-for="item in group.items" :key="item.key">
                <tr v-if="(item.value.valor ?? item.value.valor_requerido) > 0">
                  <td>{{ item.key }}</td>
                  <td class="center data-value">{{ item.value.valor ?? item.value.valor_requerido ?? 'N/A' }}</td>
                  <td v-if="hasMaxValue" class="center data-value">{{ item.value.valor_maximo ?? 'N/A' }}</td>
                  <td class="center">{{ item.value.tipo }}</td>
                </tr>
              </template>
              </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCalculationStore } from '@/stores/calculationStore';
import { generateCsv } from '@/services/apiService'; 
import { saveAs } from 'file-saver';

const store = useCalculationStore();

// Função para determinar o grupo de um parâmetro baseado em palavras-chave
const getThemeGroup = (key) => {
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes('consumo')) return 'Consumo';
  if (lowerKey.includes('energia')) return 'Energia';
  if (lowerKey.includes('proteína')) return 'Proteína';
  if (lowerKey.includes('ndt') || lowerKey.includes('nutrientes digestíveis')) return 'Energia';
  if (lowerKey.includes('cálcio')) return 'Minerais: Macrominerais';
  if (lowerKey.includes('fósforo')) return 'Minerais: Macrominerais';
  if (lowerKey.includes('relação ca:p')) return 'Minerais: Macrominerais';
  if (lowerKey.includes('magnésio')) return 'Minerais: Macrominerais';
  if (lowerKey.includes('sódio')) return 'Minerais: Macrominerais';
  if (lowerKey.includes('potássio')) return 'Minerais: Macrominerais';
  if (lowerKey.includes('cobre')) return 'Minerais: Microminerais';
  if (lowerKey.includes('ferro')) return 'Minerais: Microminerais';
  if (lowerKey.includes('manganês')) return 'Minerais: Microminerais';
  if (lowerKey.includes('zinco')) return 'Minerais: Microminerais';
  if (lowerKey.includes('cobalto')) return 'Minerais: Microminerais';
  if (lowerKey.includes('cromo')) return 'Minerais: Microminerais';
  return 'Outros Parâmetros';
};

// Computed property que agrupa os resultados por tema
const groupedResults = computed(() => {
  if (!store.results) return [];

  const groups = {};
  for (const key in store.results) {
    const theme = getThemeGroup(key);
    if (!groups[theme]) {
      groups[theme] = [];
    }
    groups[theme].push({ key, value: store.results[key] });
  }

  const groupOrder = ['Consumo', 'Energia', 'Proteína', 'Minerais: Macrominerais', 'Minerais: Microminerais', 'Outros Parâmetros'];
  
  return groupOrder
    .map(theme => ({
      theme: theme,
      items: groups[theme]
    }))
    .filter(group => group.items);
});

const hasMaxValue = computed(() => {
  if (!store.results) return false;
  return Object.values(store.results).some(item => typeof item.valor_maximo !== 'undefined');
});

// Computed property para saber quantas colunas a tabela tem (usado no colspan)
const tableColumnCount = computed(() => {
  return hasMaxValue.value ? 4 : 3;
});

// Computed property para extrair os resultados principais para os cards
const highlightedResults = computed(() => {
  if (!store.results) return [];
  const highlights = [];
  const results = store.results;
  if (store.calculationType === 'ndt') {
    if (results['Nutrientes digestíveis totais']) highlights.push({ label: 'Nutrientes Digestíveis Totais', value: results['Nutrientes digestíveis totais'].valor, unit: results['Nutrientes digestíveis totais'].tipo });
    if (results['Energia digestivel']) highlights.push({ label: 'Energia Digestível', value: results['Energia digestivel'].valor, unit: results['Energia digestivel'].tipo });
  } else if (store.calculationType === 'requirements') {
    if (results['Consumo de matéria seca']) highlights.push({ label: 'Consumo de Matéria Seca', value: results['Consumo de matéria seca'].valor_requerido, unit: results['Consumo de matéria seca'].tipo });
    if (results['Energia metabolizável total']) highlights.push({ label: 'Energia Metabolizável Total', value: results['Energia metabolizável total'].valor_requerido, unit: results['Energia metabolizável total'].tipo });
    if (results['Proteína bruta (g/dia)']) highlights.push({ label: 'Proteína Bruta', value: results['Proteína bruta (g/dia)'].valor_requerido, unit: results['Proteína bruta (g/dia)'].tipo });
  }
  return highlights;
});

const exportToCsv = async () => {
  if (!store.results || !store.lastFormData) {
    alert("Dados insuficientes para gerar o relatório.");
    return;
  }
  try {
    const payload = { 
      type: store.calculationType, 
      inputs: store.lastFormData, 
      results: store.results 
    };

    const blob = await generateCsv(payload);
    saveAs(blob, `relatorio_${store.calculationType}.csv`);
  } catch (error) {
    console.error('Erro ao gerar CSV:', error);
    alert('Não foi possível gerar o CSV.');
  }
};
</script>

<style scoped>
/* Os estilos que já definimos permanecem os mesmos */
.results-wrapper {
  margin-top: 2rem; padding: 2rem; background: linear-gradient(180deg, var(--white) 0%, #fdfdfd 100%);
  border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.05); border: 1px solid var(--grey-light);
}
.results-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;
  padding-bottom: 1.5rem; border-bottom: 1px solid var(--grey-light); flex-wrap: wrap; gap: 1rem;
}
h2 { color: var(--orange); margin: 0; }
.highlight-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem; margin-bottom: 3rem;
}
.highlight-card {
  background-color: var(--white); padding: 1.5rem; border-radius: 10px;
  border: 1px solid var(--grey-light); text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.03);
}
.highlight-label { display: block; font-size: 0.9rem; color: var(--black-light); margin-bottom: 0.5rem; }
.highlight-value { display: block; font-size: 2.5rem; font-weight: 700; color: var(--black); line-height: 1; }
.highlight-value small { font-size: 1rem; font-weight: 500; color: var(--black-light); margin-left: 0.5rem; }
.details-section .details-title { font-size: 1.2rem; color: var(--black); margin-bottom: 1rem; font-weight: 600; }
.table-container { width: 100%; overflow-x: auto; border: 1px solid var(--grey-light); border-radius: 8px; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid var(--grey-light); padding: 0.9rem 1rem; text-align: left; white-space: nowrap; }
th { background-color: #f8f9fa; font-weight: 600; font-size: 0.9rem; border-bottom-width: 2px; }
tbody tr:nth-child(odd) { background-color: #fdfdfd; }

/* Estilo para a linha de cabeçalho do grupo */
.group-header td {
  background-color: var(--grey-light);
  color: var(--black);
  font-weight: bold;
  font-size: 1rem;
  padding: 0.8rem 1rem;
  border-top: 2px solid var(--grey);
  border-bottom-width: 2px;
}
tbody tr.group-header:first-child td {
  border-top: none; /* Remove a borda de cima do primeiro grupo */
}

.center { text-align: center; }
.data-value { font-weight: 500; }
.export-buttons { display: flex; gap: 1rem; }
.btn-export { padding: 0.6rem 1.2rem; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; transition: all 0.3s; }
.btn-export:hover { transform: translateY(-2px); }
.btn-export.pdf { background-color: #e74c3c; }
.btn-export.pdf:hover { background-color: #c0392b; }
.btn-export.csv { background-color: #27ae60; }
.btn-export.csv:hover { background-color: #229954; }
</style>