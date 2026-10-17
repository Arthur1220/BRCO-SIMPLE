<template>
  <div class="container page">
    <header class="page-head">
      <nav class="segmented" :aria-label="$t('calculator.sidebarTitle')">
        <router-link to="/calcular/exigencias" :class="{ 'is-active': type === 'exigencias' }">{{ $t('nav.requirementsShort') }}</router-link>
        <router-link to="/calcular/ndt" :class="{ 'is-active': type === 'ndt' }">{{ $t('nav.ndtShort') }}</router-link>
      </nav>
      <h1>{{ $t(type === 'ndt' ? 'calculator.ndtTitle' : 'calculator.requirementsTitle') }}</h1>
      <p>{{ $t(type === 'ndt' ? 'calculator.ndtIntro' : 'calculator.requirementsIntro') }}</p>
    </header>

    <div class="workspace">
      <section class="panel form-panel" :aria-label="$t('calculator.inputs')">
        <div class="panel-body">
          <ExigenciasForm v-if="type === 'exigencias'" />
          <NDTForm v-else />
        </div>
      </section>

      <section ref="resultsEl" class="results-area" aria-live="polite" :aria-busy="store.isLoading">
        <div v-if="store.error" class="alert alert-error">{{ store.error }}</div>

        <ResultsDisplay v-else-if="store.results" :class="{ 'is-stale': store.isLoading }" />

        <div v-else class="panel placeholder">
          <p v-if="store.isLoading" class="cluster muted"><span class="spinner"></span>{{ $t('common.calculating') }}</p>
          <template v-else>
            <h2>{{ $t('calculator.emptyTitle') }}</h2>
            <p>{{ $t(type === 'ndt' ? 'calculator.emptyNdt' : 'calculator.emptyRequirements') }}</p>
          </template>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue';
import { useCalculationStore } from '@/stores/calculationStore';

import ExigenciasForm from '@/components/calculator/ExigenciasForm.vue';
import NDTForm from '@/components/calculator/NDTForm.vue';
import ResultsDisplay from '@/components/calculator/ResultsDisplay.vue';

const store = useCalculationStore();
const resultsEl = ref(null);

const props = defineProps({
  type: {
    type: String,
    required: true
  }
});

watch(() => props.type, () => store.clearCalculationState());

// No celular o resultado fica abaixo do formulário: rola até ele quando chega.
watch(() => store.results, async (results) => {
  if (!results || window.matchMedia('(min-width: 961px)').matches) return;
  await nextTick();
  resultsEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

onUnmounted(() => store.clearCalculationState());
</script>

<style scoped>
.page-head .segmented { margin-bottom: 20px; }

.workspace {
  display: grid;
  grid-template-columns: 380px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.form-panel {
  position: sticky;
  top: calc(var(--header-h) + 16px);
}

.results-area { min-width: 0; scroll-margin-top: calc(var(--header-h) + 16px); }

.placeholder {
  padding: 48px 32px;
  border-style: dashed;
  background: transparent;
}

.placeholder h2 { font-size: 1rem; margin-bottom: 6px; }
.placeholder p { font-size: 0.875rem; max-width: 48ch; }

.is-stale { opacity: 0.5; transition: opacity var(--ease); }

@media (max-width: 960px) {
  .workspace { grid-template-columns: 1fr; }
  .form-panel { position: static; }
}
</style>
