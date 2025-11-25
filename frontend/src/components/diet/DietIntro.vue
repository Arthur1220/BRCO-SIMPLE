<template>
  <div class="diet-intro">
    <div class="content">
      <div class="icon-container">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.153.344c-1.32.083-2.643.083-3.963 0a5.988 5.988 0 01-2.153-.344c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c-1.01.143-2.01.317-3 .52m3-.52L2.62 15.698c-.122.499.106 1.028.589 1.202a5.989 5.989 0 002.153.344c1.32.083 2.643.083 3.963 0a5.989 5.989 0 002.153-.344c.483-.174.711-.703.59-1.202L5.25 4.971z" />
        </svg>
      </div>

      <h2>Formulação de Dieta Otimizada</h2>
      <p>
        Utilize nossa ferramenta inteligente para criar dietas balanceadas de mínimo custo.
        O sistema irá calcular automaticamente a melhor combinação de alimentos para atender às exigências do seu animal.
      </p>

      <ul class="steps-list">
        <li>
          <span class="step-num">1</span>
          <span>Defina as características do animal</span>
        </li>
        <li>
          <span class="step-num">2</span>
          <span>Escolha os alimentos disponíveis</span>
        </li>
        <li>
          <span class="step-num">3</span>
          <span>Defina limites e preços (Opcional)</span>
        </li>
        <li>
          <span class="step-num">4</span>
          <span>Receba a receita pronta!</span>
        </li>
      </ul>

      <button @click="store.nextStep()" class="btn-start">
        Iniciar Formulação
      </button>
    </div>
  </div>
</template>

<script setup>
import { useDietStore } from '@/stores/dietStore';
const store = useDietStore();
</script>

<style scoped>
/* =========================================
   1. Layout Principal & Container
   ========================================= */
.diet-intro {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem 1rem;
  text-align: center;
  background: var(--white);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.content {
  max-width: 600px;
}

/* =========================================
   2. Iconografia (Hero Icon)
   ========================================= */
.icon-container {
  width: 80px;
  height: 80px;
  background-color: #e8f5e9; /* Verde muito claro (fundo) */
  color: #27ae60; /* Verde vibrante (ícone) */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem; /* Centraliza horizontalmente e dá margem inferior */
}

.icon-container svg {
  width: 40px;
  height: 40px;
}

/* =========================================
   3. Tipografia
   ========================================= */
h2 {
  color: var(--orange);
  font-size: 2rem;
  margin-bottom: 1rem;
}

p {
  color: var(--black-light);
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2.5rem;
}

/* =========================================
   4. Lista de Passos (Steps)
   ========================================= */
.steps-list {
  list-style: none;
  padding: 0;
  margin: 0 auto 3rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap; /* Permite quebrar linha se faltar espaço */
}

.steps-list li {
  flex: 1;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--black);
  font-weight: 500;
}

.step-num {
  width: 30px;
  height: 30px;
  background-color: var(--grey-light);
  color: var(--black-light);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

/* =========================================
   5. Botões & Ações
   ========================================= */
.btn-start {
  padding: 1rem 3rem;
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
  background-color: var(--orange);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 10px rgba(245, 130, 32, 0.3); /* Sombra laranja suave */
}

.btn-start:hover {
  background-color: var(--light-orange);
  transform: translateY(-2px); /* Efeito de elevação */
}

/* =========================================
   6. Responsividade (Mobile)
   ========================================= */
@media (max-width: 600px) {
  .steps-list {
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  .steps-list li {
    /* No mobile, o passo fica lado a lado com o texto (ex: (1) Texto) */
    flex-direction: row;
    text-align: left;
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
