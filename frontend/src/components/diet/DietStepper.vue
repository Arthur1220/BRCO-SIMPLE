<template>
  <ol class="stepper" :aria-label="$t('diet.title')">
    <li
      v-for="step in steps"
      :key="step.id"
      class="step"
      :class="{ 'is-current': store.currentStep === step.id, 'is-done': store.currentStep > step.id }"
    >
      <button
        type="button"
        :disabled="!canNavigate(step.id)"
        :aria-current="store.currentStep === step.id ? 'step' : undefined"
        @click="store.goToStep(step.id)"
      >
        <span class="step-num num">{{ store.currentStep > step.id ? '✓' : step.id }}</span>
        <span class="step-label">{{ $t(`diet.steps.${step.key}`) }}</span>
      </button>
    </li>
  </ol>
</template>

<script setup>
import { useDietStore } from '@/stores/dietStore';

const store = useDietStore();

const steps = [
  { id: 1, key: 'start' },
  { id: 2, key: 'animal' },
  { id: 3, key: 'foods' },
  { id: 4, key: 'balance' },
  { id: 5, key: 'result' },
];

// Voltar sempre pode; avançar só para etapas cujos dados já existem.
const canNavigate = (stepId) => {
  if (stepId === store.currentStep) return false;
  if (stepId < store.currentStep) return true;
  if (stepId === 2) return true;
  if (stepId === 3) return Boolean(store.animalData);
  if (stepId === 4) return store.selectedIngredients.length > 0;
  return false;
};
</script>

<style scoped>
.stepper {
  display: flex;
  list-style: none;
  border-bottom: 1px solid var(--line);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.step button {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 16px 0 0;
  margin-right: 8px;
  font-size: 0.875rem;
  color: var(--ink-3);
  border-bottom: 2px solid transparent;
  white-space: nowrap;
}

.step button:disabled { cursor: default; }
.step button:not(:disabled):hover { color: var(--ink); }

.step-num {
  display: inline-grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 0.6875rem;
  border: 1px solid var(--line-strong);
}

.is-done button { color: var(--ink-2); }
.is-done .step-num { border-color: var(--ink-2); }

.is-current button { color: var(--ink); font-weight: 500; border-bottom-color: var(--brand); }

.is-current .step-num { background: var(--brand); border-color: var(--brand); color: var(--ink); }
</style>
