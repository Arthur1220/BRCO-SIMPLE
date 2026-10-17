<template>
  <div class="selector">
    <div class="toolbar">
      <label class="visually-hidden" for="food-search">{{ $t('foodSelector.searchPlaceholder') }}</label>
      <input id="food-search" v-model="searchQuery" class="input" type="search" :placeholder="$t('foodSelector.searchPlaceholder')">
      <button type="button" class="btn btn-secondary" @click="showCreateModal = true">{{ $t('foodSelector.createCustom') }}</button>
    </div>

    <p v-if="store.notice" class="alert alert-info notice" role="status">{{ store.notice }}</p>

    <p v-if="store.isLoading && store.availableFoods.length === 0" class="empty">{{ $t('foodSelector.loading') }}</p>
    <p v-else-if="groupedFoods.length === 0" class="empty">{{ $t('foodSelector.noResults') }}</p>

    <div v-else class="groups">
      <section v-for="group in groupedFoods" :key="group.code" class="group">
        <h3 class="group-title">{{ group.label }}</h3>
        <ul class="food-list">
          <li v-for="food in group.foods" :key="food.id ?? food.name" class="food" :class="{ 'is-selected': store.isSelected(food) }">
            <button
              type="button"
              class="food-toggle"
              :aria-pressed="store.isSelected(food)"
              @click="store.isSelected(food) ? removeFood(food) : store.addIngredient(food)"
            >
              <span class="check" aria-hidden="true">
                <svg v-if="store.isSelected(food)" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3.5 8.5l3 3 6-7" /></svg>
              </span>
              <span class="food-name">{{ food.name }}</span>
              <span v-if="!food.id" class="pill pill-info">{{ $t('foodSelector.customTag') }}</span>
            </button>
            <button type="button" class="btn btn-ghost btn-sm" @click="openPreview(food)">{{ $t('foodSelector.viewNutrients') }}</button>
          </li>
        </ul>
      </section>
    </div>

    <!-- Prévia de nutrientes -->
    <div v-if="previewFood" class="dialog-backdrop" @click.self="previewFood = null">
      <div class="dialog small-dialog" role="dialog" aria-modal="true" aria-labelledby="preview-title">
        <header class="dialog-head">
          <h2 id="preview-title">{{ previewFood.name }}</h2>
        </header>
        <div class="dialog-body">
          <dl class="nutrients">
            <div v-for="field in customFoodForm.fields" :key="field.name">
              <dt>{{ field.label }}</dt>
              <dd class="num">{{ previewFood[field.name] ?? '—' }} <span class="muted">{{ field.unit }}</span></dd>
            </div>
          </dl>
        </div>
        <footer class="dialog-foot">
          <button type="button" class="btn btn-ghost" @click="previewFood = null">{{ $t('common.close') }}</button>
          <button v-if="!store.isSelected(previewFood)" type="button" class="btn btn-primary" @click="store.addIngredient(previewFood); previewFood = null">{{ $t('common.add') }}</button>
        </footer>
      </div>
    </div>

    <!-- Alimento personalizado -->
    <div v-if="showCreateModal" class="dialog-backdrop" @click.self="showCreateModal = false">
      <form class="dialog" role="dialog" aria-modal="true" aria-labelledby="custom-title" @submit.prevent="createCustomFood">
        <header class="dialog-head">
          <h2 id="custom-title">{{ $t('foodSelector.newFood') }}</h2>
          <p>{{ $t('foodSelector.customHint', { unit: catalog.diet.foodNutrientUnit }) }}</p>
        </header>
        <div class="dialog-body custom-grid">
          <div class="field span-2">
            <label class="label" for="custom-name">{{ $t('common.name') }}</label>
            <input id="custom-name" v-model="customFood.name" class="input" type="text" required>
          </div>
          <div class="field span-2">
            <label class="label" for="custom-category">{{ $t('common.category') }}</label>
            <select id="custom-category" v-model="customFood.category" class="select" required>
              <option v-for="category in catalog.diet.categories" :key="category.code" :value="category.code">{{ category.label }}</option>
            </select>
          </div>
          <!-- Campos, unidades (g/kg MS) e limites vêm do catálogo da API -->
          <NumberField
            v-for="field in customFoodForm.fields"
            :key="field.name"
            :field="field"
            id-prefix="custom-"
            v-model="customFood[field.name]"
          />
        </div>
        <footer class="dialog-foot">
          <button type="button" class="btn btn-ghost" @click="showCreateModal = false">{{ $t('common.cancel') }}</button>
          <button type="submit" class="btn btn-primary">{{ $t('foodSelector.createAndAdd') }}</button>
        </footer>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { useDietStore } from '@/stores/dietStore';
