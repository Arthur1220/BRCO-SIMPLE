<template>
  <div class="foods-manager">
    <div class="section-header">
      <h2>Gerenciamento de Alimentos</h2>
      <button @click="openModal()" class="btn-add">+ Novo Alimento</button>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Categoria</th>
            <th>MS (%)</th>
            <th>PB (%)</th>
            <th>NDT (%)</th>
            <th class="actions-col">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="food in paginatedFoods" :key="food.id">
            <td class="font-medium">{{ food.name }}</td>
            <td>
              <span class="category-badge" :class="food.category?.toLowerCase()">
                {{ food.category?.charAt(0) || '?' }}
              </span>
              {{ food.category }}
            </td>
            <td>{{ food.MS }}</td>
            <td>{{ food.PB }}</td>
            <td>{{ food.NDT }}</td>
            <td class="actions-cell">
              <button @click="openModal(food)" class="btn-icon edit" title="Editar">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
              </button>
              <button @click="confirmDelete(food)" class="btn-icon delete" title="Excluir">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
        <button @click="prevPage" :disabled="currentPage === 1" class="page-btn">←</button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages" class="page-btn">→</button>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>{{ isEditing ? 'Editar Alimento' : 'Novo Alimento' }}</h3>
        <form @submit.prevent="saveFood">
          <div class="form-grid">
            <div class="field full-width">
              <label>Nome</label>
              <input v-model="form.name" type="text" required>
            </div>
            <div class="field full-width">
              <label>Categoria</label>
              <select v-model="form.category" required>
                <option value="VOLUMOSO">Volumoso</option>
                <option value="CONCENTRADO">Concentrado</option>
                <option value="SUPLEMENTO">Suplemento</option>
              </select>
            </div>
            <div class="field" v-for="field in nutrientFields" :key="field">
              <label>{{ field }}</label>
              <input v-model.number="form[field]" type="number" step="0.01">
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-cancel">Cancelar</button>
            <button type="submit" class="btn-confirm" :disabled="isSaving">
                {{ isSaving ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { getFoods } from '@/services/apiService';
import { createFood, updateFood, deleteFood } from '@/services/adminService';

const foods = ref([]);
const showModal = ref(false);
const isEditing = ref(false);
const isSaving = ref(false);
const editingId = ref(null);

const nutrientFields = ['MS', 'MO', 'EE', 'PB', 'NDT', 'FDNcp', 'CNF', 'Ca', 'P', 'PDR', 'PNDR'];

const form = reactive({
  name: '', category: 'VOLUMOSO',
  MS: 0, MO: 0, EE: 0, PB: 0, NDT: 0, FDNcp: 0, CNF: 0, Ca: 0, P: 0, PDR: 0, PNDR: 0
});

// Paginação
const currentPage = ref(1);
const itemsPerPage = 8;
const totalPages = computed(() => Math.ceil(foods.value.length / itemsPerPage) || 1);
const paginatedFoods = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return foods.value.slice(start, start + itemsPerPage);
});
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };
const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };

// Carregar dados
const loadFoods = async () => {
  try {
    foods.value = await getFoods();
  } catch (error) {
    console.error("Erro ao carregar alimentos:", error);
  }
};

// Abrir Modal
const openModal = (food = null) => {
  if (food) {
    isEditing.value = true;
    editingId.value = food.id;
    Object.assign(form, food); // Preenche o formulário
  } else {
    isEditing.value = false;
    editingId.value = null;
    // Reseta o formulário
    Object.keys(form).forEach(key => form[key] = (key === 'category' ? 'VOLUMOSO' : (key === 'name' ? '' : 0)));
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

// Salvar (Criar ou Editar)
const saveFood = async () => {
  isSaving.value = true;
  try {
    if (isEditing.value) {
      await updateFood(editingId.value, form);
    } else {
      await createFood(form);
    }
    await loadFoods(); // Recarrega a lista
    closeModal();
  } catch (error) {
    alert("Erro ao salvar alimento.");
  } finally {
    isSaving.value = false;
  }
};

// Excluir
const confirmDelete = async (food) => {
  if (confirm(`Tem certeza que deseja excluir "${food.name}"?`)) {
    try {
      await deleteFood(food.id);
      await loadFoods();
    } catch (error) {
      alert("Erro ao excluir.");
    }
  }
};

onMounted(loadFoods);
</script>

<style scoped>
.foods-manager { margin-top: 4rem; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
h2 { font-size: 1.8rem; color: var(--black); margin: 0; }

.btn-add {
  background-color: var(--orange); color: white; border: none; padding: 0.7rem 1.2rem;
  border-radius: 8px; font-weight: bold; cursor: pointer; transition: background 0.3s;
}
.btn-add:hover { background-color: var(--light-orange); }

.table-container { width: 100%; overflow-x: auto; border: 1px solid var(--grey-light); border-radius: 8px; background: white; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 1rem; text-align: left; border-bottom: 1px solid var(--grey-light); white-space: nowrap; }
th { background-color: #f8f9fa; font-weight: 600; font-size: 0.9rem; color: var(--black-light); }
.font-medium { font-weight: 600; color: var(--black); }

.actions-cell { display: flex; gap: 0.5rem; }
.btn-icon { background: none; border: none; cursor: pointer; padding: 0.4rem; border-radius: 4px; color: var(--grey); transition: all 0.2s; }
.btn-icon:hover { background-color: var(--grey-light); }
.btn-icon.edit:hover { color: var(--orange); }
.btn-icon.delete:hover { color: var(--red-error); }
.w-5 { width: 20px; height: 20px; }

.category-badge {
  font-size: 0.7rem; font-weight: bold; color: white; background-color: #999;
  width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 8px;
}
.category-badge.volumoso { background-color: #27ae60; }
.category-badge.concentrado { background-color: #f39c12; }
.category-badge.suplemento { background-color: #8e44ad; }

/* Modal Styles */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 2000; backdrop-filter: blur(2px); }
.modal-content { background: white; padding: 2rem; border-radius: 12px; width: 95%; max-width: 700px; box-shadow: 0 15px 40px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 2rem; margin-top: 1.5rem;}
.field.full-width { grid-column: 1 / -1; }
.field label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.4rem; color: var(--black-light); }
.field input, .field select { width: 100%; padding: 0.6rem; border: 1px solid var(--grey); border-radius: 6px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 1rem; }
.btn-cancel { padding: 0.7rem 1.5rem; border: 1px solid var(--grey); background: white; color: var(--black); border-radius: 6px; cursor: pointer; font-weight: bold; }
.btn-confirm { padding: 0.7rem 1.5rem; border: none; background: var(--orange); color: white; border-radius: 6px; cursor: pointer; font-weight: bold; }
.btn-confirm:disabled { opacity: 0.7; cursor: not-allowed; }

.pagination { display: flex; justify-content: flex-end; align-items: center; padding: 1rem; gap: 1rem; background: #fafafa; border-top: 1px solid var(--grey-light); }
.page-btn { background: white; border: 1px solid var(--grey); padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
