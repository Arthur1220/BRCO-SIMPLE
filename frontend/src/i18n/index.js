import { createI18n } from 'vue-i18n';
import ptBR from './messages/pt-BR';
import en from './messages/en';

// Idiomas da interface (os mesmos que a API v1 aceita).
export const SUPPORTED_LOCALES = ['pt-BR', 'en'];
export const DEFAULT_LOCALE = 'pt-BR';

const STORAGE_KEY = 'brcoLocale';

const normalizeLocale = (value) => {
  const lower = String(value || '').toLowerCase();
  if (lower.startsWith('pt')) return 'pt-BR';
  if (lower.startsWith('en')) return 'en';
  return null;
};

const readStoredLocale = () => {
  try {
    return normalizeLocale(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
};

// Escolha salva pelo usuário; senão o idioma do navegador; senão pt-BR.
const initialLocale = () =>
  readStoredLocale()
  || (navigator.languages || [navigator.language]).map(normalizeLocale).find(Boolean)
  || DEFAULT_LOCALE;

const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: { 'pt-BR': ptBR, en },
});

// Idioma ativo (ref reativo): usado no header Accept-Language e na formatação de números.
export const locale = i18n.global.locale;

export const t = (...args) => i18n.global.t(...args);

export function setLocale(value) {
  const next = normalizeLocale(value) || DEFAULT_LOCALE;
  locale.value = next;
  document.documentElement.lang = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Sem localStorage (modo privado): vale só para esta sessão.
  }
}

document.documentElement.lang = locale.value;

export default i18n;
