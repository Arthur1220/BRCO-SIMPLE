<template>
  <div class="stepper">
    <div class="stepper-container">
      <div
        v-for="step in steps"
        :key="step.id"
        class="step-item"
        :class="{
          'active': store.currentStep === step.id,
          'completed': store.currentStep > step.id,
          'clickable': canNavigate(step.id)
        }"
        @click="navigate(step.id)"
      >
        <div class="step-circle">
          <span v-if="store.currentStep > step.id">✓</span>
          <span v-else>{{ step.id }}</span>
        </div>
        <span class="step-label">{{ step.label }}</span>

        <div class="step-line" v-if="step.id !== steps.length"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDietStore } from '@/stores/dietStore';

const store = useDietStore();

const steps = [
  { id: 1, label: 'Início' },
  { id: 2, label: 'Animal' },
  { id: 3, label: 'Alimentos' },
  { id: 4, label: 'Balanço' },
  { id: 5, label: 'Resultado' },
];

// Só permite clicar para voltar ou ir para um passo já visitado/válido
const canNavigate = (stepId) => {
    if (stepId < store.currentStep) return true; // Voltar sempre pode
    if (stepId === store.currentStep) return false;

    // Regras para avançar (só se tiver dados)
    if (stepId === 2) return true; // Sempre pode ir para Animal
    if (stepId === 3 && store.animalData) return true;
    if (stepId === 4 && store.selectedIngredients.length > 0) return true;

    return false;
};

const navigate = (stepId) => {
    if (canNavigate(stepId)) {
        store.goToStep(stepId);
    }
};
</script>

<style scoped>
.stepper {
  width: 100%;
  padding: 1rem 0 2rem;
  border-bottom: 1px solid var(--grey-light);
  margin-bottom: 2rem;
}

.stepper-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  cursor: default;
  z-index: 2;
}

.step-item.clickable { cursor: pointer; }

/* Círculo do Passo */
.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--white);
  border: 2px solid var(--grey);
  color: var(--grey);
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
}

/* Texto do Passo */
.step-label {
  font-size: 0.85rem;
  color: var(--grey);
  font-weight: 500;
  transition: color 0.3s ease;
}

/* Estados Ativos e Completos */
.step-item.active .step-circle {
  border-color: var(--orange);
  background-color: var(--orange);
  color: white;
  transform: scale(1.1);
  box-shadow: 0 0 0 4px rgba(245, 130, 32, 0.2);
}
.step-item.active .step-label { color: var(--orange); font-weight: bold; }

.step-item.completed .step-circle {
  background-color: #27ae60; /* Verde */
  border-color: #27ae60;
  color: white;
}
.step-item.completed .step-label { color: #27ae60; }

/* Linha Conectora */
.step-line {
  position: absolute;
  top: 16px;
  left: 50%;
  width: 100%;
  height: 2px;
  background-color: var(--grey-light);
  z-index: -1;
}

.step-item.completed .step-line {
  background-color: #27ae60; /* Linha fica verde se o passo foi completado */
}

/* Ajustes Mobile */
@media (max-width: 600px) {
  .step-label { display: none; } /* Esconde texto no mobile para caber */
  .step-item.active .step-label { display: block; position: absolute; top: 40px; width: 100px; text-align: center; }
}
</style>
