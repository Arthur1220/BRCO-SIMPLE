<template>
  <p v-if="!form" class="muted small">{{ catalog.error || $t('common.loadingOptions') }}</p>

  <form v-else class="form" novalidate @submit.prevent="handleSubmit">
    <div class="grid-2">
      <NumberField v-for="field in mainFields" :key="field.name" :field="field" id-prefix="ndt-" v-model="formData[field.name]" :error="store.fieldErrors[field.name]" />
    </div>

    <fieldset class="field" v-for="group in form.optionalGroups" :key="group.code">
      <legend class="label">{{ group.label }}</legend>
      <div class="segmented">
        <label><input type="radio" :name="group.code" :value="false" v-model="enabledGroups[group.code]"> {{ $t('common.no') }}</label>
        <label><input type="radio" :name="group.code" :value="true" v-model="enabledGroups[group.code]"> {{ $t('common.yes') }}</label>
      </div>

      <div v-if="enabledGroups[group.code]" class="grid-2 optional">
        <NumberField
          v-for="field in groupFields(group)"
          :key="field.name"
          :field="{ ...field, required: true }"
          id-prefix="ndt-"
          v-model="formData[field.name]"
          :error="store.fieldErrors[field.name]"
        />
      </div>
    </fieldset>

    <button type="submit" class="btn btn-primary btn-block" :disabled="store.isLoading">
      <span v-if="store.isLoading" class="spinner" aria-hidden="true"></span>
      {{ store.isLoading ? $t('common.calculating') : $t('ndtForm.submit') }}
    </button>
  </form>
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
.form { display: flex; flex-direction: column; gap: 18px; }
.optional { margin-top: 14px; }
.form .btn { margin-top: 6px; }
</style>
