<template>
  <div class="food-selector-container">

    <div class="search-wrapper">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Buscar alimento (ex: Milho, Soja...)"
        class="search-input"
      />
    </div>

    <div class="food-list">
      <div v-if="store.isLoading && store.availableFoods.length === 0" class="loading-text">
        Carregando alimentos...
      </div>

      <div v-else>
        <template v-for="(foods, categoryKey) in groupedFoods" :key="categoryKey">

          <div class="category-header">
            {{ categoryLabels[categoryKey] || categoryKey }}
          </div>

          <div
            v-for="food in foods"
            :key="food.id"
            class="food-item"
            :class="{ 'is-selected': isAdded(food) }"
          >
            <div class="food-info">
              <span class="food-name">{{ food.name }}</span>
            </div>

            <div class="food-actions">
              <button @click.stop="openPreview(food)" class="btn-icon btn-preview" title="Ver Nutrientes">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;">
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                  <path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clip-rule="evenodd" />
                </svg>
              </button>

              <button
                v-if="!isAdded(food)"
                @click="store.addIngredient(food)"
                class="btn-icon btn-add"
                title="Adicionar"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;">
                  <path fill-rule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clip-rule="evenodd" />
                </svg>
              </button>

              <button
                v-else
                @click="removeFood(food)"
                class="btn-icon btn-remove"
                title="Remover da lista"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;">
                  <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.477a8.666 8.666 0 013.751 0zm-2.546 10.716a.75.75 0 00-1.5 0v-5.43a.75.75 0 00-1.5 0v5.43a.75.75 0 001.5 0zm3 0a.75.75 0 00-1.5 0v-5.43a.75.75 0 00-1.5 0v5.43zM9 15.194a.75.75 0 01-1.5 0v-5.43a.75.75 0 011.5 0v5.43z" clip-rule="evenodd" />
                  <path d="M15.75 3a.75.75 0 100 1.5H8.25a.75.75 0 000-1.5h7.5z" />
                </svg>
              </button>
            </div>
          </div>
        </template>

        <div v-if="!store.isLoading && Object.keys(groupedFoods).length === 0" class="no-results">
          Nenhum alimento encontrado.
        </div>
      </div>
    </div>

    <div class="custom-food-footer">
      <p>Não encontrou o que procura?</p>
      <button @click="showCreateModal = true" class="btn-custom">
        + Criar Alimento Personalizado
      </button>
    </div>

    <div v-if="showPreviewModal && previewFood" class="modal-overlay" @click.self="closePreview">
        <div class="modal-content preview-card">
            <div class="preview-header">
                <h3>{{ previewFood.name }}</h3>
            </div>
            <div class="nutrient-grid">
                <div class="nutrient-item"><strong>MS:</strong> {{ previewFood.MS }}%</div>
                <div class="nutrient-item"><strong>PB:</strong> {{ previewFood.PB }}%</div>
                <div class="nutrient-item"><strong>NDT:</strong> {{ previewFood.NDT }}%</div>
                <div class="nutrient-item"><strong>Ca:</strong> {{ previewFood.Ca }}%</div>
                <div class="nutrient-item"><strong>P:</strong> {{ previewFood.P }}%</div>
                <div class="nutrient-item"><strong>FDN:</strong> {{ previewFood.FDNcp }}%</div>
            </div>
            <div class="modal-actions">
                <button @click="closePreview" class="btn-cancel">Fechar</button>
                <button v-if="!isAdded(previewFood)" @click="store.addIngredient(previewFood); closePreview()" class="btn-confirm">Adicionar</button>
            </div>
        </div>
    </div>

    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-content">
        <h3>Novo Alimento</h3>
        <form @submit.prevent="createCustomFood">
          <div class="form-grid">
            <div class="field full-width">
              <label>Nome</label>
              <input v-model="customFood.name" type="text" required>
            </div>
            <div class="field full-width">
              <label>Categoria</label>
              <select v-model="customFood.category" required>
                <option value="VOLUMOSO">Volumoso</option>
                <option value="ENERGETICO">Concentrado Energético</option>
                <option value="PROTEICO">Concentrado Proteico</option>
                <option value="SUPLEMENTO">Suplemento</option>
              </select>
            </div>
            <div class="field"><label>MS (%)</label><input v-model.number="customFood.MS" type="number" step="0.1"></div>
            <div class="field"><label>PB (%)</label><input v-model.number="customFood.PB" type="number" step="0.1"></div>
            <div class="field"><label>NDT (%)</label><input v-model.number="customFood.NDT" type="number" step="0.1"></div>
            <div class="field"><label>Ca (%)</label><input v-model.number="customFood.Ca" type="number" step="0.01"></div>
            <div class="field"><label>P (%)</label><input v-model.number="customFood.P" type="number" step="0.01"></div>
             <div class="field"><label>FDN (%)</label><input v-model.number="customFood.FDNcp" type="number" step="0.1"></div>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showCreateModal = false" class="btn-cancel">Cancelar</button>
            <button type="submit" class="btn-confirm">Criar e Adicionar</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { useDietStore } from '@/stores/dietStore';

const store = useDietStore();
const searchQuery = ref('');
const showCreateModal = ref(false);
const showPreviewModal = ref(false);
const previewFood = ref(null);

const categoryLabels = {
    'VOLUMOSO': 'Volumosos',
    'ENERGETICO': 'Conc. Energéticos',
    'PROTEICO': 'Conc. Proteicos',
    'SUPLEMENTO': 'Suplementos',
    'Outros': 'Outros'
};

