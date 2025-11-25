<template>
  <div class="equipe-page">
    <div class="container">
      <main class="equipe-main">
        <h1>Nossa Equipe</h1>
        <p class="intro-text">
          Conheça as mentes brilhantes e o esforço tecnológico e humano por trás deste projeto.
        </p>
        <div class="team-grid">
          <div
            class="team-card"
            v-for="(member, index) in teamMembers"
            :key="index"
            @click="redirectToPage(member.pageUrl)"
            :title="'Clique para ver o perfil de ' + member.name"
            :class="{ 'highlight-card': index === 0 }"
          >
            <div class="card-content">
              <div class="profile-image">
                <img :src="member.image" :alt="'Foto de ' + member.name" loading="lazy">
              </div>
              <div class="member-info">
                <h3>{{ member.name }}</h3>
                <p class="role">{{ member.role }}</p>
              </div>
              <div class="card-footer">
                <div class="social-link" v-if="member.pageUrl">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="link-icon">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                  <span>Ver Perfil</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
const teamMembers = [
  { name: 'Arthur Azevedo', role: 'Desenvolvimento & Design do Site', image: 'https://avatars.githubusercontent.com/u/68549693?v=4', pageUrl: 'https://github.com/Arthur1220' },
  { name: 'Elzania Sales Pereira', role: 'Coord. Exigências Nutricionais Ovinos', image: 'http://servicosweb.cnpq.br/wspessoa/servletrecuperafoto?tipo=1&id=K4763473Z5', pageUrl: 'http://lattes.cnpq.br/4011686548866427' },
  { name: 'Izabelle Teixeira', role: 'Coord. Exigências Nutricionais Caprinos', image: 'http://servicosweb.cnpq.br/wspessoa/servletrecuperafoto?tipo=1&id=K4794675J1', pageUrl: 'http://lattes.cnpq.br/6293663565260182' },
  { name: 'José Augusto Azevêdo', role: 'Coord. Predição Consumo Matéria Seca', image: 'http://servicosweb.cnpq.br/wspessoa/servletrecuperafoto?tipo=1&id=K4737784T8', pageUrl: 'http://lattes.cnpq.br/9391454312997091' },
  { name: 'Stefanie Santos', role: 'Coord. Valor Energético, Proteína Microbiana', image: 'http://servicosweb.cnpq.br/wspessoa/servletrecuperafoto?tipo=1&id=K4734900T6', pageUrl: 'http://lattes.cnpq.br/6751268658250102' }
];

const redirectToPage = (url) => {
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
</script>

<style scoped>
/* =========================================
   1. Layout & Estrutura da Página
   ========================================= */
.equipe-page {
  background-color: var(--white);
  color: var(--black);
}

.equipe-main {
  text-align: center;
  padding-top: 3rem;
  padding-bottom: 5rem;
}

/* =========================================
   2. Tipografia & Cabeçalho
   ========================================= */
h1 {
  color: var(--orange);
  font-size: 2.8rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.intro-text {
  font-size: 1.2rem;
  max-width: 750px;
  margin: 0 auto 4rem; /* Centraliza o bloco de texto */
  color: var(--black-light);
  line-height: 1.6;
}

/* =========================================
   3. Grid de Membros
   ========================================= */
.team-grid {
  display: flex;
  flex-wrap: wrap; /* Permite que os cards quebrem linha */
  justify-content: center;
  gap: 2rem;
}

/* =========================================
   4. Componente Card (Membro)
   ========================================= */
.team-card {
  width: 300px;
  background-color: var(--white);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.07);
  cursor: pointer;

  /* Borda superior colorida */
  border-top: 4px solid var(--orange);

  /* Layout Flex para empurrar o rodapé para baixo */
  display: flex;
  flex-direction: column;

  /* Transição suave para o efeito de hover */
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* Efeito de Elevação ao passar o mouse */
.team-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
}

.highlight-card {
  border-top-color: var(--orange);
}

.card-content {
  padding: 0 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

/* =========================================
   5. Imagem de Perfil (Avatar)
   ========================================= */
.profile-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;

  /* Técnica de Margem Negativa:
     Faz a imagem subir 60px para fora do container,
     ficando metade dentro e metade fora do card */
  margin: -60px auto 1rem;

  border: 6px solid var(--white); /* Cria um contorno branco ao redor da foto */
  background-color: var(--white);
  position: relative;
}

.profile-image img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* Garante que a foto preencha o círculo sem distorcer */
}

/* =========================================
   6. Informações do Membro
   ========================================= */
.member-info {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.member-info h3 {
  font-size: 1.4rem;
  margin: 0 0 0.5rem;
  color: var(--black);
}

.member-info .role {
  font-size: 0.95rem;
  color: var(--black-light);
  line-height: 1.5;
  margin-bottom: 1rem;
  flex-grow: 1; /* Empurra o rodapé para o final do card */
}

/* =========================================
   7. Rodapé do Card & Links Sociais
   ========================================= */
.card-footer {
  margin-top: auto;
}

.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--orange);
  font-weight: 500;
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  transition: background-color 0.3s, color 0.3s;
}

.link-icon {
  width: 18px;
  height: 18px;
}

/* Interação Avançada:
   Quando passar o mouse no CARD (.team-card:hover),
   o link social muda de cor automaticamente.
*/
.team-card:hover .social-link {
  background-color: var(--orange);
  color: var(--white);
}

.highlight-card:hover .social-link {
  background-color: var(--orange);
}
</style>
