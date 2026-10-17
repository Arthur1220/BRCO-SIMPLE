<template>
  <div class="diet-results" v-if="solution">

    <div class="recipe-section">
      <h4 class="section-title">Receita Sugerida (Base Matéria Seca)</h4>
      <div class="table-container">
        <table class="recipe-table">
          <thead>
            <tr>
              <th>Ingrediente</th>
              <th class="center">Proporção Final (%)</th>
              <th class="center">Quantidade (kg MS/dia)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(ing, index) in solution.ingredients" :key="index">
              <td><strong>{{ ing.name }}</strong></td>
              <td class="center highlight-cell">{{ formatNum(ing.percent) }}%</td>
              <td class="center">{{ formatNum(ing.kgPerDay, 3) }} kg</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <hr class="divider">

    <div class="summary-cards">
      <div class="card">
        <span class="label">Consumo Total Estimado (MS)</span>
        <span class="value">{{ formatNum(solution.totals.intakeKgPerDay) }} kg</span>
      </div>
       <div class="card">
        <span class="label">Custo Total Estimado</span>
        <span class="value">R$ {{ formatNum(solution.totals.costPerDay) }}</span>
      </div>
    </div>

    <div class="balance-section">
      <h4 class="section-title">Análise Nutricional (Balanço)</h4>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Nutriente</th>
              <th class="center">Requerido (Meta)</th>
              <th class="center">Fornecido (Dieta)</th>
              <th class="center">Balanço</th>
              <th class="center">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in solution.balance" :key="item.code">
              <td>{{ item.label }} ({{ item.unit }})</td>
              <td class="center">{{ formatNum(item.required) }}</td>
              <td class="center">{{ formatNum(item.supplied) }}</td>
              <td class="center" :class="item.status === 'deficit' ? 'text-red' : 'text-green'">
                {{ item.diff > 0 ? '+' : '' }}{{ formatNum(item.diff) }}
              </td>
              <td class="center">
                <span class="status-badge" :class="STATUS_CLASS[item.status]">{{ item.statusLabel }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="export-row">
      <button @click="exportToCsv" class="btn-export" :disabled="isExporting">
        {{ isExporting ? 'Gerando...' : 'Exportar CSV' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useDietStore } from '@/stores/dietStore';
import { downloadCalculationCsv } from '@/services/apiService';
import { parseApiError, API_LOCALE } from '@/services/axiosSetup';
import { saveAs } from 'file-saver';

// kg/dia, custo, balanço e status vêm calculados da API v1.
const store = useDietStore();
const solution = computed(() => store.dietResults?.solution);
const isExporting = ref(false);

// Apenas aparência: cor do selo por status.
const STATUS_CLASS = { ideal: 'badge-success', deficit: 'badge-warning', excess: 'badge-info', info: 'badge-info' };

const formatNum = (num, decimals = 2) =>
  Number(num || 0).toLocaleString(API_LOCALE, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const exportToCsv = async () => {
  isExporting.value = true;
  try {
    const { blob, filename } = await downloadCalculationCsv(store.dietResults.calculationId);
    saveAs(blob, filename);
  } catch (error) {
    alert(parseApiError(error, 'Não foi possível gerar o CSV.').message);
  } finally {
    isExporting.value = false;
  }
};
</script>

<style scoped>
/* =========================================
   1. Container Principal & Estrutura
   ========================================= */
.diet-results {
  background: var(--white);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  margin-top: 2rem;
  border: 1px solid var(--grey-light);
}

.recipe-section {
  margin-bottom: 2rem;
}

.divider {
  border: 0;
  height: 1px;
  background: var(--grey-light);
  margin: 2rem 0;
}

/* =========================================
   2. Tipografia e Títulos
   ========================================= */
.section-title {
  color: var(--black);
  font-size: 1.2rem;
  margin-top: 0;
  margin-bottom: 1rem;
  border-left: 4px solid var(--orange); /* Detalhe visual na esquerda */
  padding-left: 10px;
}

/* =========================================
   3. Cards de Resumo (KPIs)
   ========================================= */
.summary-cards {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.card {
  background: #f8f9fa;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--grey-light);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1; /* Faz os cards ocuparem a mesma largura */
}

.card .label {
  font-size: 0.9rem;
  color: var(--black-light);
  margin-bottom: 0.3rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card .value {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--orange);
}

/* =========================================
   4. Tabelas de Dados
   ========================================= */
.table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid var(--grey-light);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.9rem 1.2rem;
  text-align: left;
  border-bottom: 1px solid var(--grey-light);
}

th {
  background-color: #f1f3f5;
  font-weight: 700;
  color: var(--black);
  font-size: 0.95rem;
}

.center {
  text-align: center;
}

/* Destaque para células específicas (ex: Total) */
.highlight-cell {
  font-weight: bold;
  color: var(--blue-dark);
  background-color: #f0f7ff;
}

/* =========================================
   5. Indicadores, Cores e Badges
   ========================================= */
/* Cores de Texto Utilitárias */
.text-red {
  color: #e74c3c;
  font-weight: bold;
}

.text-green {
  color: #27ae60;
  font-weight: bold;
}

/* Badges de Status */
.status-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
  display: inline-block;
  min-width: 80px;
  text-align: center; /* Adicionado para centralizar texto dentro do badge */
}

.badge-success { background-color: #27ae60; }
.badge-warning { background-color: #e74c3c; }
.badge-info    { background-color: #3498db; }

/* =========================================
   6. Responsividade (Mobile)
   ========================================= */
@media (max-width: 600px) {
  .summary-cards {
    flex-direction: column; /* Empilha os cards verticalmente */
  }
}

/* =========================================
   Exportação (API v1)
   ========================================= */
.export-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn-export {
  padding: 0.7rem 1.5rem;
  border: 1px solid var(--orange);
  color: var(--orange);
  background: transparent;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
}

.btn-export:disabled {
  opacity: 0.6;
  cursor: wait;
}
</style>
