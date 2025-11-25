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
      <div class="accordion-controls">
         <h4 class="details-title">Detalhamento</h4>
         <button @click="toggleAll" class="btn-toggle-all">
           {{ allExpanded ? 'Fechar Todos' : 'Abrir Todos' }}
         </button>
      </div>

      <div class="accordion-container">
        <div v-for="group in groupedResults" :key="group.theme" class="accordion-item">

          <div class="accordion-header" @click="toggleGroup(group.theme)" :class="{ active: expandedGroups[group.theme] }">
            <div class="header-left">
                <span class="toggle-icon">
                    <svg v-if="expandedGroups[group.theme]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </span>
                <span class="group-title">{{ group.theme }}</span>
            </div>

            <div class="header-summary" v-if="group.mainValue">
                <span class="summary-label">Total:</span>
                <span class="summary-value">{{ group.mainValue.valor }} <small>{{ group.mainValue.unit }}</small></span>
            </div>
          </div>

          <div v-show="expandedGroups[group.theme]" class="accordion-content">
            <table>
              <thead>
                <tr>
                  <th>Parâmetro</th>
                  <th class="center">Valor {{ hasMaxValue ? 'Requerido' : '' }}</th>
                  <th class="center" v-if="hasMaxValue">Valor Máximo</th>
                  <th class="center">Unidade</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in group.items" :key="item.key">
                  <template v-if="(item.value.valor ?? item.value.valor_requerido) > 0">
                      <td>{{ item.key }}</td>
                      <td class="center data-value">{{ item.value.valor ?? item.value.valor_requerido ?? 'N/A' }}</td>
                      <td v-if="hasMaxValue" class="center data-value">{{ item.value.valor_maximo ?? 'N/A' }}</td>
                      <td class="center">{{ item.value.tipo }}</td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
import { useCalculationStore } from '@/stores/calculationStore';
import { generateCsv } from '@/services/apiService';
import { saveAs } from 'file-saver';

const store = useCalculationStore();

const expandedGroups = reactive({});
const allExpanded = ref(false);

const toggleGroup = (theme) => {
    expandedGroups[theme] = !expandedGroups[theme];
};

const toggleAll = () => {
    allExpanded.value = !allExpanded.value;
    groupedResults.value.forEach(g => {
        expandedGroups[g.theme] = allExpanded.value;
    });
};

const getThemeGroup = (key) => {
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes('consumo')) return 'Consumo';
  if (lowerKey.includes('energia')) return 'Energia';
  if (lowerKey.includes('proteína')) return 'Proteína';
  if (lowerKey.includes('ndt') || lowerKey.includes('nutrientes digestíveis')) return 'Energia';
  if (lowerKey.includes('cálcio') || lowerKey.includes('fósforo') || lowerKey.includes('relação ca:p') || lowerKey.includes('magnésio') || lowerKey.includes('sódio') || lowerKey.includes('potássio')) return 'Macrominerais';
  if (lowerKey.includes('cobre') || lowerKey.includes('ferro') || lowerKey.includes('manganês') || lowerKey.includes('zinco') || lowerKey.includes('cobalto') || lowerKey.includes('cromo')) return 'Microminerais';
  return 'Outros Parâmetros';
};

const getMainValueForGroup = (theme, items) => {
    let mainKey = null;
    if (theme === 'Energia') mainKey = 'Nutrientes digestíveis totais1';
    else if (theme === 'Proteína') mainKey = 'Proteína metabolizável total';
    else if (theme === 'Consumo') mainKey = 'Consumo de matéria seca 1';

    if (mainKey) {
        const found = items.find(i => i.key === mainKey);
        if (found) {
            return {
                valor: found.value.valor ?? found.value.valor_requerido,
                unit: found.value.tipo
            };
        }
    }
    return null;
};

const groupedResults = computed(() => {
  if (!store.results) return [];

  const groups = {};
  for (const key in store.results) {
    const theme = getThemeGroup(key);
    if (!groups[theme]) groups[theme] = [];
    groups[theme].push({ key, value: store.results[key] });
  }

  const groupOrder = ['Consumo', 'Energia', 'Proteína', 'Macrominerais', 'Microminerais', 'Outros Parâmetros'];

  return groupOrder
    .map(theme => {
        const items = groups[theme] || [];
        return {
            theme: theme,
            items: items,
            mainValue: getMainValueForGroup(theme, items)
        };
    })
    .filter(group => group.items.length > 0);
});

