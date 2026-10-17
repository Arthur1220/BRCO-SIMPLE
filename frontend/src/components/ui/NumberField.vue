<template>
  <div class="form-section">
    <label :for="inputId">{{ field.label }} ({{ field.unit }}):</label>
    <input
      :id="inputId"
      v-model.number="model"
      type="number"
      :step="field.step"
      :min="field.min"
      :max="field.max"
      :required="field.required"
      :placeholder="$t('common.examplePlaceholder', { value: field.placeholder })"
      :class="{ 'has-error': error }"
    />
    <small v-if="error" class="field-error">{{ error }}</small>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// Campo numérico montado a partir da definição do catálogo da API
// (label, unidade, passo, limites e exemplo vêm do backend).
const props = defineProps({
  field: { type: Object, required: true },
  error: { type: String, default: null },
  idPrefix: { type: String, default: '' },
});

const model = defineModel({ type: [Number, String, null] });
const inputId = computed(() => `${props.idPrefix}${props.field.name}`);
</script>

<style scoped>
.form-section {
  margin-bottom: 1.5rem;
}

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

input.has-error {
  border-color: var(--red-error);
}

.field-error {
  display: block;
  margin-top: 0.35rem;
  color: var(--red-error);
  font-size: 0.85rem;
}
</style>
