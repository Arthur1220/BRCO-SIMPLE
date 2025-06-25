<template>
  <div class="form-container">
    <form @submit.prevent="handleSubmit">
      <div class="form-section">
        <label>Espécie:</label>
        <div class="radio-group">
          <label>
            <input type="radio" value="1" v-model="formData.especieId" required> Caprino
          </label>
          <label>
            <input type="radio" value="2" v-model="formData.especieId" required> Ovino
          </label>
        </div>
      </div>

      <div class="form-section" v-if="formData.especieId === '1'">
        <label for="categoriaAnimal">Genótipo animal:</label>
        <select id="categoriaAnimal" v-model="formData.categoriaAnimalId">
          <option :value="1">Leiteiro</option>
          <option :value="2">Nativa</option>
          <option :value="3">Corte</option>
        </select>
      </div>
      
      <div class="form-section">
        <label for="sexo">Sexo:</label>
        <select id="sexo" v-model="formData.sexoId">
            <option :value="1">Macho Inteiro</option>
            <option :value="2">Macho Castrado</option>
            <option v-if="formData.especieId === '1'" :value="3">Fêmea</option>
        </select>
      </div>
      
      <div class="form-section">
        <label for="pesoInicial">Peso Corporal Inicial (kg):</label>
        <input v-model.number="formData.pesoInicial" type="number" step="0.1" id="pesoInicial" required placeholder="Ex: 20"/>
      </div>

      <div class="form-section">
        <label for="pesoFinal">Peso Corporal Final (kg):</label>
        <input v-model.number="formData.pesoFinal" type="number" step="0.1" id="pesoFinal" required placeholder="Ex: 30"/>
      </div>

      <div class="form-section">
        <label for="GMD">Ganho Médio Diário (g/dia):</label>
        <input v-model.number="formData.GMD" type="number" id="GMD" required placeholder="Ex: 150"/>
      </div>
          
      <button type="submit" :disabled="store.isLoading">
        {{ store.isLoading ? 'Calculando...' : 'Calcular Exigências' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { useCalculationStore } from '@/stores/calculationStore';

const store = useCalculationStore();

const formData = reactive({
  especieId: "1",
  categoriaAnimalId: 1,
  sexoId: 1,
  pesoInicial: null,
  pesoFinal: null,
  GMD: null,
});

const handleSubmit = async () => {
  // Limpa o estado anterior antes de um novo cálculo
  store.results = null;
  store.error = null;
  
  await store.performCalculation('requirements', formData);
};
</script>

<style scoped>
.form-container {
  background: var(--white);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  border: 1px solid var(--grey-light);
}
.form-section {
  margin-bottom: 1.5rem;
}
label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
}
input[type="number"], select {
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
</style>