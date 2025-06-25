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
          <label for="FDN">FDN (%MS):</label>
          <input type="number" step="0.01" v-model.number="formData.FDN" required placeholder="Fibra em detergente neutro">
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
          <input type="number" step="0.01" v-model.number="formData.PIDN" placeholder="Proteína insolúvel em detergente neutro">
        </div>

        <div class="form-section">
          <label for="PIDA">PIDA (%MS):</label>
          <input type="number" step="0.01" v-model.number="formData.PIDA" placeholder="Proteína insolúvel em detergente ácido">
        </div>
      </div>

      <button type="submit" :disabled="store.isLoading">
        {{ store.isLoading ? 'Calculando...' : 'Calcular NDT' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
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

const handleSubmit = async () => {
  if (option.value === 'nao') {
    formData.PIDN = 0;
    formData.PIDA = 0;
  }
  
  store.results = null;
  store.error = null;

  await store.performCalculation('ndt', formData);
};
</script>

<style scoped>
/* Estilos similares ao ExigenciasForm para consistência */
.form-container {
  background: var(--white);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
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
label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
}
input[type="number"] {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid var(--grey);
  border-radius: 5px;
  font-size: 1rem;
}
.radio-group {
  display: flex;
  gap: 2rem;
}
.radio-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
}
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
@media (max-width: 600px) {
  .grid-2-cols {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>