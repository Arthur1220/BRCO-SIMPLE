<template>
  <header class="header">
    <div class="container header-bar">
      <router-link to="/" class="brand" :aria-label="$t('nav.home')">
        <span class="brand-mark" aria-hidden="true"></span>
        <span class="brand-name">BRCO</span>
        <span class="brand-tagline">{{ $t('header.tagline') }}</span>
      </router-link>

      <nav class="nav" :class="{ 'is-open': isMenuOpen }" :aria-label="$t('nav.main')">
        <router-link v-for="link in links" :key="link.to" :to="link.to" class="nav-link" :class="{ 'is-active': isActive(link) }">
          {{ $t(link.label) }}
        </router-link>
      </nav>

      <div class="header-actions">
        <div class="segmented lang" role="group" :aria-label="$t('language.label')">
          <button
            v-for="lang in SUPPORTED_LOCALES"
            :key="lang"
            type="button"
            :class="{ 'is-active': locale === lang }"
            :aria-pressed="locale === lang"
            :title="$t(`language.${lang}`)"
            :lang="lang"
            @click="setLocale(lang)"
          >
            {{ LANG_SHORT[lang] }}
          </button>
        </div>

        <button class="btn btn-ghost btn-icon menu-toggle" :aria-expanded="isMenuOpen" :aria-label="$t('nav.toggleMenu')" @click="isMenuOpen = !isMenuOpen">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path v-if="!isMenuOpen" d="M2 4.5h12M2 8h12M2 11.5h12" />
            <path v-else d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { SUPPORTED_LOCALES, setLocale } from '@/i18n';

const { locale } = useI18n();
const route = useRoute();
const LANG_SHORT = { 'pt-BR': 'PT', en: 'EN' };

const links = [
  { to: '/calcular/exigencias', label: 'nav.requirementsShort' },
  { to: '/calcular/ndt', label: 'nav.ndtShort' },
  { to: '/formulacao-dieta', label: 'nav.dietShort' },
  { to: '/equipe', label: 'nav.team' },
];

const isActive = (link) => route.path.startsWith(link.to);
const isMenuOpen = ref(false);

watch(() => route.path, () => { isMenuOpen.value = false; });
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: color-mix(in srgb, var(--bg) 92%, transparent);
  backdrop-filter: saturate(140%) blur(8px);
  border-bottom: 1px solid var(--line);
}

.header-bar {
  display: flex;
  align-items: center;
  gap: 32px;
  height: var(--header-h);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--ink);
  text-decoration: none;
}

.brand-mark {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  background: var(--brand);
}

.brand-name {
  font-weight: 600;
  font-size: 1rem;
  letter-spacing: 0.02em;
}

.brand-tagline {
  font-size: 0.8125rem;
  color: var(--ink-3);
  padding-left: 10px;
  border-left: 1px solid var(--line-strong);
}

.nav {
  display: flex;
  align-self: stretch;
  gap: 4px;
}

.nav-link {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-size: 0.875rem;
  color: var(--ink-2);
  text-decoration: none;
  transition: color var(--ease);
}

.nav-link:hover { color: var(--ink); }

.nav-link.is-active { color: var(--ink); font-weight: 500; }

.nav-link.is-active::after {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: -1px;
  height: 2px;
  background: var(--brand);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.lang button { height: 26px; padding: 0 10px; font-size: 0.75rem; font-family: var(--font-mono); }

.menu-toggle { display: none; }

@media (max-width: 860px) {
  .brand-tagline { display: none; }
  .menu-toggle { display: inline-flex; }

  .nav {
    display: none;
    position: absolute;
    top: var(--header-h);
    left: 0;
    right: 0;
    flex-direction: column;
    gap: 0;
    padding: 8px var(--gutter) 16px;
    background: var(--bg);
    border-bottom: 1px solid var(--line);
  }

  .nav.is-open { display: flex; }

  .nav-link { height: 44px; padding: 0; border-bottom: 1px solid var(--line); }
  .nav-link:last-child { border-bottom: 0; }
  .nav-link.is-active::after { left: -12px; right: auto; top: 12px; bottom: 12px; width: 2px; height: auto; }
}
</style>