const hasMaxValue = computed(() => {
  if (!store.results) return false;
  return Object.values(store.results).some(item => typeof item.valor_maximo !== 'undefined');
});

import { watch } from 'vue';
watch(() => store.results, () => {
    groupedResults.value.forEach(g => expandedGroups[g.theme] = false); // Começa fechado
});

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
/* =========================================
   1. Layout Principal & Cabeçalho
   ========================================= */
.results-wrapper {
  margin-top: 2rem;
  padding: 2rem;
  background: linear-gradient(180deg, var(--white) 0%, #fdfdfd 100%);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--grey-light);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--grey-light);
  flex-wrap: wrap; /* Garante que os botões caiam pra linha de baixo no mobile */
  gap: 1rem;
}

h2 {
  color: var(--orange);
  margin: 0;
}

/* =========================================
   2. Cards de Destaque (Highlights)
   ========================================= */
.highlight-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.highlight-card {
  background-color: var(--white);
  padding: 1.5rem;
  border-radius: 10px;
  border: 1px solid var(--grey-light);
  text-align: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
}

.highlight-label {
  display: block;
  font-size: 0.9rem;
  color: var(--black-light);
  margin-bottom: 0.5rem;
}

.highlight-value {
  display: block;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--black);
  line-height: 1;
}

.highlight-value small {
  font-size: 1rem;
  font-weight: 500;
  color: var(--black-light);
  margin-left: 0.5rem;
}

/* =========================================
   3. Componente Accordion (Lista Expansível)
   ========================================= */
/* Controles Superiores (Título + Botão Expandir) */
.accordion-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.details-title {
  font-size: 1.2rem;
  color: var(--black);
  margin: 0;
  font-weight: 600;
}

.btn-toggle-all {
  background: none;
  border: none;
  color: var(--blue);
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
}

.btn-toggle-all:hover {
  text-decoration: underline;
}

/* Estrutura do Accordion */
.accordion-container {
  border: 1px solid var(--grey-light);
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.accordion-item {
  border-bottom: 1px solid var(--grey-light);
}

.accordion-item:last-child {
  border-bottom: none;
}

/* Cabeçalho do Item (Clicável) */
.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  cursor: pointer;
  background-color: #f8f9fa;
  transition: background-color 0.2s;
  user-select: none; /* Evita seleção de texto ao clicar rápido */
}

.accordion-header:hover {
  background-color: #f1f3f5;
}

.accordion-header.active {
  background-color: #e9ecef;
  border-bottom: 1px solid var(--grey-light);
}

/* Conteúdo Esquerdo do Header */
.header-left {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.toggle-icon svg {
  width: 18px;
  height: 18px;
  color: var(--grey);
  transition: transform 0.2s;
}

.group-title {
  font-weight: 700;
  color: var(--black);
  font-size: 1rem;
}

/* Resumo Direito do Header */
.header-summary {
  font-size: 0.9rem;
  color: var(--black-light);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.summary-label {
  font-weight: 500;
}

.summary-value {
  font-weight: 700;
  color: var(--black);
}

/* Área de Conteúdo Expansível */
.accordion-content {
  background-color: white;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* =========================================
   4. Tabela Interna (Dentro do Accordion)
   ========================================= */
.accordion-content table {
  width: 100%;
  border-collapse: collapse;
}

.accordion-content th,
.accordion-content td {
  padding: 0.8rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.accordion-content th {
  background-color: white;
  font-size: 0.85rem;
  color: var(--black-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #f0f0f0;
}

.accordion-content tr:last-child td {
  border-bottom: none;
}

/* =========================================
   5. Botões de Exportação & Utilitários
   ========================================= */
.export-buttons {
  display: flex;
  gap: 1rem;
}

.btn-export {
  padding: 0.6rem 1.2rem;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

.btn-export:hover {
  transform: translateY(-2px); /* Leve subida ao passar o mouse */
}

/* Variantes de Cor */
.btn-export.pdf {
  background-color: #e74c3c;
}

.btn-export.csv {
  background-color: #27ae60;
}

/* Utilitários */
.center {
  text-align: center;
}

.data-value {
  font-weight: 500;
}
</style>
