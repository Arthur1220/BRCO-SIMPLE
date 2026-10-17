<template>
  <p v-if="!form" class="muted small">{{ catalog.error || $t('common.loadingOptions') }}</p>

  <form v-else class="form" novalidate @submit.prevent="handleSubmit">
    <fieldset class="field">
      <legend class="label">{{ $t('requirementsForm.species') }}</legend>
      <div class="segmented">
        <label v-for="species in catalog.species" :key="species.code">
          <input type="radio" name="especie" :value="species.code" v-model="formData.especie"> {{ species.label }}
        </label>
      </div>
    </fieldset>

    <div class="grid-2">
      <div class="field" v-if="currentSpecies?.genotypes.length">
        <label class="label" :for="`${idPrefix}genotipo`">{{ $t('requirementsForm.genotype') }}</label>
        <select :id="`${idPrefix}genotipo`" v-model="formData.genotipo" class="select">
          <option
            v-for="genotype in currentSpecies.genotypes"
            :key="genotype.code"
            :value="genotype.code"
            :disabled="!genotype.available"
          >
            {{ genotype.label }}{{ genotype.available ? '' : ` · ${genotype.unavailableReason}` }}
          </option>
        </select>
        <small v-if="errors.genotipo" class="field-error">{{ errors.genotipo }}</small>
      </div>

      <div class="field">
        <label class="label" :for="`${idPrefix}sexo`">{{ $t('requirementsForm.sex') }}</label>
        <select :id="`${idPrefix}sexo`" v-model="formData.sexo" class="select">
          <option v-for="sex in currentSpecies?.sexes" :key="sex.code" :value="sex.code">{{ sex.label }}</option>
        </select>
        <small v-if="errors.sexo" class="field-error">{{ errors.sexo }}</small>
      </div>
    </div>

    <div class="grid-2">
      <NumberField v-for="name in ['pesoInicial', 'pesoFinal']" :key="name" :field="fieldDef(name)" :id-prefix="idPrefix" v-model="formData[name]" :error="errors[name]" />
    </div>
    <NumberField :field="fieldDef('GMD')" :id-prefix="idPrefix" v-model="formData.GMD" :error="errors.GMD" />

    <button type="submit" class="btn btn-primary btn-block" :disabled="store.isLoading">
      <span v-if="store.isLoading && !isDietMode" class="spinner" aria-hidden="true"></span>
      {{ isDietMode ? $t('requirementsForm.confirmAnimal') : (store.isLoading ? $t('common.calculating') : $t('requirementsForm.submit')) }}
    </button>
  </form>
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

const idPrefix = props.isDietMode ? 'diet-' : 'req-';

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
.form { display: flex; flex-direction: column; gap: 18px; }
.form .btn { margin-top: 6px; }
</style>
