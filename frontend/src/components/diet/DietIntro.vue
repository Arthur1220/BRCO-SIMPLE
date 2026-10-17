<template>
  <section class="intro" aria-labelledby="diet-intro-title">
    <div class="intro-text">
      <h2 id="diet-intro-title">{{ $t('dietIntro.title') }}</h2>
      <p>{{ $t('dietIntro.text') }}</p>
      <button type="button" class="btn btn-primary" @click="store.nextStep()">{{ $t('dietIntro.start') }}</button>
    </div>

    <ol class="intro-steps">
      <li v-for="n in 4" :key="n">
        <span class="num">{{ String(n).padStart(2, '0') }}</span>
        <span>{{ $t(`dietIntro.step${n}`) }}</span>
      </li>
    </ol>
  </section>
</template>

<script setup>
import { useDietStore } from '@/stores/dietStore';
const store = useDietStore();
</script>

<style scoped>
.intro {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 48px;
  margin-top: 32px;
}

.intro h2 { font-size: 1.25rem; margin-bottom: 10px; }
.intro p { margin-bottom: 24px; max-width: 52ch; }

.intro-steps {
  list-style: none;
  border-top: 1px solid var(--line);
}

.intro-steps li {
  display: flex;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
}

.intro-steps .num { color: var(--ink-3); font-size: 0.8125rem; padding-top: 2px; }

@media (max-width: 860px) {
  .intro { grid-template-columns: 1fr; gap: 24px; }
}
</style>
