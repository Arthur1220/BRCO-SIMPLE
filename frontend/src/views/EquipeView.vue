<template>
  <div class="container page">
    <header class="page-head">
      <h1>{{ $t('team.title') }}</h1>
      <p>{{ $t('team.intro') }}</p>
    </header>

    <ul class="team">
      <li v-for="member in teamMembers" :key="member.name">
        <a :href="member.pageUrl" target="_blank" rel="noopener noreferrer" class="member">
          <img :src="member.image" :alt="$t('team.photoAlt', { name: member.name })" loading="lazy" width="56" height="56">
          <span class="member-text">
            <span class="member-name">{{ member.name }}</span>
            <span class="member-role">{{ $t(`team.roles.${member.role}`) }}</span>
          </span>
          <span class="member-link">{{ member.pageUrl.includes('lattes') ? 'Lattes' : 'GitHub' }} ↗</span>
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup>
// role: chave em team.roles das mensagens de i18n
const teamMembers = [
  { name: 'Arthur Azevedo', role: 'development', image: 'https://avatars.githubusercontent.com/u/68549693?v=4', pageUrl: 'https://github.com/Arthur1220' },
  { name: 'Elzania Sales Pereira', role: 'sheepRequirements', image: 'http://servicosweb.cnpq.br/wspessoa/servletrecuperafoto?tipo=1&id=K4763473Z5', pageUrl: 'http://lattes.cnpq.br/4011686548866427' },
  { name: 'Izabelle Teixeira', role: 'goatRequirements', image: 'http://servicosweb.cnpq.br/wspessoa/servletrecuperafoto?tipo=1&id=K4794675J1', pageUrl: 'http://lattes.cnpq.br/6293663565260182' },
  { name: 'José Augusto Azevêdo', role: 'dryMatterIntake', image: 'http://servicosweb.cnpq.br/wspessoa/servletrecuperafoto?tipo=1&id=K4737784T8', pageUrl: 'http://lattes.cnpq.br/9391454312997091' },
  { name: 'Stefanie Santos', role: 'energyProtein', image: 'http://servicosweb.cnpq.br/wspessoa/servletrecuperafoto?tipo=1&id=K4734900T6', pageUrl: 'http://lattes.cnpq.br/6751268658250102' },
];
</script>

<style scoped>
.team {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid var(--line);
  column-gap: 32px;
}

.team li { border-bottom: 1px solid var(--line); }

.member {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 0;
  color: inherit;
  text-decoration: none;
}

.member img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--surface-2);
  filter: grayscale(0.2);
}

.member-text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.member-name { font-weight: 500; color: var(--ink); }
.member-role { font-size: 0.875rem; color: var(--ink-2); }

.member-link { font-size: 0.8125rem; color: var(--ink-3); white-space: nowrap; }
.member:hover .member-name,
.member:hover .member-link { color: var(--brand-text); }

@media (max-width: 720px) {
  .team { grid-template-columns: 1fr; }
}
</style>
