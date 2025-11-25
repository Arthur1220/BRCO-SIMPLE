<template>
  <div class="diet-balancer">
    <div class="header-row">
      <h4>Ingredientes Selecionados</h4>
      <small class="hint">Defina preço e limites para otimizar</small>
    </div>

    <div v-if="store.selectedIngredients.length === 0" class="empty-state">
      <p>Nenhum alimento selecionado.</p>
    </div>

    <div v-else class="ingredients-list">
      <div class="list-header">
        <span class="col-name">Alimento</span>
        <span class="col-input">Preço (R$)</span> <span class="col-input">Mín (%)</span>
        <span class="col-input">Máx (%)</span>
        <span class="col-action"></span>
      </div>

      <div
        v-for="(item, index) in store.selectedIngredients"
        :key="index"
        class="ingredient-row"
      >
        <div class="ing-name-wrapper">
          <div class="ing-name" :title="item.name">{{ item.name }}</div>
          <div class="result-badge" v-if="item.percent > 0">{{ item.percent }}%</div>
        </div>

        <div class="ing-controls">
          <div class="input-wrapper">
            <input
              type="number"
              v-model.number="item.price"
              class="input-price"
              placeholder="0.00"
              step="0.01"
            >
            <span class="unit-label">R$/kg</span>
          </div>

          <div class="input-wrapper">
            <input
              type="number"
              v-model.number="item.min"
              class="input-limit"
              placeholder="0"
            >
            <span class="unit-label">Mín</span>
          </div>

          <div class="input-wrapper">
            <input
              type="number"
              v-model.number="item.max"
              class="input-limit"
              placeholder="100"
            >
             <span class="unit-label">Máx</span>
          </div>
        </div>

        <button @click="store.removeIngredient(index)" class="btn-remove" title="Remover">
          &times;
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDietStore } from '@/stores/dietStore';

const store = useDietStore();
</script>

<style scoped>
/* =========================================
   1. Estrutura Principal & Mensagens
   ========================================= */
.diet-balancer {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.hint {
  color: var(--black-light);
  font-size: 0.8rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  background: #f9f9f9;
  border: 1px dashed var(--grey);
  border-radius: 8px;
  color: var(--black-light);
}

/* =========================================
   2. Cabeçalhos da Lista (Desktop)
   ========================================= */
.list-header {
  display: grid;
  /* Define as colunas: Nome (maior) | 3 Inputs | Espaço do botão */
  grid-template-columns: 1.5fr 1fr 1fr 1fr 30px;
  gap: 10px;
  padding: 0 10px 5px;
  font-size: 0.8rem;
  font-weight: bold;
  color: var(--black-light);
  text-align: center;
}

.col-name {
  text-align: left;
}

/* =========================================
   3. Linha do Ingrediente (Row/Card)
   ========================================= */
.ingredient-row {
  display: grid;
  grid-template-columns: 1.5fr 3fr 30px; /* Nome | Wrapper dos Inputs | Botão */
  gap: 10px;
  align-items: center;
  padding: 1rem;
  background: #fff;
  border: 1px solid var(--grey-light);
  border-radius: 8px;
  transition: box-shadow 0.2s;
}

.ingredient-row:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Informações do Nome (Esquerda) */
.ing-name-wrapper {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.ing-name {
  font-weight: 600;
  color: var(--black);
  font-size: 0.95rem;
  line-height: 1.2;
}

.result-badge {
  background-color: var(--blue);
  color: white;
  font-size: 0.8rem;
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
  font-weight: bold;
}

/* =========================================
   4. Inputs e Controles
   ========================================= */
.ing-controls {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr; /* Divide o espaço dos inputs igualmente */
  gap: 8px;
}

.input-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
}

/* Estilo Base do Input */
input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--grey);
  border-radius: 6px;
  text-align: center;
  font-size: 0.95rem;
  font-weight: 500;
}

input:focus {
  outline: 2px solid var(--orange);
  border-color: transparent;
}

/* Variações de Input */
.input-price {
  color: var(--green-dark);
  border-color: #a5d6a7;
  background-color: #f1f8e9; /* Verde bem claro */
}

.input-limit {
  color: var(--black-light);
  background-color: #fafafa;
}

.unit-label {
  font-size: 0.7rem;
  color: var(--black-light);
  text-align: center;
  margin-top: 2px;
}

/* =========================================
   5. Botões de Ação
   ========================================= */
.btn-remove {
  background: none;
  border: none;
  color: var(--grey);
  font-size: 1.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 5px; /* Ajuste visual para alinhar o ícone "x" */
}

.btn-remove:hover {
  color: var(--red-error);
}

/* =========================================
   6. Responsividade (Mobile)
   ========================================= */
@media (max-width: 768px) {
  .list-header {
    display: none; /* Esconde o cabeçalho da tabela no mobile */
  }

  .ingredient-row {
    grid-template-columns: 1fr; /* Empilha tudo em uma coluna */
    gap: 1rem;
    position: relative; /* Necessário para posicionar o botão de remover */
  }

  .btn-remove {
    position: absolute;
    right: 10px;
    top: 5px;
  }
}
</style>
