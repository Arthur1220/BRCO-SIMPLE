<template>
  <div class="container page">
    <header class="page-head">
      <h1>{{ $t('diet.title') }}</h1>
      <p>{{ $t('diet.subtitle') }}</p>
    </header>

    <DietStepper />

    <DietIntro v-if="store.currentStep === 1" />

    <section v-else-if="store.currentStep === 2" class="panel step narrow" aria-labelledby="step-animal">
      <header class="panel-head">
        <div>
          <h2 id="step-animal">{{ $t('diet.animalStepTitle') }}</h2>
          <p class="small">{{ $t('diet.animalStepText') }}</p>
        </div>
      </header>
      <div class="panel-body">
        <ExigenciasForm :isDietMode="true" @submit-data="handleAnimalData" />
      </div>
    </section>

    <section v-else-if="store.currentStep === 3" class="panel step" aria-labelledby="step-foods">
      <header class="panel-head">
        <div>
          <h2 id="step-foods">{{ $t('diet.foodsStepTitle') }}</h2>
          <p class="small">{{ $t('diet.foodsStepText') }}</p>
        </div>
        <span class="pill pill-info num">{{ store.selectedIngredients.length }} / {{ catalog.diet?.maxIngredients }}</span>
      </header>
      <FoodSelector />
      <footer class="step-foot">
        <button type="button" class="btn btn-ghost" @click="store.prevStep()">{{ $t('common.back') }}</button>
        <button type="button" class="btn btn-primary" :disabled="store.selectedIngredients.length === 0" @click="store.nextStep()">
          {{ $t('diet.nextBalance') }}
        </button>
      </footer>
    </section>

    <section v-else-if="store.currentStep === 4" class="panel step" aria-labelledby="step-balance">
      <header class="panel-head">
        <div>
          <h2 id="step-balance">{{ $t('diet.balanceStepTitle') }}</h2>
          <p class="small">{{ $t('diet.balanceStepText') }}</p>
        </div>
      </header>
      <DietBalancer />
      <div v-if="store.error" class="panel-body error-area">
        <div class="alert alert-error" role="alert">{{ store.error }}</div>
      </div>
      <footer class="step-foot">
        <span class="small muted">{{ $t('diet.autoAdjust') }}</span>
        <div class="cluster">
          <button type="button" class="btn btn-ghost" @click="store.prevStep()">{{ $t('common.back') }}</button>
          <button type="button" class="btn btn-primary" :disabled="store.isLoading" @click="store.performDietCalculation">
            <span v-if="store.isLoading" class="spinner" aria-hidden="true"></span>
            {{ store.isLoading ? $t('common.calculating') : $t('diet.calculate') }}
          </button>
        </div>
      </footer>
    </section>

    <section v-else-if="store.currentStep === 5" class="step" aria-labelledby="step-result">
      <div class="result-head">
        <h2 id="step-result">{{ $t('diet.resultTitle') }}</h2>
        <div class="cluster">
          <button type="button" class="btn btn-ghost btn-sm" @click="store.goToStep(4)">{{ $t('diet.editParameters') }}</button>
          <button type="button" class="btn btn-secondary btn-sm" @click="store.resetDiet()">{{ $t('diet.restart') }}</button>
        </div>
      </div>
      <DietResultsTable />
    </section>

    <ConflictModal
      :isVisible="store.showConflictModal"
      :options="store.conflictData.options"
      :statusLabel="store.conflictData.statusLabel"
      @select-option="store.finalizeCalculation"
      @close="store.closeConflict"
    />
  </div>
</template>

<script setup>
import { watch, onMounted } from 'vue';
import { useDietStore } from '@/stores/dietStore';
import { useCatalogStore } from '@/stores/catalogStore';

import DietStepper from '@/components/diet/DietStepper.vue';
import DietIntro from '@/components/diet/DietIntro.vue';
import ExigenciasForm from '@/components/calculator/ExigenciasForm.vue';
import FoodSelector from '@/components/diet/FoodSelector.vue';
import DietBalancer from '@/components/diet/DietBalancer.vue';
import DietResultsTable from '@/components/diet/DietResultsTable.vue';
import ConflictModal from '@/components/diet/ConflictModal.vue';

const store = useDietStore();
const catalog = useCatalogStore();

const handleAnimalData = (data) => {
  store.animalData = data;
  store.error = null;
  store.fetchFoods();
  store.nextStep();
};

onMounted(() => catalog.load().catch(() => {}));

// Cada etapa começa no topo da página.
watch(() => store.currentStep, () => {
  window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
});
</script>

<style scoped>
.step { margin-top: 24px; }
.step.narrow { max-width: 640px; }

.panel-head h2,
.result-head h2 { font-size: 1.0625rem; }
.panel-head p { margin-top: 2px; }

.step-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 24px;
  border-top: 1px solid var(--line);
  background: #fcfbf9;
  border-radius: 0 0 var(--r-lg) var(--r-lg);
}

.step-foot > .btn-ghost:first-child { margin-right: auto; }

.error-area { padding-top: 0; }

.result-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

@media (max-width: 720px) {
  .step-foot { padding: 12px 16px; }
}
</style>
