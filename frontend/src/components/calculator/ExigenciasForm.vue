<template>
  <div class="form-container">
    <form @submit.prevent="handleSubmit">
      <div class="form-section">
        <label>Espécie:</label>
        <div class="radio-group">
          <label>
            <input type="radio" :value="1" v-model="formData.especieId" required> Caprino
          </label>
          <label>
            <input type="radio" :value="2" v-model="formData.especieId" required> Ovino
          </label>
        </div>
      </div>

      <div class="form-section" v-if="formData.especieId === 1">
        <label for="categoriaAnimal">Genótipo animal:</label>
        <select id="categoriaAnimal" v-model="formData.categoriaAnimalId">
          <option v-for="type in genotipos" :key="type.id" :value="type.id">
            {{ type.name }}
          </option>
        </select>
      </div>

      <div class="form-section">
        <label for="sexo">Sexo:</label>
        <select id="sexo" v-model="formData.sexoId">
            <option :value="1">Macho Inteiro</option>
            <option :value="2">Macho Castrado</option>
            <option v-if="formData.especieId === 1" :value="3">Fêmea</option>
        </select>
      </div>

      <div class="grid-2-cols">
        <div class="form-section">
          <label for="pesoInicial">Peso Corporal Inicial (kg):</label>
          <input v-model.number="formData.pesoInicial" type="number" step="0.1" id="pesoInicial" required placeholder="Ex: 20"/>
        </div>
        <div class="form-section">
          <label for="pesoFinal">Peso Corporal Final (kg):</label>
          <input v-model.number="formData.pesoFinal" type="number" step="0.1" id="pesoFinal" required placeholder="Ex: 30"/>
        </div>
      </div>
      <div class="form-section">
        <label for="GMD">Ganho Médio Diário (g/dia):</label>
        <input v-model.number="formData.GMD" type="number" id="GMD" required placeholder="Ex: 150"/>
      </div>

      <button type="submit" :disabled="store.isLoading">
         {{ isDietMode ? 'Confirmar Dados do Animal' : (store.isLoading ? 'Calculando...' : 'Calcular Exigências') }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, watch, onMounted } from 'vue';
import { useCalculationStore } from '@/stores/calculationStore';
import { useDietStore } from '@/stores/dietStore';

const store = useCalculationStore();
const dietStore = useDietStore();

const props = defineProps({
  isDietMode: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['submit-data']);

const genotipos = ref([
  { id: 1, name: 'Leiteiro' },
  { id: 2, name: 'Nativa' },
  { id: 3, name: 'Corte' },
]);

const formData = reactive({
  especieId: 1,
  categoriaAnimalId: 1,
  sexoId: 1,
  pesoInicial: null,
  pesoFinal: null,
  GMD: null,
});

onMounted(() => {
  if (props.isDietMode && dietStore.animalData) {
     Object.assign(formData, dietStore.animalData);
  }
  else if (!props.isDietMode && store.lastFormData && store.calculationType === 'requirements') {
    Object.assign(formData, store.lastFormData);
  }
});

watch(() => formData.especieId, (newEspecie) => {
    if (newEspecie === 2) {
        formData.categoriaAnimalId = null;
        if (formData.sexoId === 3) {
            formData.sexoId = 1;
        }
    } else {
        if (formData.categoriaAnimalId === null) {
            formData.categoriaAnimalId = 1;
        }
    }
});

const handleSubmit = async () => {
  const payload = {
    pesoInicial: formData.pesoInicial,
    pesoFinal: formData.pesoFinal,
    GMD: formData.GMD,
    especieId: parseInt(formData.especieId, 10),
    categoriaAnimalId: formData.especieId === 1 ? parseInt(formData.categoriaAnimalId, 10) : null,
    sexoId: parseInt(formData.sexoId, 10),
  };

  if (props.isDietMode) {
    emit('submit-data', payload);
  } else {
    await store.performCalculation('requirements', payload);
  }
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

.form-section {
  margin-bottom: 1.5rem;
}

.grid-2-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
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

input[type="number"],
select {
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
  /* Sobrescreve o display block padrão para alinhar com o radio */
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
}

/* =========================================
   3. Botões & Ações
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
    grid-template-columns: 1fr; /* Empilha as colunas */
    gap: 0;
  }

  .form-section {
    margin-bottom: 1rem;
  }
}
</style>
