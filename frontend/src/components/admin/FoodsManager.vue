<template>
  <section class="panel" aria-labelledby="foods-title">
    <header class="panel-head">
      <h2 id="foods-title">{{ $t('admin.foods.title') }}</h2>
      <button type="button" class="btn btn-secondary btn-sm" @click="openModal()">{{ $t('admin.foods.add') }}</button>
    </header>

    <div class="table-wrap">
      <table class="table foods">
        <thead>
          <tr>
            <th>{{ $t('common.name') }}</th>
            <th>{{ $t('common.category') }}</th>
            <th class="right">MS <span class="unit">({{ unitFor('MS') }})</span></th>
            <th class="right">PB <span class="unit">({{ unit }})</span></th>
            <th class="right">NDT <span class="unit">({{ unit }})</span></th>
            <th><span class="visually-hidden">{{ $t('admin.foods.actions') }}</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="food in paginatedFoods" :key="food.id">
            <td>{{ food.name }}</td>
            <td class="muted">{{ food.categoryLabel }}</td>
            <td class="num">{{ food.MS }}</td>
            <td class="num">{{ food.PB }}</td>
            <td class="num">{{ food.NDT }}</td>
            <td class="right actions">
              <button type="button" class="btn btn-ghost btn-sm" @click="openModal(food)">{{ $t('common.edit') }}</button>
              <button type="button" class="btn btn-danger btn-sm" @click="confirmDelete(food)">{{ $t('common.delete') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer v-if="totalPages > 1" class="pager">
      <span class="small muted num">{{ currentPage }} / {{ totalPages }}</span>
      <div class="cluster">
        <button type="button" class="btn btn-ghost btn-sm" :disabled="currentPage === 1" @click="currentPage--">{{ $t('common.previous') }}</button>
        <button type="button" class="btn btn-ghost btn-sm" :disabled="currentPage === totalPages" @click="currentPage++">{{ $t('common.next') }}</button>
      </div>
    </footer>

    <div v-if="showModal" class="dialog-backdrop" @click.self="closeModal">
      <form class="dialog" role="dialog" aria-modal="true" aria-labelledby="food-dialog-title" @submit.prevent="saveFood">
        <header class="dialog-head">
          <h2 id="food-dialog-title">{{ isEditing ? $t('admin.foods.editTitle') : $t('admin.foods.newTitle') }}</h2>
        </header>
        <div class="dialog-body food-grid">
          <div class="field span-2">
            <label class="label" for="food-name">{{ $t('common.name') }}</label>
            <input id="food-name" v-model="form.name" class="input" type="text" required>
          </div>
          <div class="field span-2">
            <label class="label" for="food-category">{{ $t('common.category') }}</label>
            <select id="food-category" v-model="form.category" class="select" required>
              <option v-for="category in categories" :key="category.code" :value="category.code">{{ category.label }}</option>
            </select>
          </div>
          <div v-for="field in nutrientFields" :key="field" class="field">
            <label class="label" :for="`food-${field}`">{{ field }} <span class="unit">({{ unitFor(field) }})</span></label>
            <input :id="`food-${field}`" v-model.number="form[field]" class="input" type="number" step="0.01" :class="{ 'has-error': fieldErrors[field] }">
            <small v-if="fieldErrors[field]" class="field-error">{{ fieldErrors[field] }}</small>
          </div>
          <fieldset class="safety span-2">
            <legend class="label">{{ $t('admin.foods.safetyTitle') }}</legend>
            <p class="small muted">{{ $t('admin.foods.safetyHint') }}</p>
            <div class="food-grid">
              <div v-for="field in safetyFields" :key="field.name" class="field">
                <label class="label" :for="`food-${field.name}`">{{ field.name }} <span class="unit">({{ field.unit }})</span></label>
                <input :id="`food-${field.name}`" v-model="form[field.name]" class="input" type="number" step="0.01" min="0" :placeholder="$t('admin.foods.noData')" :class="{ 'has-error': fieldErrors[field.name] }">
                <small v-if="fieldErrors[field.name]" class="field-error">{{ fieldErrors[field.name] }}</small>
              </div>
              <div class="field span-2">
                <label class="label" for="food-target">{{ $t('admin.foods.targetSpecies') }}</label>
                <select id="food-target" v-model="form.targetSpecies" class="select">
                  <option :value="null">{{ $t('admin.foods.targetSpeciesNone') }}</option>
                  <option v-for="species in targetSpecies" :key="species.code" :value="species.code">{{ species.label }}</option>
                </select>
                <small class="small muted">{{ $t('admin.foods.targetSpeciesHint') }}</small>
              </div>
            </div>
          </fieldset>
          <div v-if="saveError" class="alert alert-error span-2" role="alert">{{ saveError }}</div>
        </div>
        <footer class="dialog-foot">
          <button type="button" class="btn btn-ghost" @click="closeModal">{{ $t('common.cancel') }}</button>
          <button type="submit" class="btn btn-primary" :disabled="isSaving">
            <span v-if="isSaving" class="spinner" aria-hidden="true"></span>
            {{ isSaving ? $t('common.saving') : $t('common.save') }}
          </button>
        </footer>
      </form>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { getFoods } from '@/services/apiService';
import { createFood, updateFood, deleteFood } from '@/services/adminService';
import { parseApiError } from '@/services/axiosSetup';
import { useCatalogStore } from '@/stores/catalogStore';

const catalog = useCatalogStore();
const { t, locale } = useI18n();
// Categorias e unidade dos nutrientes vêm do catálogo da API.
const categories = computed(() => catalog.diet?.categories ?? []);
const targetSpecies = computed(() => catalog.diet?.targetSpecies ?? []);
const unit = computed(() => catalog.diet?.foodNutrientUnit ?? '');
// A matéria seca é expressa sobre a matéria natural (g/kg); os demais, sobre a MS.
const unitFor = (field) => (field === 'MS' ? 'g/kg' : unit.value);

const foods = ref([]);
const showModal = ref(false);
const isEditing = ref(false);
const isSaving = ref(false);
const editingId = ref(null);
const saveError = ref(null);
const fieldErrors = ref({});

const nutrientFields = ['MS', 'MO', 'EE', 'PB', 'NDT', 'FDNcp', 'CNF', 'Ca', 'P', 'PDR', 'PNDR'];

// Opcionais, usados nas travas de segurança da dieta. Vazio = sem dado (null).
const safetyFields = [
  { name: 'Cu', unit: 'mg/kg MS' },
  { name: 'Mo', unit: 'mg/kg MS' },
  { name: 'S', unit: 'g/kg MS' },
  { name: 'NNP', unit: 'g/kg MS' },
];

const emptyForm = () => ({
  name: '', category: 'VOLUMOSO',
  MS: 0, MO: 0, EE: 0, PB: 0, NDT: 0, FDNcp: 0, CNF: 0, Ca: 0, P: 0, PDR: 0, PNDR: 0,
  Cu: null, Mo: null, S: null, NNP: null, targetSpecies: null,
});

const form = reactive(emptyForm());

const currentPage = ref(1);
const itemsPerPage = 10;
const totalPages = computed(() => Math.ceil(foods.value.length / itemsPerPage) || 1);
const paginatedFoods = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return foods.value.slice(start, start + itemsPerPage);
});

