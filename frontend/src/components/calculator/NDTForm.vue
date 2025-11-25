<template>
  <div class="form-container">
    <form @submit.prevent="handleSubmit">

      <div class="grid-2-cols">
        <div class="form-section">
          <label for="PB">Proteína Bruta (PB, %MS):</label>
          <input type="number" step="0.01" v-model.number="formData.PB" required placeholder="Ex: 12.5">
        </div>

        <div class="form-section">
          <label for="EE">Extrato Etéreo (EE, %MS):</label>
          <input type="number" step="0.01" v-model.number="formData.EE" required placeholder="Ex: 3.5">
        </div>

        <div class="form-section">
          <label for="FDN">Fibra em Detergente Neutro (FDN, %MS):</label>
          <input type="number" step="0.01" v-model.number="formData.FDN" required placeholder="Ex: 60.0">
        </div>

        <div class="form-section">
          <label for="Ligrina">Lignina (%MS):</label>
          <input type="number" step="0.01" v-model.number="formData.Ligrina" required placeholder="Ex: 5.0">
        </div>
      </div>

      <div class="form-section">
          <label for="MO">Matéria Orgânica (MO, %MS):</label>
          <input type="number" step="0.01" v-model.number="formData.MO" required placeholder="Ex: 90">
      </div>

      <div class="form-section">
        <label>Possui valor de PIDN e PIDA?</label>
        <div class="radio-group">
          <label>
            <input type="radio" value="sim" v-model="option" required> Sim
          </label>
          <label>
            <input type="radio" value="nao" v-model="option" required> Não
          </label>
        </div>
      </div>

      <div v-if="option === 'sim'" class="grid-2-cols">
        <div class="form-section">
          <label for="PIDN">PIDN (%MS):</label>
          <input type="number" step="0.01" v-model.number="formData.PIDN" placeholder="Ex: 2.5">
        </div>

        <div class="form-section">
          <label for="PIDA">PIDA (%MS):</label>
          <input type="number" step="0.01" v-model.number="formData.PIDA" placeholder="Ex: 1.0">
        </div>
      </div>

      <button type="submit" :disabled="store.isLoading">
        {{ store.isLoading ? 'Calculando...' : 'Calcular NDT' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useCalculationStore } from '@/stores/calculationStore';

const store = useCalculationStore();
const option = ref('nao');

const formData = reactive({
  PB: null,
  EE: null,
  FDN: null,
  Ligrina: null,
  MO: null,
  PIDN: 0,
  PIDA: 0,
});

onMounted(() => {
  if (store.lastFormData && store.calculationType === 'ndt') {
    Object.assign(formData, store.lastFormData);

    if (formData.PIDN > 0 || formData.PIDA > 0) {
      option.value = 'sim';
    } else {
      option.value = 'nao';
    }
  }
});

const handleSubmit = async () => {
  const payload = {
    PB: Number(formData.PB) || 0,
    EE: Number(formData.EE) || 0,
    FDN: Number(formData.FDN) || 0,
    Ligrina: Number(formData.Ligrina) || 0,
    MO: Number(formData.MO) || 0,
    PIDN: option.value === 'sim' ? (Number(formData.PIDN) || 0) : 0,
    PIDA: option.value === 'sim' ? (Number(formData.PIDA) || 0) : 0,
  };

  await store.performCalculation('ndt', payload);
};
</script>

<style scoped>
/* =========================================
   1. Containers & Layout do Formulário
   ========================================= */
.form-container {
  background: var(--white);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--grey-light);
}

.grid-2-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-section {
  margin-bottom: 1.5rem;
}

/* =========================================
   2. Elementos de Entrada (Inputs & Labels)
   ========================================= */
label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: var(--black-light);
}

input[type="number"] {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid var(--grey);
  border-radius: 5px;
  font-size: 1rem;
}

/* Grupo de Radio Buttons */
.radio-group {
  display: flex;
  gap: 2rem;
}

.radio-group label {
  /* Alinhamento flex para ícone/texto do radio */
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
}

/* =========================================
   3. Botões & Interações
   ========================================= */
button {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: bold;
  margin-top: 1rem;
  background-color: var(--orange);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:disabled {
  background-color: var(--grey);
  cursor: not-allowed;
}

button:not(:disabled):hover {
  background-color: var(--light-orange);
}

/* =========================================
   4. Responsividade (Mobile)
   ========================================= */
@media (max-width: 600px) {
  .grid-2-cols {
    grid-template-columns: 1fr; /* Transforma grid em coluna única */
    gap: 0;
  }

  .form-section {
    margin-bottom: 1rem;
  }
}
</style>
