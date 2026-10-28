<template>
  <div class="dialog-backdrop" @click.self="emit('close')">
    <form class="dialog pdf-dialog" role="dialog" aria-modal="true" aria-labelledby="pdf-title" @submit.prevent="generate">
      <header class="dialog-head">
        <h2 id="pdf-title">{{ $t('pdf.title') }}</h2>
        <p>{{ $t('pdf.subtitle') }}</p>
      </header>

      <div class="dialog-body pdf-grid">
        <div class="field span-2">
          <label class="label" for="pdf-report-title">{{ $t('pdf.reportTitle') }}</label>
          <input id="pdf-report-title" v-model="form.title" class="input" type="text" maxlength="80" :placeholder="defaultTitle">
        </div>
        <div class="field">
          <label class="label" for="pdf-farm">{{ $t('pdf.farm') }}</label>
          <input id="pdf-farm" v-model="form.farm" class="input" type="text" maxlength="80">
        </div>
        <div class="field">
          <label class="label" for="pdf-lot">{{ $t('pdf.lot') }}</label>
          <input id="pdf-lot" v-model="form.lot" class="input" type="text" maxlength="60">
        </div>
        <div class="field span-2">
          <label class="label" for="pdf-author">{{ $t('pdf.author') }}</label>
          <input id="pdf-author" v-model="form.author" class="input" type="text" maxlength="80">
        </div>
        <div class="field span-2">
          <label class="label" for="pdf-notes">{{ $t('pdf.notes') }}</label>
          <textarea id="pdf-notes" v-model="form.notes" class="input textarea" rows="3" maxlength="600"></textarea>
        </div>

        <fieldset class="sections span-2">
          <legend class="label">{{ $t('pdf.sections') }}</legend>
          <label v-for="section in REPORT_SECTIONS[type]" :key="section" class="check">
            <input v-model="form.sections" type="checkbox" :value="section">
            <span>{{ $t(`pdf.section.${section}`) }}</span>
          </label>
        </fieldset>

        <div v-if="error" class="alert alert-error span-2" role="alert">{{ error }}</div>
      </div>

      <footer class="dialog-foot">
        <button type="button" class="btn btn-ghost" @click="emit('close')">{{ $t('common.cancel') }}</button>
        <button type="submit" class="btn btn-primary" :disabled="isGenerating || form.sections.length === 0">
          <span v-if="isGenerating" class="spinner" aria-hidden="true"></span>
          {{ isGenerating ? $t('common.generating') : $t('pdf.generate') }}
        </button>
      </footer>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { saveAs } from 'file-saver';
import { getCalculation } from '@/services/apiService';
import { parseApiError } from '@/services/axiosSetup';
import { useCatalogStore } from '@/stores/catalogStore';
import { buildPdf, REPORT_SECTIONS } from '@/services/pdfReport';

// Relatório em PDF de um cálculo salvo, com dados da propriedade e seções escolhidas.
const props = defineProps({
  type: { type: String, required: true },          // 'diet' | 'requirements' | 'ndt'
  calculationId: { type: String, required: true },
  option: { type: String, default: null },          // dieta com conflito: opção escolhida
});
const emit = defineEmits(['close']);

const { t, locale } = useI18n();
const catalog = useCatalogStore();

// Os dados da propriedade ficam no navegador para o próximo relatório.
const STORAGE_KEY = 'brco.pdf.profile';
const saved = (() => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}; } catch { return {}; }
})();

const defaultTitle = computed(() => t(`pdf.defaultTitle.${props.type}`));
const form = reactive({
  title: '',
  farm: saved.farm ?? '',
  lot: '',
  author: saved.author ?? '',
  notes: '',
  // A ficha de trato é opcional (página extra para o curral).
  sections: REPORT_SECTIONS[props.type].filter((s) => s !== 'feedingSheet'),
});
const isGenerating = ref(false);
const error = ref(null);

function animalSummary(input) {
  const animal = props.type === 'diet' ? input.animal : input;
  if (!animal?.especie) return '';
  const species = catalog.findSpecies(animal.especie);
  const genotype = species?.genotypes.find((g) => g.code === animal.genotipo);
  const sex = species?.sexes.find((s) => s.code === animal.sexo);
  return t('pdf.animalSummary', {
    animal: [species?.label, genotype?.label, sex?.label].filter(Boolean).join(' · '),
    initial: animal.pesoInicial,
    final: animal.pesoFinal,
    gain: animal.GMD,
  });
}

function labels() {
  const keys = [
    'brand', 'generatedAt', 'calculation', 'farm', 'lot', 'author', 'notes', 'field', 'value', 'summary', 'parameter',
    'unit', 'required', 'maximum', 'intakeDM', 'intakeAsFed', 'costPerDay', 'costPerKgGain', 'status', 'recipe',
    'ingredient', 'inclusion', 'feeding', 'perFeedingAsFed', 'perFeedingDM', 'lotPerDay', 'balance', 'nutrient',
    'supplied', 'difference', 'notAvailable', 'noData', 'safety', 'check', 'limit', 'noLimit', 'incomplete', 'within',
    'outside', 'warnings', 'severity', 'message', 'insights', 'requirements', 'sheetTitle', 'perFeeding', 'feedingN',
    'total', 'date', 'responsible', 'sheetHint', 'disclaimer',
  ];
  return {
    ...Object.fromEntries(keys.map((key) => [key, t(`pdf.l.${key}`)])),
    defaultTitle: defaultTitle.value,
    feedingHint: (animals, feedings) => t('pdf.l.feedingHint', { animals, feedings }),
  };
}

async function generate() {
  isGenerating.value = true;
  error.value = null;
  try {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ farm: form.farm, author: form.author })); } catch { /* sem armazenamento */ }
    await catalog.load().catch(() => {});
    const calculation = await getCalculation(props.calculationId);
    const { blob, filename } = await buildPdf(calculation, {
      ...form,
      sections: new Set(form.sections),
      option: props.option,
      animalSummary: animalSummary(calculation.input),
      labels: labels(),
      locale: locale.value,
    });
    saveAs(blob, filename);
    emit('close');
  } catch (err) {
    error.value = parseApiError(err, t('pdf.error')).message;
  } finally {
    isGenerating.value = false;
  }
}
</script>

<style scoped>
.pdf-dialog { max-width: 560px; }

.pdf-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.span-2 { grid-column: span 2; }

.textarea { height: auto; min-height: 72px; padding-top: 8px; resize: vertical; }

.sections {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 14px 12px;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 16px;
}

.sections legend { padding: 0 6px; }

.check { display: flex; gap: 8px; align-items: center; font-size: 0.875rem; cursor: pointer; }

@media (max-width: 560px) {
  .pdf-grid, .sections { grid-template-columns: 1fr; }
  .span-2 { grid-column: span 1; }
}
</style>
