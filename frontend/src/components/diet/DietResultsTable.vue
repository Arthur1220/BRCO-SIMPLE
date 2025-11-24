<template>
  <div class="diet-results" v-if="store.dietResults">

    <div class="recipe-section">
      <h4 class="section-title">Receita Sugerida (Base Matéria Seca)</h4>
      <div class="table-container">
        <table class="recipe-table">
          <thead>
            <tr>
              <th>Ingrediente</th>
              <th class="center">Proporção Final (%)</th>
              <th class="center">Quantidade (kg/dia)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(ing, index) in store.dietResults.optimizedIngredients" :key="index">
              <td><strong>{{ ing.name }}</strong></td>
              <td class="center highlight-cell">{{ formatNum(ing.percent) }}%</td>
              <td class="center">
                {{ calculateKg(ing.percent) }} kg
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <hr class="divider">

    <div class="summary-cards">
      <div class="card">
        <span class="label">Consumo Total Estimado (MS)</span>
        <span class="value">{{ formatNum(store.dietResults.dietSupply['Consumo Estimado (g)'] / 1000) }} kg</span>
      </div>
       <div class="card">
        <span class="label">Custo Total Estimado</span>
        <span class="value">R$ {{ formatNum(store.dietResults.dietSupply['Custo Total']) }}</span>
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
            <tr v-for="(data, nutrient) in store.dietResults.dietBalance" :key="nutrient">
              <td>{{ nutrient }} ({{ data.unit }})</td>
              <td class="center">{{ data.required }}</td>
              <td class="center">{{ data.supplied }}</td>
              <td class="center" :class="getBalanceClass(data.diff)">
                {{ data.diff > 0 ? '+' : '' }}{{ data.diff }}
              </td>
              <td class="center">
                <span class="status-badge" :class="getStatusClass(data.diff, data.required)">
                  {{ getStatusLabel(data.diff, data.required) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDietStore } from '@/stores/dietStore';

const store = useDietStore();

const formatNum = (num) => {
  return num ? Number(num).toFixed(2) : '0.00';
};

// Função para calcular kg de cada alimento com base no CMS Total
const calculateKg = (percent) => {
  const totalCMS_g = store.dietResults.dietSupply['Consumo Estimado (g)'];
  const amount_g = totalCMS_g * (percent / 100);
  return (amount_g / 1000).toFixed(3); // Retorna em kg com 3 casas
};

const getBalanceClass = (diff) => {
  if (diff < -0.1) return 'text-red'; // Falta (com pequena margem)
  return 'text-green'; // Sobra ou igual
};

const getStatusClass = (diff, required) => {
  if (required === 0) return 'badge-info';
  const percentDiff = (diff / required) * 100;

  // Tolerância de +/- 5% é considerada Ideal
  if (Math.abs(percentDiff) <= 5 || (diff >= 0 && diff < 0.1)) return 'badge-success';
  if (diff < 0) return 'badge-warning'; // Déficit
  return 'badge-info'; // Excesso
};

const getStatusLabel = (diff, required) => {
  if (required === 0) return 'Informativo';
  const percentDiff = (diff / required) * 100;

  if (Math.abs(percentDiff) <= 5 || (diff >= 0 && diff < 0.1)) return 'Ideal';
  if (diff < 0) return 'Déficit';
  return 'Excesso';
};
</script>

<style scoped>
.diet-results {
  background: var(--white);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  margin-top: 2rem;
  border: 1px solid var(--grey-light);
}

.section-title {
  color: var(--black);
  font-size: 1.2rem;
  margin-top: 0;
  margin-bottom: 1rem;
  border-left: 4px solid var(--orange);
  padding-left: 10px;
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
  flex: 1;
}

.card .label { font-size: 0.9rem; color: var(--black-light); margin-bottom: 0.3rem; text-transform: uppercase; letter-spacing: 0.5px; }
.card .value { font-size: 1.8rem; font-weight: 800; color: var(--orange); }

.table-container { overflow-x: auto; border-radius: 8px; border: 1px solid var(--grey-light); }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 0.9rem 1.2rem; text-align: left; border-bottom: 1px solid var(--grey-light); }
th { background-color: #f1f3f5; font-weight: 700; color: var(--black); font-size: 0.95rem; }
.center { text-align: center; }

.highlight-cell {
  font-weight: bold;
  color: var(--blue-dark);
  background-color: #f0f7ff;
}

.text-red { color: #e74c3c; font-weight: bold; }
.text-green { color: #27ae60; font-weight: bold; }

.status-badge { padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.8rem; font-weight: bold; color: white; display: inline-block; min-width: 80px;}
.badge-success { background-color: #27ae60; }
.badge-warning { background-color: #e74c3c; }
.badge-info { background-color: #3498db; }

@media (max-width: 600px) {
  .summary-cards { flex-direction: column; }
}
</style>
