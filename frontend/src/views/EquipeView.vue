<template>
  <div class="container">
    <main>
      <h1>Conheça nossa equipe</h1>
      <p class="intro-text">Nossa equipe é composta por profissionais dedicados e especialistas na área, responsáveis pela elaboração do livro e do conteúdo técnico deste portal.</p>
      <div class="team-grid">
        <div class="team-member" v-for="(member, index) in teamMembers" :key="index" @click="redirectToPage(member.pageUrl)">
          <img :src="member.image" :alt="'Foto de ' + member.name" class="profile-pic" />
          <div class="member-info">
            <h2>{{ member.name }}</h2>
            <p class="role">{{ member.role }}</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
const teamMembers = [
  { name: 'Arthur Azevedo', role: 'Estudante de Ciência da Computação (UESC) | Responsável pelo Desenvolvimento e Design do Site', image: 'https://avatars.githubusercontent.com/u/68549693?v=4', pageUrl: 'https://github.com/Arthur1220' },
  { name: 'Elzania Sales Pereira', role: 'Professora (UFC) | Coordenadora das Exigências Nutricionais de Energia, Proteína e Minerais para Ovinos Deslanados', image: 'http://servicosweb.cnpq.br/wspessoa/servletrecuperafoto?tipo=1&id=K4763473Z5', pageUrl: 'http://lattes.cnpq.br/4011686548866427' },
  { name: 'Izabelle Teixeira', role: 'Professora (University of Idaho) | Coordenadora das Exigências Nutricionais de Energia, Proteína e Minerais para Caprinos', image: 'http://servicosweb.cnpq.br/wspessoa/servletrecuperafoto?tipo=1&id=K4794675J1', pageUrl: 'http://lattes.cnpq.br/6293663565260182' },
  { name: 'José Augusto Azevêdo', role: 'Professor (UESC) | Coordenador da Predição do Consumo de Matéria Seca para Caprinos e Ovinos', image: 'http://servicosweb.cnpq.br/wspessoa/servletrecuperafoto?tipo=1&id=K4737784T8', pageUrl: 'http://lattes.cnpq.br/9391454312997091' },
  { name: 'Stefanie Santos', role: 'Professora (UFBA) | Coordenadora da Predição do Valor Energético de Alimentos e Dietas e da Predição da Síntese de Proteína Microbiana', image: 'http://servicosweb.cnpq.br/wspessoa/servletrecuperafoto?tipo=1&id=K4734900T6', pageUrl: 'http://lattes.cnpq.br/6751268658250102' }
];

const redirectToPage = (url) => {
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
};
</script>

<style scoped>
main {
  text-align: center;
}
h1 {
  color: var(--orange);
  font-size: 2.5rem;
}
.intro-text {
  font-size: 1.1rem;
  max-width: 800px;
  margin: 0 auto 3rem;
  color: var(--black-light);
}
.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}
.team-member {
  background-color: var(--white);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}
.team-member:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}
.profile-pic {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 1rem;
  border: 4px solid var(--grey-light);
}
.member-info h2 {
  font-size: 1.25rem;
  margin: 0 0 0.5rem;
}
.member-info .role {
  font-size: 0.9rem;
  color: var(--black-light);
  min-height: 80px; /* Para alinhar visualmente os cards */
}
</style>