import { useCatalogStore } from '@/stores/catalogStore';
import NumberField from '@/components/ui/NumberField.vue';

const store = useDietStore();
const catalog = useCatalogStore();
const searchQuery = ref('');
const showCreateModal = ref(false);
const previewFood = ref(null);

const customFoodForm = computed(() => catalog.form('customFood'));

const emptyCustomFood = () => ({
  name: '',
  category: catalog.diet.categories[0].code,
  ...Object.fromEntries(customFoodForm.value.fields.map((field) => [field.name, null])),
});
const customFood = reactive({});

// Agrupa na ordem e com os nomes de categoria do catálogo.
const groupedFoods = computed(() => {
  if (!catalog.diet) return [];
  const query = searchQuery.value.trim().toLowerCase();
  const foods = query
    ? store.availableFoods.filter((f) => f.name.toLowerCase().includes(query))
    : store.availableFoods;

  return catalog.diet.categories
    .map((category) => ({
      code: category.code,
      label: category.pluralLabel,
      foods: foods.filter((food) => food.category === category.code),
    }))
    .filter((group) => group.foods.length > 0);
});

const removeFood = (food) => {
  const index = store.selectedIngredients.findIndex((item) => item.key === (food.id ? `food:${food.id}` : `custom:${food.name}`));
  if (index !== -1) store.removeIngredient(index);
};

const createCustomFood = () => {
  // Alimento personalizado não tem id: vai para a API com a composição informada.
  const newFood = { ...customFood };
  store.availableFoods.push(newFood);
  store.addIngredient(newFood);
  showCreateModal.value = false;
  Object.assign(customFood, emptyCustomFood());
};

const openPreview = (food) => { previewFood.value = food; };

onMounted(async () => {
  await catalog.load();
  Object.assign(customFood, emptyCustomFood());
  if (store.availableFoods.length === 0) store.fetchFoods();
});
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--line);
}

.toolbar .input { max-width: 360px; }

.notice { margin: 16px 24px 0; }

.groups {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.group { padding: 16px 24px 20px; }
.group + .group { border-left: 1px solid var(--line); }

.group-title {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--ink-3);
  margin-bottom: 8px;
}

.food-list { list-style: none; }

.food {
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: var(--r);
}

.food:hover { background: #fcfbf9; }

.food .btn-ghost { opacity: 0; font-size: 0.75rem; }
.food:hover .btn-ghost,
.food .btn-ghost:focus-visible { opacity: 1; }

.food-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  padding: 8px 6px;
  text-align: left;
  font-size: 0.9375rem;
}

.check {
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border: 1px solid var(--line-strong);
  border-radius: 4px;
  background: var(--surface);
}

.check svg { width: 12px; height: 12px; }

.is-selected .check { background: var(--brand); border-color: var(--brand); color: var(--ink); }
.is-selected .food-name { font-weight: 500; }

.food-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Diálogos */
.small-dialog { max-width: 440px; }

.nutrients div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 0;
  border-bottom: 1px solid var(--line);
  font-size: 0.875rem;
}

.nutrients div:last-child { border-bottom: 0; }
.nutrients dt { color: var(--ink-2); }

.custom-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.span-2 { grid-column: span 2; }

@media (max-width: 860px) {
  .groups { grid-template-columns: 1fr; }
  .group + .group { border-left: 0; border-top: 1px solid var(--line); }
  .food .btn-ghost { opacity: 1; }
}

@media (max-width: 600px) {
  .toolbar { flex-direction: column; padding: 12px 16px; }
  .toolbar .input { max-width: none; }
  .group { padding: 12px 16px 16px; }
  .custom-grid { grid-template-columns: 1fr; }
  .span-2 { grid-column: auto; }
}
</style>
