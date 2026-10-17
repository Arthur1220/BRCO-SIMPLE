import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { getCatalog } from '@/services/apiService';
import { parseApiError } from '@/services/axiosSetup';

/*
 * Catálogo da API v1 (espécies, formulários, regras da dieta).
 * Carregado uma vez; o navegador ainda revalida via ETag.
 */
export const useCatalogStore = defineStore('catalog', () => {
  const catalog = ref(null);
  const error = ref(null);
  let pending = null;

  async function load() {
    if (catalog.value) return catalog.value;
    if (!pending) {
      pending = getCatalog()
        .then((data) => {
          catalog.value = data;
          error.value = null;
          return data;
        })
        .catch((err) => {
          error.value = parseApiError(err, 'Não foi possível carregar as opções do sistema.').message;
          throw err;
        })
        .finally(() => { pending = null; });
    }
    return pending;
  }

  const species = computed(() => catalog.value?.species ?? []);
  const diet = computed(() => catalog.value?.diet ?? null);

  const findSpecies = (code) => species.value.find((s) => s.code === code);
  const form = (name) => catalog.value?.forms?.[name] ?? null;
  const field = (formName, fieldName) => form(formName)?.fields.find((f) => f.name === fieldName) ?? null;

  return { catalog, error, load, species, diet, findSpecies, form, field };
});
