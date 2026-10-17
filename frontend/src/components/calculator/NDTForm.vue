<template>
  <div class="form-container">
    <div v-if="!form" class="catalog-state">{{ catalog.error || $t('common.loadingOptions') }}</div>

    <form v-else @submit.prevent="handleSubmit">
      <div class="grid-2-cols">
        <NumberField v-for="field in mainFields" :key="field.name" :field="field" v-model="formData[field.name]" :error="store.fieldErrors[field.name]" />
      </div>

      <div class="form-section" v-for="group in form.optionalGroups" :key="group.code">
        <label>{{ group.label }}</label>
        <div class="radio-group">
          <label>
            <input type="radio" :value="true" v-model="enabledGroups[group.code]"> {{ $t('common.yes') }}
          </label>
          <label>
            <input type="radio" :value="false" v-model="enabledGroups[group.code]"> {{ $t('common.no') }}
          </label>
        </div>

        <div v-if="enabledGroups[group.code]" class="grid-2-cols optional-fields">
          <NumberField
            v-for="field in groupFields(group)"
            :key="field.name"
            :field="{ ...field, required: true }"
            v-model="formData[field.name]"
            :error="store.fieldErrors[field.name]"
          />
        </div>
      </div>

      <button type="submit" :disabled="store.isLoading">
        {{ store.isLoading ? $t('common.calculating') : $t('ndtForm.submit') }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted } from 'vue';
import { useCalculationStore } from '@/stores/calculationStore';
import { useCatalogStore } from '@/stores/catalogStore';
import NumberField from '@/components/ui/NumberField.vue';

const store = useCalculationStore();
const catalog = useCatalogStore();

// Campos, labels, limites e grupos opcionais (PIDN/PIDA) vêm do catálogo da API.
const form = computed(() => catalog.form('ndt'));
const optionalNames = computed(() => new Set(form.value.optionalGroups.flatMap((g) => g.fields)));
const mainFields = computed(() => form.value.fields.filter((f) => !optionalNames.value.has(f.name)));
const groupFields = (group) => form.value.fields.filter((f) => group.fields.includes(f.name));

const formData = reactive({});
const enabledGroups = reactive({});

onMounted(async () => {
  await catalog.load().catch(() => {});
  if (store.lastFormData && store.lastFormType === 'ndt') {
    Object.assign(formData, store.lastFormData);
  }
  for (const group of form.value?.optionalGroups ?? []) {
    enabledGroups[group.code] = group.fields.some((name) => formData[name] !== undefined && formData[name] !== null);
  }
});

const handleSubmit = async () => {
  const payload = {};
  for (const field of mainFields.value) payload[field.name] = formData[field.name];
  for (const group of form.value.optionalGroups) {
    if (!enabledGroups[group.code]) continue;
    for (const name of group.fields) payload[name] = formData[name];
  }

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
