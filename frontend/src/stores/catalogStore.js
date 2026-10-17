import { ref, computed, watch } from 'vue';
import { defineStore } from 'pinia';
import { getCatalog } from '@/services/apiService';
import { parseApiError } from '@/services/axiosSetup';
import { locale, t } from '@/i18n';

/*
 * Catálogo da API v1 (espécies, formulários, regras da dieta).
 * Guarda um catálogo por idioma; ao trocar o idioma da interface carrega o novo
 * e mantém o anterior na tela até ele chegar. O navegador ainda revalida via ETag.
 */
export const useCatalogStore = defineStore('catalog', () => {
  const byLocale = ref({});
  const catalog = ref(null);
  const error = ref(null);
  const pending = {};
  let requested = false;

  function load(lang = locale.value) {
    requested = true;
    if (byLocale.value[lang]) {
      if (lang === locale.value) catalog.value = byLocale.value[lang];
      return Promise.resolve(byLocale.value[lang]);
    }
    if (!pending[lang]) {
      pending[lang] = getCatalog(lang)
        .then((data) => {
          byLocale.value[lang] = data;
          if (lang === locale.value) {
            catalog.value = data;
            error.value = null;
          }
          return data;
        })
        .catch((err) => {
          if (lang === locale.value) error.value = parseApiError(err, t('errors.catalog')).message;
          throw err;
        })
        .finally(() => { delete pending[lang]; });
    }
    return pending[lang];
  }

  // Só recarrega se o catálogo já foi pedido alguma vez nesta sessão.
  watch(locale, (lang) => {
    if (requested) load(lang).catch(() => {});
  });

  const species = computed(() => catalog.value?.species ?? []);
  const diet = computed(() => catalog.value?.diet ?? null);

  const findSpecies = (code) => species.value.find((s) => s.code === code);
  const form = (name) => catalog.value?.forms?.[name] ?? null;
  const field = (formName, fieldName) => form(formName)?.fields.find((f) => f.name === fieldName) ?? null;

  return { catalog, error, load, species, diet, findSpecies, form, field };
});
