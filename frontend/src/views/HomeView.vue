<template>
  <div class="home">
    <section class="container hero">
      <div class="hero-text">
        <p class="eyebrow">{{ $t('home.eyebrow') }}</p>
        <h1>{{ $t('home.title') }}</h1>
        <p class="lead">{{ $t('home.heroDescription') }}</p>
        <div class="cluster">
          <router-link to="/calcular/exigencias" class="btn btn-primary">{{ $t('home.ctaCalculate') }}</router-link>
          <router-link to="/formulacao-dieta" class="btn btn-secondary">{{ $t('home.ctaDiet') }}</router-link>
        </div>
      </div>

      <!-- Exemplo real de saída da calculadora (valores do domínio, não ilustrativos) -->
      <figure class="panel sample" :aria-label="$t('home.exampleTitle')">
        <figcaption class="sample-head">
          <span class="eyebrow">{{ $t('home.exampleTitle') }}</span>
          <span class="small muted">{{ $t('home.exampleAnimal') }}</span>
        </figcaption>
        <dl class="sample-rows">
          <div v-for="row in sampleRows" :key="row.key" class="sample-row" :class="{ 'is-key': row.key === 'intake' }">
            <dt>{{ $t(`home.example.${row.key}`) }}</dt>
            <dd class="num">{{ format(row.value) }} <span>{{ row.unit }}</span></dd>
          </div>
        </dl>
        <p class="sample-foot small muted">{{ $t('home.exampleNote') }}</p>
      </figure>
    </section>

    <section class="container tools" aria-labelledby="tools-title">
      <h2 id="tools-title" class="section-title">{{ $t('home.toolsTitle') }}</h2>
      <ol class="tool-list">
        <li v-for="(tool, index) in tools" :key="tool.key">
          <router-link :to="tool.to" class="tool">
            <span class="tool-index num">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="tool-body">
              <span class="tool-title">{{ $t(`home.tools.${tool.key}.title`) }}</span>
              <span class="tool-text">{{ $t(`home.tools.${tool.key}.text`) }}</span>
            </span>
            <span class="tool-go" aria-hidden="true">→</span>
          </router-link>
        </li>
      </ol>
      <p class="small muted">{{ $t('home.exportNote') }}</p>
    </section>

    <section class="container source" aria-labelledby="source-title">
      <div class="source-text">
        <h2 id="source-title" class="section-title">{{ $t('home.sourceTitle') }}</h2>
        <p>{{ $t('home.missionText') }}</p>
        <i18n-t scope="global" keypath="home.sourceText" tag="p">
          <template #book><em>{{ $t('home.sourceBook') }}</em></template>
        </i18n-t>
        <a :href="BOOK_URL" target="_blank" rel="noopener noreferrer">{{ $t('home.bookLink') }} ↗</a>
      </div>
      <a :href="BOOK_URL" target="_blank" rel="noopener noreferrer" class="book">
        <img src="@/assets/images/BRCO.jpg" :alt="$t('home.bookCoverAlt')" loading="lazy">
      </a>
    </section>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();
const BOOK_URL = 'https://brcaprinoseovinos.ufc.br/pt/pagina-de-introducao/';

// Resultado real da calculadora: caprino leiteiro, macho inteiro, 20 → 30 kg, GMD 150 g/d.
const sampleRows = [
  { key: 'intake', value: 851.39, unit: 'g/d' },
  { key: 'energy', value: 2.0, unit: 'Mcal/d' },
  { key: 'protein', value: 114.87, unit: 'g/d' },
];

const tools = [
  { key: 'requirements', to: '/calcular/exigencias' },
  { key: 'ndt', to: '/calcular/ndt' },
  { key: 'diet', to: '/formulacao-dieta' },
];

const format = (value) =>
  value.toLocaleString(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
</script>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 64px;
  align-items: center;
  padding-top: 72px;
  padding-bottom: 72px;
}

.hero h1 {
  margin: 12px 0 16px;
  font-size: clamp(2rem, 4vw, 2.75rem);
  line-height: 1.15;
  max-width: 18ch;
}

.lead {
  font-size: 1.0625rem;
  max-width: 52ch;
  margin-bottom: 28px;
}

/* Exemplo de resultado */
.sample { overflow: hidden; }

.sample-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
}

.sample-rows { margin: 0; }

.sample-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--line);
}

.sample-row.is-key { box-shadow: inset 3px 0 0 var(--brand); }

.sample-row dt { font-size: 0.875rem; color: var(--ink-2); }

.sample-row dd {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--ink);
}

.sample-row dd span { font-size: 0.8125rem; color: var(--ink-3); font-weight: 400; }

.sample-foot { padding: 12px 20px; background: var(--surface-2); }

/* Ferramentas */
.section-title {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--ink-3);
  letter-spacing: 0.02em;
  margin-bottom: 12px;
}

.tools { padding-bottom: 72px; }

.tool-list {
  list-style: none;
  border-top: 1px solid var(--line);
  margin-bottom: 16px;
}

.tool-list li { border-bottom: 1px solid var(--line); }

.tool {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) 32px;
  gap: 16px;
  align-items: baseline;
  padding: 24px 4px;
  color: inherit;
  text-decoration: none;
}

.tool-index { color: var(--ink-3); font-size: 0.875rem; }

.tool-body { display: flex; flex-direction: column; gap: 4px; }

.tool-title { font-size: 1.125rem; font-weight: 600; color: var(--ink); }

.tool-text { color: var(--ink-2); max-width: 70ch; }

.tool-go {
  color: var(--ink-3);
  font-size: 1.125rem;
  transition: transform var(--ease), color var(--ease);
}

.tool:hover .tool-title { color: var(--brand-text); }
.tool:hover .tool-go { color: var(--brand-text); transform: translateX(4px); }

/* Fonte */
.source {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 64px;
  align-items: start;
  padding-top: 56px;
  padding-bottom: 96px;
  border-top: 1px solid var(--line);
}

.source-text p { margin-bottom: 14px; max-width: 64ch; }

.book img {
  width: 100%;
  border-radius: var(--r-sm);
  border: 1px solid var(--line);
}

@media (max-width: 860px) {
  .hero { grid-template-columns: 1fr; gap: 40px; padding-top: 40px; padding-bottom: 48px; }
  .source { grid-template-columns: 1fr; gap: 24px; }
  .book { max-width: 180px; }
  .tool { grid-template-columns: 36px minmax(0, 1fr) 20px; padding: 20px 0; }
}
</style>
