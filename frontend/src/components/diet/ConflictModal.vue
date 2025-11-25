<template>
  <div class="modal-overlay" v-if="isVisible">
    <div class="modal-content">
      <div class="modal-header">
        <h2>⚠️ Conflito na Formulação</h2>
      </div>

      <div class="modal-body">
        <p>O sistema encontrou um impasse:</p>
        <ul>
          <li>Não foi possível atingir as <strong>exigências nutricionais</strong> (NDT/Proteína).</li>
          <li>E ao mesmo tempo respeitar os <strong>seus limites</strong> (Mín/Máx) de ingredientes.</li>
        </ul>

        <p class="question">Qual cenário você prefere ver?</p>

        <div class="options-grid">
          <div class="option-card option-ideal">
            <div class="card-header">
              <h3>Priorizar Nutrição</h3>
              <span class="tag-warning">Ignora seus limites</span>
            </div>
            <ul class="pros-cons">
              <li class="pro">✔ Atinge 100% das metas nutricionais.</li>
              <li class="con">✖ Pode usar ingredientes acima do que você permitiu.</li>
            </ul>
            <div class="cost-info">
              Custo Estimado: <strong>R$ {{ formatMoney(resultIdeal.cost) }}</strong>
            </div>
            <button @click="selectOption('ideal')" class="btn-option primary">
              Ver Resultado Nutricional
            </button>
          </div>

          <div class="option-card option-realistic">
            <div class="card-header">
              <h3>Priorizar Meus Limites</h3>
              <span class="tag-warning">Ignora metas nutricionais</span>
            </div>
            <ul class="pros-cons">
              <li class="pro">✔ Respeita rigorosamente seus limites (Min/Max).</li>
              <li class="con">✖ O animal ficará com déficit de nutrientes.</li>
            </ul>
            <div class="cost-info">
              Custo Estimado: <strong>R$ {{ formatMoney(resultRealistic.cost) }}</strong>
            </div>
            <button @click="selectOption('realistic')" class="btn-option secondary">
              Ver Resultado com Limites
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  isVisible: Boolean,
  resultIdeal: Object,
  resultRealistic: Object,
});

const emit = defineEmits(['select-option']);

const selectOption = (option) => {
  emit('select-option', option);
};

const formatMoney = (val) => {
  return Number(val || 0).toFixed(2);
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
  padding: 1rem; /* Garante uma margem de segurança nas bordas em telas muito pequenas */
}

.modal-content {
  background: white;
  width: 95%;
  max-width: 750px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  overflow: hidden;
  border: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  max-height: 90vh; /* Limita a altura a 90% da tela para garantir que caiba */
}

.modal-header {
  background-color: #fff3cd;
  color: #856404;
  padding: 1.5rem;
  border-bottom: 1px solid #ffeeba;
  flex-shrink: 0; /* Garante que o cabeçalho não encolha */
}
.modal-header h2 { margin: 0; font-size: 1.4rem; display: flex; align-items: center; gap: 0.5rem; }

.modal-body {
  padding: 2rem;
  overflow-y: auto; /* Adiciona rolagem apenas no corpo se necessário */
}
.modal-body p { color: #555; line-height: 1.5; margin-bottom: 1rem; }
.question { font-weight: 700; font-size: 1.1rem; color: #333; margin-top: 1.5rem; }

.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 1rem;
}

.option-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  transition: all 0.2s;
}
.option-card:hover { border-color: var(--orange); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

.card-header h3 { margin: 0 0 0.5rem 0; font-size: 1.1rem; color: var(--black); }
.tag-warning { font-size: 0.75rem; background: #fff3cd; color: #856404; padding: 2px 6px; border-radius: 4px; font-weight: 600; display: inline-block; }

.pros-cons { list-style: none; padding: 0; margin: 1rem 0; flex-grow: 1; }
.pros-cons li { font-size: 0.9rem; margin-bottom: 0.5rem; }
.pro { color: #27ae60; }
.con { color: #e74c3c; }

.cost-info { margin: 1rem 0; font-size: 0.9rem; color: #555; text-align: center; background: #f9f9f9; padding: 0.5rem; border-radius: 4px; }

/* Botões */
.btn-option {
  width: 100%;
  padding: 0.8rem;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.btn-option.primary { background-color: var(--orange); color: white; }
.btn-option.primary:hover { background-color: var(--light-orange); }

.btn-option.secondary { background-color: var(--grey); color: white; }
.btn-option.secondary:hover { background-color: #7f8c8d; }

/* --- RESPONSIVIDADE --- */
@media (max-width: 700px) {
  .options-grid { grid-template-columns: 1fr; } /* Empilha os cards no mobile */

  .modal-content {
    max-height: 85vh; /* Um pouco menor no mobile para garantir espaço para barras do navegador */
  }

  .modal-body {
    padding: 1.5rem; /* Reduz o padding interno no mobile */
  }

  .modal-header {
    padding: 1rem 1.5rem;
  }

  .modal-header h2 { font-size: 1.2rem; }
}
</style>
