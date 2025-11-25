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
/* =========================================
   1. Container & Layout Principal
   ========================================= */
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

/* =========================================
   2. Item do Passo (Wrapper)
   ========================================= */
.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative; /* Necessário para posicionar a linha absoluta */
  flex: 1; /* Distribui o espaço igualmente */
  cursor: default;
  z-index: 2; /* Garante que o círculo fique acima da linha conectora */
}

.step-item.clickable {
  cursor: pointer;
}

/* =========================================
   3. Elementos Visuais Base
   ========================================= */
/* Círculo do Número/Ícone */
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

/* Rótulo de Texto */
.step-label {
  font-size: 0.85rem;
  color: var(--grey);
  font-weight: 500;
  transition: color 0.3s ease;
}

/* Linha Conectora (Background) */
.step-line {
  position: absolute;
  top: 16px; /* Metade da altura do círculo (32px / 2) */
  left: 50%; /* Começa no meio do item atual */
  width: 100%; /* Estende até o meio do próximo item */
  height: 2px;
  background-color: var(--grey-light);
  z-index: -1; /* Fica atrás do círculo */
}

/* =========================================
   4. Estados: ATIVO (Current)
   ========================================= */
.step-item.active .step-circle {
  border-color: var(--orange);
  background-color: var(--orange);
  color: white;
  transform: scale(1.1); /* Leve aumento para destaque */
  box-shadow: 0 0 0 4px rgba(245, 130, 32, 0.2); /* Efeito de "glow" */
}

.step-item.active .step-label {
  color: var(--orange);
  font-weight: bold;
}

/* =========================================
   5. Estados: COMPLETO (Finished)
   ========================================= */
.step-item.completed .step-circle {
  background-color: #27ae60; /* Verde */
  border-color: #27ae60;
  color: white;
}

.step-item.completed .step-label {
  color: #27ae60;
}

/* A linha fica verde se o passo atual já foi completado */
.step-item.completed .step-line {
  background-color: #27ae60;
}

/* =========================================
   6. Responsividade (Mobile)
   ========================================= */
@media (max-width: 600px) {
  /* Esconde os textos dos passos não ativos para economizar espaço */
  .step-label {
    display: none;
  }

  /* Mostra apenas o texto do passo ATIVO */
  .step-item.active .step-label {
    display: block;
    position: absolute;
    top: 40px; /* Posiciona abaixo do círculo */
    width: 100px; /* Largura fixa para centralizar texto longo */
    text-align: center;
  }
}
</style>
