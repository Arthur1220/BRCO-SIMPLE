<template>
  <div class="field">
    <label class="label" :for="inputId">
      {{ field.label }} <span class="unit">({{ field.unit }})</span>
    </label>
    <input
      :id="inputId"
      v-model.number="model"
      class="input"
      type="number"
      inputmode="decimal"
      :step="field.step"
      :min="field.min"
      :max="field.max"
      :required="field.required"
      :placeholder="field.placeholder"
      :class="{ 'has-error': error }"
      :aria-invalid="Boolean(error)"
      :aria-describedby="error ? `${inputId}-error` : undefined"
    />
    <small v-if="error" :id="`${inputId}-error`" class="field-error">{{ error }}</small>
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
