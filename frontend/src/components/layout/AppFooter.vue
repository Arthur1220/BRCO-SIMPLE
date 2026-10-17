<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-top">
        <div class="footer-about">
          <div class="brand">
            <span class="brand-mark" aria-hidden="true"></span>
            <span class="brand-name">BRCO</span>
          </div>
          <p>{{ $t('footer.aboutText') }}</p>
        </div>

        <nav class="footer-nav" :aria-label="$t('footer.navTitle')">
          <router-link to="/calcular/exigencias">{{ $t('nav.requirementsShort') }}</router-link>
          <router-link to="/calcular/ndt">{{ $t('nav.ndtShort') }}</router-link>
          <router-link to="/formulacao-dieta">{{ $t('nav.dietShort') }}</router-link>
          <router-link to="/equipe">{{ $t('nav.team') }}</router-link>
          <router-link to="/admin">{{ $t('nav.admin') }}</router-link>
        </nav>
      </div>

      <div class="supporters">
        <span class="eyebrow">{{ $t('footer.supportTitle') }}</span>
        <div class="logos">
          <a v-for="logo in logos" :key="logo.name" :href="logo.url" target="_blank" rel="noopener noreferrer" :title="logo.name">
            <img :src="logo.src" :alt="$t('footer.logoAlt', { name: logo.name })" loading="lazy">
          </a>
        </div>
      </div>

      <p class="footer-note">© {{ year }} BRCO · {{ $t('footer.copyright') }}</p>
    </div>
  </footer>
</template>

<script setup>
import cnpq from '@/assets/logos/cnpq.jpg';
import uesc from '@/assets/logos/uesc.png';
import ufc from '@/assets/logos/ufc.png';
import ufba from '@/assets/logos/ufba.png';

const year = new Date().getFullYear();

const logos = [
  { name: 'CNPq', url: 'https://www.cnpq.br/', src: cnpq },
  { name: 'UESC', url: 'https://www.uesc.br/', src: uesc },
  { name: 'UFC', url: 'https://www.ufc.br/', src: ufc },
  { name: 'UFBA', url: 'https://www.ufba.br/', src: ufba },
];
</script>

<style scoped>
.footer {
  margin-top: auto;
  padding: 48px 0 32px;
  border-top: 1px solid var(--line);
  background: var(--surface);
}

.footer-top {
  display: flex;
  justify-content: space-between;
  gap: 32px;
  flex-wrap: wrap;
}

.footer-about { max-width: 420px; }
.footer-about p { margin-top: 10px; font-size: 0.875rem; }

.brand { display: flex; align-items: center; gap: 10px; }
.brand-mark { width: 12px; height: 12px; border-radius: 3px; background: var(--brand); }
.brand-name { font-weight: 600; letter-spacing: 0.02em; }

.footer-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  align-content: flex-start;
}

.footer-nav a {
  font-size: 0.875rem;
  color: var(--ink-2);
  text-decoration: none;
}

.footer-nav a:hover { color: var(--ink); }

.supporters {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid var(--line);
}

.logos { display: flex; align-items: center; gap: 28px; flex-wrap: wrap; }

.logos img {
  height: 28px;
  width: auto;
  filter: grayscale(1);
  opacity: 0.65;
  transition: filter var(--ease), opacity var(--ease);
}

.logos a:hover img { filter: none; opacity: 1; }

.footer-note {
  margin-top: 24px;
  font-size: 0.8125rem;
  color: var(--ink-3);
}
</style>
