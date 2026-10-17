<template>
  <div class="form-container">
    <div v-if="!form" class="catalog-state">{{ catalog.error || $t('common.loadingOptions') }}</div>

    <form v-else @submit.prevent="handleSubmit">
      <div class="form-section">
        <label>{{ $t('requirementsForm.species') }}</label>
        <div class="radio-group">
          <label v-for="species in catalog.species" :key="species.code">
            <input type="radio" :value="species.code" v-model="formData.especie" required> {{ species.label }}
          </label>
        </div>
      </div>

      <div class="form-section" v-if="currentSpecies?.genotypes.length">
        <label for="genotipo">{{ $t('requirementsForm.genotype') }}</label>
        <select id="genotipo" v-model="formData.genotipo">
          <option
            v-for="genotype in currentSpecies.genotypes"
            :key="genotype.code"
            :value="genotype.code"
            :disabled="!genotype.available"
          >
            {{ genotype.label }}{{ genotype.available ? '' : ` (${genotype.unavailableReason})` }}
          </option>
        </select>
        <small v-if="errors.genotipo" class="field-error">{{ errors.genotipo }}</small>
      </div>

      <div class="form-section">
        <label for="sexo">{{ $t('requirementsForm.sex') }}</label>
        <select id="sexo" v-model="formData.sexo">
          <option v-for="sex in currentSpecies?.sexes" :key="sex.code" :value="sex.code">{{ sex.label }}</option>
        </select>
        <small v-if="errors.sexo" class="field-error">{{ errors.sexo }}</small>
      </div>

      <div class="grid-2-cols">
        <NumberField v-for="name in ['pesoInicial', 'pesoFinal']" :key="name" :field="fieldDef(name)" v-model="formData[name]" :error="errors[name]" />
      </div>
      <NumberField :field="fieldDef('GMD')" v-model="formData.GMD" :error="errors.GMD" />

      <button type="submit" :disabled="store.isLoading">
         {{ isDietMode ? $t('requirementsForm.confirmAnimal') : (store.isLoading ? $t('common.calculating') : $t('requirementsForm.submit')) }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { reactive, computed, watch, onMounted } from 'vue';
import { useCalculationStore } from '@/stores/calculationStore';
import { useDietStore } from '@/stores/dietStore';
import { useCatalogStore } from '@/stores/catalogStore';
import NumberField from '@/components/ui/NumberField.vue';

const store = useCalculationStore();
const dietStore = useDietStore();
const catalog = useCatalogStore();

const props = defineProps({
  isDietMode: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['submit-data']);

// Espécies, genótipos, sexos, labels e limites vêm do catálogo da API.
const form = computed(() => catalog.form(props.isDietMode ? 'dietAnimal' : 'requirements'));
const fieldDef = (name) => form.value.fields.find((f) => f.name === name);
const currentSpecies = computed(() => catalog.findSpecies(formData.especie));
// No modo dieta os erros da API aparecem na etapa de cálculo (dietStore.error).
const errors = computed(() => (props.isDietMode ? {} : store.fieldErrors));

const formData = reactive({
  especie: null,
  genotipo: null,
  sexo: null,
  pesoInicial: null,
  pesoFinal: null,
  GMD: null,
});

// Ao trocar de espécie, seleciona as primeiras opções disponíveis dela.
const selectDefaultsFor = (species) => {
  if (!species) return;
  if (!species.genotypes.some((g) => g.code === formData.genotipo && g.available)) {
    formData.genotipo = species.genotypes.find((g) => g.available)?.code ?? null;
  }
  if (!species.sexes.some((s) => s.code === formData.sexo)) {
    formData.sexo = species.sexes[0]?.code ?? null;
  }
};

watch(currentSpecies, selectDefaultsFor);

onMounted(async () => {
  await catalog.load().catch(() => {});
  if (props.isDietMode && dietStore.animalData) {
    Object.assign(formData, dietStore.animalData);
  } else if (!props.isDietMode && store.lastFormData && store.lastFormType === 'requirements') {
    Object.assign(formData, store.lastFormData);
  }
  if (!formData.especie) formData.especie = catalog.species[0]?.code ?? null;
  selectDefaultsFor(currentSpecies.value);
});

const handleSubmit = async () => {
  const payload = {
    especie: formData.especie,
    genotipo: currentSpecies.value?.genotypes.length ? formData.genotipo : null,
    sexo: formData.sexo,
    pesoInicial: formData.pesoInicial,
    pesoFinal: formData.pesoFinal,
    GMD: formData.GMD,
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

/* =========================================
   Estados do catálogo e erros de campo (API v1)
   ========================================= */
.catalog-state {
  text-align: center;
  color: var(--black-light);
  padding: 2rem 0;
}

.field-error {
  display: block;
  margin-top: 0.35rem;
  color: var(--red-error);
  font-size: 0.85rem;
}

.optional-fields {
  margin-top: 1.5rem;
}
</style>