const loadFoods = async () => {
  try {
    foods.value = await getFoods();
  } catch (error) {
    console.error("Erro ao carregar alimentos:", error);
  }
};

const openModal = (food = null) => {
  saveError.value = null;
  fieldErrors.value = {};
  if (food) {
    isEditing.value = true;
    editingId.value = food.id;
    Object.assign(form, emptyForm(), food);
  } else {
    isEditing.value = false;
    editingId.value = null;
    Object.assign(form, emptyForm());
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const saveFood = async () => {
  isSaving.value = true;
  saveError.value = null;
  fieldErrors.value = {};
  try {
    const payload = { ...form };
    for (const { name } of safetyFields) {
      payload[name] = payload[name] === '' || payload[name] === null ? null : Number(payload[name]);
    }
    if (isEditing.value) {
      await updateFood(editingId.value, payload);
    } else {
      await createFood(payload);
    }
    await loadFoods();
    closeModal();
  } catch (error) {
    // Erros por campo vêm prontos da API e aparecem embaixo de cada campo.
    const parsed = parseApiError(error, t('errors.saveFood'));
    fieldErrors.value = parsed.fields;
    saveError.value = parsed.message;
  } finally {
    isSaving.value = false;
  }
};

const confirmDelete = async (food) => {
  if (confirm(t('admin.foods.confirmDelete', { name: food.name }))) {
    try {
      await deleteFood(food.id);
      await loadFoods();
    } catch (error) {
      alert(parseApiError(error, t('errors.deleteFood')).message);
    }
  }
};

// O nome da categoria (categoryLabel) vem traduzido da API.
watch(locale, loadFoods);

onMounted(() => {
  catalog.load().catch(() => {});
  loadFoods();
});
</script>

<style scoped>
.panel-head h2 { font-size: 0.9375rem; }

.foods th:first-child,
.foods td:first-child { padding-left: 24px; }
.foods th:last-child,
.foods td:last-child { padding-right: 16px; }

.foods .unit { font-weight: 400; }

.actions { white-space: nowrap; }

.pager {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px 10px 24px;
  border-top: 1px solid var(--line);
}

.food-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.span-2 { grid-column: span 3; }

.label .unit { color: var(--ink-3); font-weight: 400; }

.safety {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 12px 14px 14px;
  margin: 0;
}

.safety legend { padding: 0 6px; }

.safety > p { margin: 0 0 12px; }

@media (max-width: 600px) {
  .food-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .span-2 { grid-column: span 2; }
}
</style>
