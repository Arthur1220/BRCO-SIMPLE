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

    <p v-if="store.notice" class="notice">{{ store.notice }}</p>

    <div class="food-list">
      <div v-if="store.isLoading && store.availableFoods.length === 0" class="loading-text">
        Carregando alimentos...
      </div>

      <div v-else>
        <template v-for="group in groupedFoods" :key="group.code">

          <div class="category-header">{{ group.label }}</div>

          <div
            v-for="food in group.foods"
            :key="food.id ?? food.name"
            class="food-item"
            :class="{ 'is-selected': store.isSelected(food) }"
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
                v-if="!store.isSelected(food)"
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

        <div v-if="!store.isLoading && groupedFoods.length === 0" class="no-results">
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
                <div class="nutrient-item" v-for="field in customFoodForm.fields" :key="field.name">
                  <strong>{{ field.name }}:</strong> {{ previewFood[field.name] }} {{ field.unit }}
                </div>
            </div>
            <div class="modal-actions">
                <button @click="closePreview" class="btn-cancel">Fechar</button>
                <button v-if="!store.isSelected(previewFood)" @click="store.addIngredient(previewFood); closePreview()" class="btn-confirm">Adicionar</button>
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
                <option v-for="category in catalog.diet.categories" :key="category.code" :value="category.code">{{ category.label }}</option>
              </select>
            </div>
            <!-- Campos, unidades (g/kg MS) e limites vêm do catálogo da API -->
            <div class="field" v-for="field in customFoodForm.fields" :key="field.name">
              <label :title="field.label">{{ field.name }} ({{ field.unit }})</label>
              <input v-model.number="customFood[field.name]" type="number" :step="field.step" :min="field.min" :max="field.max" :placeholder="field.placeholder" required>
            </div>
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
import { useCatalogStore } from '@/stores/catalogStore';

const store = useDietStore();
const catalog = useCatalogStore();
const searchQuery = ref('');
const showCreateModal = ref(false);
const showPreviewModal = ref(false);
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
    const query = searchQuery.value.toLowerCase();
    const foods = query
        ? store.availableFoods.filter(f => f.name.toLowerCase().includes(query))
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

const openPreview = (food) => { previewFood.value = food; showPreviewModal.value = true; };
const closePreview = () => { showPreviewModal.value = false; previewFood.value = null; };

onMounted(async () => {
    await catalog.load();
    Object.assign(customFood, emptyCustomFood());
    if (store.availableFoods.length === 0) store.fetchFoods();
});
</script>

<style scoped>
/* =========================================
   1. Container Principal (Seletor)
   ========================================= */
.food-selector-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 600px;
  border: 1px solid var(--grey-light);
  border-radius: 8px;
  background: var(--white);
  overflow: hidden; /* Mantém tudo dentro das bordas arredondadas */
}

/* =========================================
   2. Área de Busca
   ========================================= */
.search-wrapper {
  padding: 1rem;
  border-bottom: 1px solid var(--grey-light);
  background: #f9f9f9;
}

.search-input {
  width: 100%;
  padding: 0.7rem;
  border: 1px solid var(--grey);
  border-radius: 6px;
  font-size: 0.95rem;
}

/* =========================================
   3. Lista de Alimentos (Scroll)
   ========================================= */
.food-list {
  flex-grow: 1; /* Ocupa o espaço restante */
  overflow-y: auto;
  padding-bottom: 1rem;
}

/* Cabeçalho da Categoria (Sticky) */
.category-header {
  background: #f0f2f5;
  color: var(--black-light);
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--grey-light);

  /* Faz o cabeçalho "grudar" no topo ao rolar */
  position: sticky;
  top: 0;
  z-index: 10;
}

/* =========================================
   4. Item de Alimento (Linha)
   ========================================= */
.food-item {
  padding: 0.8rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.food-item.is-selected {
  background-color: #e8f5e9; /* Verde claro indicando seleção */
}

.food-item:hover:not(.is-selected) {
  background-color: #f8f9fa;
}

.food-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.food-name {
  font-size: 0.95rem;
  color: var(--black);
}

/* =========================================
   5. Ações e Botões do Item
   ========================================= */
.food-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

/* Botão Base (Ícone) */
.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
}

/* Variações de Hover dos Botões */
.btn-preview:hover {
  background-color: #f0f0f0;
  border-color: #ccc;
}

.btn-add:hover {
  background-color: #e8f5e9;
  border-color: #27ae60;
}

.btn-remove:hover {
  background-color: #ffebee;
  border-color: #e74c3c;
}

/* =========================================
   6. Badges de Categoria
   ========================================= */
.category-badge {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  text-transform: uppercase;
}

/* Cores das Categorias */
.volumoso   { background-color: #27ae60; }
.concentrado { background-color: #f39c12; }
.suplemento { background-color: #8e44ad; }

/* =========================================
   7. Rodapé do Seletor (Custom Food)
   ========================================= */
.custom-food-footer {
  padding: 1rem;
  text-align: center;
  border-top: 1px solid var(--grey-light);
}

.btn-custom {
  width: 100%;
  padding: 0.7rem;
  border: 1px dashed var(--orange);
  color: var(--orange);
  background: white;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.btn-custom:hover {
  background: var(--orange);
  color: white;
  border-style: solid;
}

/* =========================================
   8. Modal de Cadastro (Overlay & Content)
   ========================================= */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;

  /* Largura Responsiva */
  width: 95%;
  max-width: 600px;
}

/* =========================================
   9. Formulário do Modal (Grid)
   ========================================= */
.form-grid {
  display: grid;
  /* Mobile First: 1 coluna por padrão */
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

.field label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
  color: var(--black);
}

.field input,
.field select {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid var(--grey);
  border-radius: 5px;
}

.field.full-width {
  grid-column: 1 / -1; /* Ocupa toda a linha */
}

/* Ações do Modal */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-cancel {
  padding: 0.6rem 1.2rem;
  border: 1px solid var(--grey);
  background: white;
  border-radius: 6px;
  cursor: pointer;
}

.btn-confirm {
  padding: 0.6rem 1.2rem;
  border: none;
  background: var(--blue);
  color: white;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}

/* =========================================
   10. Media Queries (Desktop)
   ========================================= */
@media (min-width: 600px) {
  /* Em telas maiores, o formulário usa 2 colunas */
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.notice {
  margin: 0.75rem 0;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  background: #fff4e5;
  color: var(--black-light);
  font-size: 0.9rem;
}
</style>
