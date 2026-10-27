<template>
  <p v-if="store.selectedIngredients.length === 0" class="empty">{{ $t('balancer.empty') }}</p>

  <div v-else-if="fields" class="table-wrap">
    <table class="table balancer">
      <thead>
        <tr>
          <th>{{ $t('balancer.food') }}</th>
          <th v-for="field in fields" :key="field.name">{{ field.label }} <span class="unit">({{ field.unit }})</span></th>
          <th><span class="visually-hidden">{{ $t('common.remove') }}</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in store.selectedIngredients" :key="item.key">
          <td>
            <span class="food-name">{{ item.name }}</span>
            <span v-if="item.percent > 0" class="pill pill-brand num">{{ item.percent }}%</span>
          </td>
          <!-- Labels, unidades e limites de preço/inclusão vêm do catálogo da API -->
          <td v-for="field in fields" :key="field.name">
            <input
              v-model.number="item[field.name]"
              class="input input-sm"
              type="number"
              inputmode="decimal"
              :aria-label="`${field.label} · ${item.name}`"
              :placeholder="field.placeholder"
              :step="field.step"
              :min="field.min"
              :max="field.max"
            >
          </td>
          <td class="right">
            <button type="button" class="btn btn-ghost btn-icon btn-sm" :aria-label="`${$t('common.remove')} ${item.name}`" @click="store.removeIngredient(index)">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useDietStore } from '@/stores/dietStore';
import { useCatalogStore } from '@/stores/catalogStore';

const store = useDietStore();
const catalog = useCatalogStore();

// Ordem de exibição: preço, mínimo, máximo.
const ORDER = ['price', 'min', 'max'];
const fields = computed(() => {
  const form = catalog.form('dietIngredient');
  return form ? ORDER.map((name) => form.fields.find((f) => f.name === name)) : null;
});
</script>

<style scoped>
.balancer th:first-child,
.balancer td:first-child { padding-left: 24px; }
.balancer th:last-child,
.balancer td:last-child { padding-right: 16px; }

.balancer .unit { font-weight: 400; }

.food-name { font-weight: 500; margin-right: 8px; }

.input-sm { height: 34px; max-width: 120px; font-size: 0.875rem; }

@media (max-width: 720px) {
  .balancer th:first-child,
  .balancer td:first-child { padding-left: 16px; }
}
</style>