const initialCustomState = { name: '', category: 'VOLUMOSO', MS: 0, PB: 0, NDT: 0, Ca: 0, P: 0, FDNcp: 0 };
const customFood = reactive({ ...initialCustomState });

const groupedFoods = computed(() => {
    const groups = { 'VOLUMOSO': [], 'ENERGETICO': [], 'PROTEICO': [], 'SUPLEMENTO': [] };

    const foods = searchQuery.value
        ? store.availableFoods.filter(f => f.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
        : store.availableFoods;

    foods.forEach(food => {
        const cat = food.category || 'Outros';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(food);
    });

    Object.keys(groups).forEach(k => { if (groups[k].length === 0) delete groups[k]; });
    return groups;
});

const isAdded = (food) => {
    return store.selectedIngredients.some(i => i.name === food.name); // Verifica por nome (funciona para customizados sem ID)
};

const removeFood = (food) => {
    const index = store.selectedIngredients.findIndex(i => i.name === food.name);
    if (index !== -1) store.removeIngredient(index);
};

const selectFood = (food) => {
    if (!isAdded(food)) store.addIngredient(food);
};

// --- LÓGICA NOVA: Criar e Adicionar à Lista ---
const createCustomFood = () => {
    // 1. Cria o objeto do novo alimento
    const newFood = { ...customFood, id: 'custom_' + Date.now() }; // Adiciona um ID falso para o sistema

    // 2. Adiciona ao store de disponíveis (para aparecer na lista visualmente)
    // Usamos unshift para ele aparecer no topo da categoria ou da lista
    store.availableFoods.push(newFood);

    // 3. Seleciona ele automaticamente para a dieta
    store.addIngredient(newFood);

    // 4. Limpeza
    showCreateModal.value = false;
    Object.assign(customFood, initialCustomState);
};
// ----------------------------------------------

const openPreview = (food) => { previewFood.value = food; showPreviewModal.value = true; };
const closePreview = () => { showPreviewModal.value = false; previewFood.value = null; };

onMounted(() => {
    if (store.availableFoods.length === 0) store.fetchFoods();
});
</script>

<style scoped>
/* ... (Estilos anteriores mantidos) ... */

.food-selector-container { display: flex; flex-direction: column; height: 100%; max-height: 600px; border: 1px solid var(--grey-light); border-radius: 8px; background: var(--white); overflow: hidden; }
.search-wrapper { padding: 1rem; border-bottom: 1px solid var(--grey-light); background: #f9f9f9; }
.search-input { width: 100%; padding: 0.7rem; border: 1px solid var(--grey); border-radius: 6px; font-size: 0.95rem; }
.food-list { flex-grow: 1; overflow-y: auto; padding-bottom: 1rem; }
.category-header { background: #f0f2f5; color: var(--black-light); padding: 0.5rem 1rem; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--grey-light); position: sticky; top: 0; z-index: 10; }
.food-item { padding: 0.8rem 1rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f0f0f0; transition: background 0.2s; }
.food-item.is-selected { background-color: #e8f5e9; }
.food-item:hover:not(.is-selected) { background-color: #f8f9fa; }
.food-info { display: flex; align-items: center; gap: 0.5rem; }
.food-name { font-size: 0.95rem; color: var(--black); }
.food-actions { display: flex; gap: 0.5rem; align-items: center; }
.btn-icon { width: 32px; height: 32px; border-radius: 6px; border: 1px solid #e0e0e0; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; padding: 0; }
.btn-preview:hover { background-color: #f0f0f0; border-color: #ccc; }
.btn-add:hover { background-color: #e8f5e9; border-color: #27ae60; }
.btn-remove:hover { background-color: #ffebee; border-color: #e74c3c; }
.category-badge { width: 20px; height: 20px; border-radius: 50%; color: white; font-size: 0.7rem; font-weight: bold; display: flex; align-items: center; justify-content: center; margin-left: 8px; text-transform: uppercase; }
.volumoso { background-color: #27ae60; } .energetico { background-color: #f39c12; } .proteico { background-color: #e74c3c; } .suplemento { background-color: #8e44ad; }

/* --- CORREÇÃO RESPONSIVA DO MODAL --- */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 2000; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(2px); }

.modal-content {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 15px 40px rgba(0,0,0,0.2);
    max-height: 90vh;
    overflow-y: auto;
    /* Correção Mobile */
    width: 95%;
    max-width: 600px;
}

.form-grid {
    display: grid;
    /* Correção Mobile: 1 coluna em telas pequenas, 2 em maiores */
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
}

@media (min-width: 600px) {
    .form-grid { grid-template-columns: 1fr 1fr; }
}

.field.full-width { grid-column: 1 / -1; }
.field label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.4rem; color: var(--black); }
.field input, .field select { width: 100%; padding: 0.6rem; border: 1px solid var(--grey); border-radius: 5px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 1rem; }
.custom-food-footer { padding: 1rem; text-align: center; border-top: 1px solid var(--grey-light); }
.btn-custom { width: 100%; padding: 0.7rem; border: 1px dashed var(--orange); color: var(--orange); background: white; border-radius: 6px; font-weight: 600; cursor: pointer; }
.btn-custom:hover { background: var(--orange); color: white; border-style: solid; }
.btn-cancel { padding: 0.6rem 1.2rem; border: 1px solid var(--grey); background: white; border-radius: 6px; cursor: pointer; }
.btn-confirm { padding: 0.6rem 1.2rem; border: none; background: var(--blue); color: white; border-radius: 6px; font-weight: bold; cursor: pointer; }
</style>
